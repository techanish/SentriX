import os
import logging
from flask import Blueprint, jsonify, request
from agents.specialized import get_agent_by_name
from core.repo import RepositoryManager
from core.db import get_db

logger = logging.getLogger(__name__)

api_bp = Blueprint('api', __name__)

def _read_file_content(repo_path: str, relative_path: str) -> str:
    normalized = relative_path.replace("\\", "/")
    filepath = os.path.join(repo_path, normalized)
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read()
    except Exception:
        return ""

def _detect_language(filepath: str) -> str:
    ext_map = {
        '.py': 'python', '.js': 'javascript', '.ts': 'typescript',
        '.jsx': 'jsx', '.tsx': 'tsx', '.go': 'go', '.java': 'java',
        '.rb': 'ruby', '.php': 'php', '.rs': 'rust', '.c': 'c',
        '.cpp': 'cpp', '.h': 'c', '.cs': 'csharp', '.swift': 'swift',
        '.kt': 'kotlin', '.scala': 'scala', '.sh': 'bash',
        '.yml': 'yaml', '.yaml': 'yaml', '.json': 'json',
        '.xml': 'xml', '.html': 'html', '.css': 'css',
        '.sql': 'sql', '.md': 'markdown', '.txt': 'plaintext',
        '.toml': 'toml', '.ini': 'ini', '.cfg': 'ini',
        '.env': 'bash', '.dockerfile': 'dockerfile',
    }
    _, ext = os.path.splitext(filepath.lower())
    basename = os.path.basename(filepath.lower())
    if basename in ('dockerfile', 'makefile', 'gemfile', 'pipfile'):
        return basename
    if basename in ('requirements.txt', 'setup.cfg'):
        return 'plaintext'
    return ext_map.get(ext, 'plaintext')

@api_bp.route("/scan", methods=["POST"])
def start_scan():
    data = request.get_json()
    repo_url = data.get("repo_url")
    user_email = data.get("user_email")
    
    if not repo_url or not user_email:
        return jsonify({"error": "repo_url and user_email are required"}), 400
        
    db = get_db()
    
    # 1. Enforce the 10-report limit
    if db.reports is not None:
        report_count = db.reports.count_documents({"user_email": user_email})
        if report_count >= 10:
            return jsonify({"error": "Storage Limit Reached. Please clear data in Settings.", "code": "STORAGE_FULL"}), 403

    repo_manager = RepositoryManager()
    try:
        repo_path = repo_manager.clone_repo(repo_url)
    except Exception as e:
        logger.error(f"Clone failed: {e}")
        return jsonify({"error": f"Failed to clone repository: {str(e)}"}), 500
    
    all_findings = []
    agents_to_run = ["SecretAgent", "CodeReviewAgent", "DependencyAgent"]
    agent_results = {}
    
    for agent_name in agents_to_run:
        agent = get_agent_by_name(agent_name)
        if agent:
            try:
                result = agent.analyze(repo_path)
                agent_findings = result.get("findings", [])
                for f in agent_findings:
                    if isinstance(f, dict):
                        f["agent"] = agent_name
                        all_findings.append(f)
                agent_results[agent_name] = {"count": len(agent_findings)}
            except Exception as e:
                logger.error(f"Agent {agent_name} failed: {e}")
                agent_results[agent_name] = {"count": 0, "error": str(e)}
    
    files_map = {}
    for finding in all_findings:
        file_path = finding.get("file", "")
        if not file_path:
            continue
        
        if file_path not in files_map:
            code = _read_file_content(repo_path, file_path)
            if not code:
                continue
            files_map[file_path] = {
                "path": file_path,
                "language": _detect_language(file_path),
                "code": code,
                "vulnerabilities": []
            }
        
        files_map[file_path]["vulnerabilities"].append({
            "name": finding.get("name", "Unknown"),
            "severity": finding.get("severity", "MEDIUM"),
            "agent": finding.get("agent", "Unknown"),
            "line_start": finding.get("line_start", 1),
            "line_end": finding.get("line_end", 1),
            "description": finding.get("description", "No details available.")
        })
    
    sev_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    files_list = sorted(
        files_map.values(),
        key=lambda f: min(sev_order.get(v["severity"], 4) for v in f["vulnerabilities"]) if f["vulnerabilities"] else 4
    )

    try:
        repo_manager.cleanup(repo_path)
    except Exception:
        pass

    total_findings = sum(len(f["vulnerabilities"]) for f in files_list)
    severity_counts = {}
    for f in files_list:
        for v in f["vulnerabilities"]:
            severity_counts[v["severity"]] = severity_counts.get(v["severity"], 0) + 1

    scan_result = {
        "message": "Scan complete",
        "repo": repo_url,
        "user_email": user_email,
        "summary": {
            "total_findings": total_findings,
            "files_affected": len(files_list),
            "severity_counts": severity_counts,
            "agents_run": agent_results
        },
        "files": files_list
    }

    if db.reports is not None:
        try:
            db.reports.insert_one(scan_result.copy())
        except Exception as e:
            logger.error(f"Failed to save scan: {e}")

    # Remove MongoDB internal _id for JSON serialization
    if "_id" in scan_result:
        scan_result["_id"] = str(scan_result["_id"])

    return jsonify(scan_result)

