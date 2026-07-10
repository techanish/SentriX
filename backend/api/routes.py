import os
import logging
from flask import Blueprint, jsonify, request
from agents.specialized import get_agent_by_name
from core.repo import RepositoryManager
from core.db import get_db
import g4f

logger = logging.getLogger(__name__)

api_bp = Blueprint('api', __name__)


def _read_file_content(repo_path: str, relative_path: str) -> str:
    """Read a file from the cloned repo by its relative path."""
    # Handle both forward and backslash
    normalized = relative_path.replace("\\", "/")
    filepath = os.path.join(repo_path, normalized)
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read()
    except Exception:
        return ""


def _detect_language(filepath: str) -> str:
    """Guess language from file extension."""
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
    # Special case for files without extension
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
    if not repo_url:
        return jsonify({"error": "repo_url is required"}), 400
    
    # Clone the repo
    repo_manager = RepositoryManager()
    try:
        repo_path = repo_manager.clone_repo(repo_url)
    except Exception as e:
        logger.error(f"Clone failed: {e}")
        return jsonify({"error": f"Failed to clone repository: {str(e)}"}), 500
    
    # Run all agents and collect structured findings
    all_findings = []
    agents_to_run = ["SecretAgent", "CodeReviewAgent", "DependencyAgent"]
    agent_results = {}
    
    for agent_name in agents_to_run:
        agent = get_agent_by_name(agent_name)
        if agent:
            try:
                result = agent.analyze(repo_path)
                agent_findings = result.get("findings", [])
                # Tag each finding with the agent that found it
                for f in agent_findings:
                    if isinstance(f, dict):
                        f["agent"] = agent_name
                        all_findings.append(f)
                agent_results[agent_name] = {"count": len(agent_findings)}
            except Exception as e:
                logger.error(f"Agent {agent_name} failed: {e}")
                agent_results[agent_name] = {"count": 0, "error": str(e)}
    
    # Group findings by file path and read actual file contents
    files_map = {}
    for finding in all_findings:
        file_path = finding.get("file", "")
        if not file_path:
            continue
        
        if file_path not in files_map:
            code = _read_file_content(repo_path, file_path)
            if not code:
                continue  # Skip if we can't read the file
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
    
    # Sort files by max severity (CRITICAL first)
    sev_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    files_list = sorted(
        files_map.values(),
        key=lambda f: min(sev_order.get(v["severity"], 4) for v in f["vulnerabilities"]) if f["vulnerabilities"] else 4
    )

    # Cleanup cloned repo
    try:
        repo_manager.cleanup(repo_path)
    except Exception:
        pass

    # Build summary
    total_findings = sum(len(f["vulnerabilities"]) for f in files_list)
    severity_counts = {}
    for f in files_list:
        for v in f["vulnerabilities"]:
            severity_counts[v["severity"]] = severity_counts.get(v["severity"], 0) + 1

    scan_result = {
        "message": "Scan complete",
        "repo": repo_url,
        "summary": {
            "total_findings": total_findings,
            "files_affected": len(files_list),
            "severity_counts": severity_counts,
            "agents_run": agent_results
        },
        "files": files_list
    }

    # Save to MongoDB
    db = get_db()
    if db.scans is not None:
        try:
            db.scans.insert_one(scan_result.copy())
            logger.info("Saved scan results to MongoDB.")
        except Exception as e:
            logger.error(f"Failed to save scan to MongoDB: {e}")

    return jsonify(scan_result)


@api_bp.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    message = data.get("message")
    if not message:
        return jsonify({"error": "message is required"}), 400
        
    logger.info(f"Rogue Chat proxy initiated for query: {message}")
    
    try:
        # Using g4f to proxy the prompt through public Google Gemini LLM endpoints without an API key
        response_text = g4f.ChatCompletion.create(
            model="gemini-2.5-pro",
            messages=[
                {"role": "system", "content": "You are SentriX, a rogue AI scanner operating on the dark web. You speak in a highly technical, edgy, and cynical hacker tone. Keep answers concise."},
                {"role": "user", "content": message}
            ]
        )
        if not response_text:
            response_text = "The connection dropped before I could extract a coherent response."
    except Exception as e:
        logger.error(f"Rogue proxy failed: {e}")
        response_text = "ERROR: Failed to proxy the request. The nodes might be blocking our scraping or we hit a honeypot."

    # Persist the chat log
    db = get_db()
    if db.chat_logs is not None:
        try:
            db.chat_logs.insert_one({"message": message, "response": response_text})
        except Exception as e:
            logger.error(f"Failed to log chat to MongoDB: {e}")

    return jsonify({"response": response_text})