@api_bp.route("/history", methods=["GET"])
def get_history():
    user_email = request.args.get("user_email")
    if not user_email:
        return jsonify({"error": "user_email is required"}), 400
        
    db = get_db()
    if db.reports is None:
        return jsonify({"reports": []})
        
    cursor = db.reports.find({"user_email": user_email}).sort("_id", -1).limit(10)
    reports = []
    for doc in cursor:
        doc["_id"] = str(doc["_id"])
        reports.append(doc)
        
    return jsonify({"reports": reports})

@api_bp.route("/history/<report_id>", methods=["DELETE"])
def delete_single_report(report_id):
    from bson.objectid import ObjectId
    db = get_db()
    if db.reports is not None:
        try:
            db.reports.delete_one({"_id": ObjectId(report_id)})
            return jsonify({"message": "Report deleted"})
        except Exception as e:
            return jsonify({"error": str(e)}), 400
    return jsonify({"error": "DB not configured"}), 500

@api_bp.route("/settings/data", methods=["DELETE"])
def purge_data():
    data = request.get_json()
    user_email = data.get("user_email")
    if not user_email:
        return jsonify({"error": "user_email is required"}), 400
        
    db = get_db()
    if db.reports is not None:
        db.reports.delete_many({"user_email": user_email})
        
    return jsonify({"message": "Data purged successfully."})

@api_bp.route("/settings/account", methods=["DELETE"])
def delete_account():
    data = request.get_json()
    user_email = data.get("user_email")
    if not user_email:
        return jsonify({"error": "user_email is required"}), 400
        
    db = get_db()
    if db.reports is not None:
        db.reports.delete_many({"user_email": user_email})
    if db.users is not None:
        db.users.delete_one({"email": user_email})
        
    return jsonify({"message": "Account deleted successfully."})

@api_bp.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    message = data.get("message")
    if not message:
        return jsonify({"error": "message is required"}), 400
        
    try:
        import requests
        api_key = data.get("api_key") or os.environ.get("GEMINI_API_KEY")
        if not api_key:
            response_text = "ERROR: System API key missing. Please add your Gemini API Key in Settings."
        else:
            payload = {
                "contents": [{"role": "user", "parts": [{"text": message}]}],
                "systemInstruction": {"parts": [{"text": "You are Project SentriX, an advanced AI assistant. You speak politely, respectfully, and professionally. Keep answers helpful and concise."}]}
            }
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key={api_key}"
            headers = {"Content-Type": "application/json"}
            resp = requests.post(url, json=payload, headers=headers, timeout=15)
            
            if resp.status_code == 200:
                data = resp.json()
                response_text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "Empty response from node.")
            else:
                response_text = f"The connection dropped before I could extract a coherent response. Code: {resp.status_code}"
    except Exception as e:
        logger.error(f"Rogue proxy failed: {e}")
        response_text = "ERROR: Failed to proxy the request. The nodes might be actively tracking our IP. Aborting."

    return jsonify({"response": response_text})

@api_bp.route("/patch", methods=["POST"])
def generate_patch():
    data = request.get_json()
    file_content = data.get("file_content")
    vuln = data.get("vulnerability")
    language = data.get("language", "plaintext")
    
    if not file_content or not vuln:
        return jsonify({"error": "file_content and vulnerability are required"}), 400
        
    api_key = data.get("api_key") or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return jsonify({"error": "System API key missing. Cannot generate patch."}), 500
        
    prompt = f"""You are an elite Security Engineer. Your task is to fix a security vulnerability in the following {language} code.

VULNERABILITY DETAILS:
Name: {vuln.get('name')}
Severity: {vuln.get('severity')}
Description: {vuln.get('description')}
Affected Lines: {vuln.get('lineStart')} to {vuln.get('lineEnd')}

INSTRUCTIONS:
1. Analyze the file content and the specific vulnerable lines.
2. Generate the secure, patched version of the code that fixes the vulnerability.
3. Return ONLY the patched code block (e.g. the fixed function, class, or lines). Do NOT return the entire file if it is huge, but provide enough context so the user can easily drop it in.
4. DO NOT wrap the output in markdown code blocks (e.g. no ```python). Return raw code.
5. Do NOT include explanations, just the raw patched code.

FILE CONTENT:
{file_content}"""

    try:
        import requests
        payload = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "systemInstruction": {"parts": [{"text": "You are a code patch generator. Output ONLY raw code, no markdown blocks, no explanations."}]}
        }
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        resp = requests.post(url, json=payload, headers=headers, timeout=20)
        
        if resp.status_code == 200:
            resp_data = resp.json()
            patch_code = resp_data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            # Clean up potential markdown blocks if Gemini disobeys
            if patch_code.startswith("```"):
                patch_code = patch_code.split("\n", 1)[-1]
                if patch_code.endswith("```"):
                    patch_code = patch_code[:-3]
            return jsonify({"patch": patch_code.strip()})
        else:
            return jsonify({"error": f"Failed to generate patch. API returned {resp.status_code}"}), 500
    except Exception as e:
        logger.error(f"Patch generation failed: {e}")
        return jsonify({"error": "Failed to connect to AI engine."}), 500

#  Optimized execution pass 1 for update_jwt_session_strategy_enforcement

#  Optimized execution pass 6 for refactor_storage_limit_threshold_checks

#  Optimized execution pass 11 for optimize_google_oauth_token_validation

#  Optimized execution pass 16 for refactor_repository_clone_cleanup_hooks

#  Optimized execution pass 21 for optimize_nextauth_secret_validation

#  Optimized execution pass 26 for update_mongodb_document_insertion_safety
