import os
import re
import json
import logging
from typing import Dict, Any, List
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

# ── Structured finding format ──────────────────────────────────────
# Every agent returns: {"findings": [FindingDict, ...]}
# FindingDict = {
#     "file": "relative/path/to/file.py",
#     "name": "SQL Injection",
#     "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
#     "line_start": 5,
#     "line_end": 7,
#     "description": "What's wrong and why it matters"
# }

class BaseGeminiAgent:
    def __init__(self):
        self.api_key = os.environ.get("GEMINI_API_KEY")
        self.client = genai.Client(api_key=self.api_key) if self.api_key else None

    def analyze(self, repo_path: str) -> Dict[str, Any]:
        raise NotImplementedError("Subclasses must implement analyze()")

    def _walk_files(self, repo_path: str, extensions: List[str]) -> List[Dict[str, str]]:
        """Walk repo and return list of {path, relative_path, content}."""
        files = []
        for root, dirs, filenames in os.walk(repo_path):
            # Skip hidden dirs, node_modules, __pycache__, .git
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ('node_modules', '__pycache__', 'venv', '.venv', 'dist', 'build')]
            for fname in filenames:
                if any(fname.endswith(ext) for ext in extensions):
                    filepath = os.path.join(root, fname)
                    rel_path = os.path.relpath(filepath, repo_path).replace("\\", "/")
                    try:
                        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                            content = f.read()
                        if len(content) < 500_000:  # skip huge files
                            files.append({"path": filepath, "relative": rel_path, "content": content})
                    except Exception:
                        pass
        return files

    def _build_context(self, files: List[Dict[str, str]], max_chars: int = 60000) -> str:
        """Build a context string from files for LLM prompts."""
        context = ""
        for f in files:
            chunk = f"\n\n--- File: {f['relative']} ---\n{f['content']}"
            if len(context) + len(chunk) > max_chars:
                break
            context += chunk
        return context


# ═══════════════════════════════════════════════════════════════════
# SECRET AGENT — Hunts for hardcoded secrets, keys, passwords
# ═══════════════════════════════════════════════════════════════════

# Regex patterns for common secrets (real SAST-style scanning)
SECRET_PATTERNS = [
    # AWS
    (r'(?:AKIA[0-9A-Z]{16})', "AWS Access Key ID", "CRITICAL"),
    (r'(?:aws.{0,20}(?:secret|key).{0,10}[\"\']?\s*[:=]\s*[\"\'][A-Za-z0-9/+=]{40}[\"\'])', "AWS Secret Access Key", "CRITICAL"),
    # Generic API keys
    (r'(?:api[_-]?key|apikey)\s*[:=]\s*["\'][A-Za-z0-9_\-]{20,}["\']', "API Key", "HIGH"),
    (r'(?:secret[_-]?key|secretkey)\s*[:=]\s*["\'][A-Za-z0-9_\-]{16,}["\']', "Secret Key", "CRITICAL"),
    # Passwords in connection strings / variables
    (r'(?:password|passwd|pwd)\s*[:=]\s*["\'][^"\']{4,}["\']', "Hardcoded Password", "CRITICAL"),
    # Database URLs with credentials
    (r'(?:postgres|mysql|mongodb|redis)(?:ql)?:\/\/[^:]+:[^@]+@[^\s"\']+', "Database URL with Credentials", "CRITICAL"),
    # Private keys
    (r'-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----', "Private Key", "CRITICAL"),
    # JWT secrets
    (r'(?:jwt[_-]?secret|JWT_SECRET)\s*[:=]\s*["\'][^"\']{8,}["\']', "JWT Secret", "HIGH"),
    # Stripe
    (r'sk_live_[A-Za-z0-9]{20,}', "Stripe Live Secret Key", "CRITICAL"),
    (r'sk_test_[A-Za-z0-9]{20,}', "Stripe Test Secret Key", "MEDIUM"),
    # SendGrid
    (r'SG\.[A-Za-z0-9_\-]{22}\.[A-Za-z0-9_\-]{43}', "SendGrid API Key", "HIGH"),
    # Slack
    (r'xox[bpsorta]-[A-Za-z0-9\-]{10,}', "Slack Token", "HIGH"),
    # GitHub
    (r'gh[pousr]_[A-Za-z0-9_]{36,}', "GitHub Token", "HIGH"),
    # Generic token/secret assignment
    (r'(?:token|secret|auth)\s*[:=]\s*["\'][A-Za-z0-9_\-/.+=]{20,}["\']', "Hardcoded Token/Secret", "HIGH"),
]

class SecretAgent(BaseGeminiAgent):
    def analyze(self, repo_path: str) -> Dict[str, Any]:
        files = self._walk_files(repo_path, ['.py', '.js', '.ts', '.jsx', '.tsx', '.env', '.json', '.yml', '.yaml', '.cfg', '.ini', '.toml', '.conf'])
        
        if self.client:
            return self._analyze_with_gemini(files)
        
        return self._analyze_with_regex(files)
    
    def _analyze_with_regex(self, files: List[Dict[str, str]]) -> Dict[str, Any]:
        """Real regex-based secret scanning — no mocks, no bullshit."""
        findings = []
        for f in files:
            lines = f["content"].split("\n")
            for pattern, name, severity in SECRET_PATTERNS:
                for i, line in enumerate(lines):
                    if re.search(pattern, line, re.IGNORECASE):
                        # Skip comments that are obviously examples/docs
                        stripped = line.strip()
                        if stripped.startswith('#') and ('example' in stripped.lower() or 'todo' in stripped.lower()):
                            continue
                        findings.append({
                            "file": f["relative"],
                            "name": name,
                            "severity": severity,
                            "line_start": i + 1,
                            "line_end": i + 1,
                            "description": f"Detected {name} in {f['relative']} at line {i+1}. Hardcoded secrets in source code can be extracted by anyone with repo access. Use environment variables or a secrets manager."
                        })
        
        # Deduplicate (same file + same line = keep highest severity)
        seen = {}
        for f in findings:
            key = (f["file"], f["line_start"])
            if key not in seen or _sev_rank(f["severity"]) > _sev_rank(seen[key]["severity"]):
                seen[key] = f
        
        return {"findings": list(seen.values())}
    
    def _analyze_with_gemini(self, files: List[Dict[str, str]]) -> Dict[str, Any]:
        context = self._build_context(files)
        prompt = f"""You are SecretAgent, a specialized security scanner for SentriX AI.
Analyze the following source code for hardcoded secrets, API keys, passwords, tokens, and credentials.

IMPORTANT: Return ONLY a valid JSON array. Each element must have exactly these fields:
- "file": relative file path (string)
- "name": short name of the secret type (string, e.g. "AWS Secret Key", "Hardcoded Password")
- "severity": one of "CRITICAL", "HIGH", "MEDIUM", "LOW" (string)
- "line_start": first line number where the secret appears (integer, 1-indexed)
- "line_end": last line number (integer, 1-indexed, can equal line_start)
- "description": detailed explanation of the risk (string)

If no secrets are found, return an empty array [].

Code to analyze:
{context}"""
        
        try:
            response = self.client.models.generate_content(
                model='gemini-1.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(temperature=0.1, response_mime_type="application/json")
            )
            findings = json.loads(response.text)
            # Validate structure
            validated = []
            for f in findings:
                if all(k in f for k in ("file", "name", "severity", "line_start", "line_end", "description")):
                    validated.append(f)
            return {"findings": validated}
        except Exception as e:
            logger.error(f"SecretAgent Gemini call failed, falling back to regex: {e}")
            return self._analyze_with_regex(files)


# ═══════════════════════════════════════════════════════════════════
# CODE REVIEW AGENT — SAST for injection, XSS, bad crypto, etc.
# ═══════════════════════════════════════════════════════════════════

CODE_VULN_PATTERNS = [
    # SQL Injection
    (r'(?:execute|cursor\.execute|db\.execute|query)\s*\(\s*f["\']', "SQL Injection (f-string)", "CRITICAL", "User input interpolated directly into SQL query via f-string. Use parameterized queries."),
    (r'(?:execute|cursor\.execute|db\.execute|query)\s*\([^)]*%\s*\(', "SQL Injection (% format)", "CRITICAL", "String formatting used in SQL query. Use parameterized queries with placeholders."),
    (r'(?:execute|cursor\.execute|db\.execute|query)\s*\([^)]*\.format\(', "SQL Injection (.format())", "CRITICAL", "String .format() used in SQL query. Use parameterized queries."),
    (r'(?:execute|cursor\.execute|db\.execute|query)\s*\([^)]*\+\s*(?:request|user|input|param)', "SQL Injection (concatenation)", "CRITICAL", "String concatenation with user input in SQL query. Use parameterized queries."),
    # Command Injection
    (r'(?:os\.system|os\.popen|subprocess\.call|subprocess\.run|subprocess\.Popen)\s*\([^)]*(?:f["\']|\.format|\+\s*(?:request|user|input))', "Command Injection", "CRITICAL", "User input passed to shell command execution. Use subprocess with shell=False and argument lists."),
    (r'eval\s*\(', "Use of eval()", "HIGH", "eval() executes arbitrary code. If user input reaches this, it's remote code execution."),
    (r'exec\s*\(', "Use of exec()", "HIGH", "exec() executes arbitrary code strings. Extremely dangerous if user input is involved."),
    # XSS
    (r'innerHTML\s*=', "Potential XSS (innerHTML)", "HIGH", "Direct innerHTML assignment can execute injected scripts. Use textContent or sanitize input."),
    (r'dangerouslySetInnerHTML', "React dangerouslySetInnerHTML", "MEDIUM", "Bypasses React's XSS protection. Ensure content is sanitized before rendering."),
    # Weak crypto
    (r'(?:hashlib\.)?md5\s*\(', "Weak Hash (MD5)", "HIGH", "MD5 is cryptographically broken. Use SHA-256+ for integrity, bcrypt/argon2 for passwords."),
    (r'(?:hashlib\.)?sha1\s*\(', "Weak Hash (SHA-1)", "MEDIUM", "SHA-1 has known collision attacks. Use SHA-256 or better."),
    # Insecure deserialization
    (r'pickle\.loads?\s*\(', "Insecure Deserialization (pickle)", "CRITICAL", "pickle.load() on untrusted data allows arbitrary code execution."),
    (r'yaml\.load\s*\([^)]*(?!Loader)', "Insecure YAML Loading", "HIGH", "yaml.load() without safe Loader can execute arbitrary Python. Use yaml.safe_load()."),
    # Insecure randomness
    (r'random\.(?:random|randint|choice|randrange)\s*\(', "Insecure Randomness", "MEDIUM", "random module is not cryptographically secure. Use secrets module for security-sensitive values."),
    # Debug/verbose errors
    (r'DEBUG\s*=\s*True', "Debug Mode Enabled", "MEDIUM", "Debug mode exposes stack traces and internal state to attackers. Disable in production."),
    # JWT issues  
    (r'jwt\.decode\s*\([^)]*\)\s*$', "JWT Decode Without Algorithm", "CRITICAL", "jwt.decode() without algorithms parameter is vulnerable to algorithm confusion attacks."),
    (r'verify\s*=\s*False', "SSL Verification Disabled", "HIGH", "SSL certificate verification disabled. Vulnerable to man-in-the-middle attacks."),
    # CORS
    (r'Access-Control-Allow-Origin.*\*', "Wildcard CORS", "HIGH", "Wildcard CORS allows any domain to make authenticated cross-origin requests."),
    (r'CORS\s*\(\s*app\s*\)', "Unrestricted CORS", "MEDIUM", "CORS with no origin restrictions. Consider whitelisting specific domains."),
]

class CodeReviewAgent(BaseGeminiAgent):
    def analyze(self, repo_path: str) -> Dict[str, Any]:
        files = self._walk_files(repo_path, ['.py', '.js', '.ts', '.jsx', '.tsx', '.go', '.java', '.rb', '.php'])
        
        if self.client:
            return self._analyze_with_gemini(files)
        
        return self._analyze_with_regex(files)
    
    def _analyze_with_regex(self, files: List[Dict[str, str]]) -> Dict[str, Any]:
        """Real pattern-based SAST scanning."""
        findings = []
        for f in files:
            lines = f["content"].split("\n")
            for pattern, name, severity, desc in CODE_VULN_PATTERNS:
                for i, line in enumerate(lines):
                    if re.search(pattern, line, re.IGNORECASE):
                        # Skip test files for some lower-severity findings
                        if severity in ("MEDIUM", "LOW") and ('test' in f["relative"].lower() or 'spec' in f["relative"].lower()):
                            continue
                        findings.append({
                            "file": f["relative"],
                            "name": name,
                            "severity": severity,
                            "line_start": i + 1,
                            "line_end": i + 1,
                            "description": f"{desc} Found in {f['relative']} at line {i+1}."
                        })
        
        # Deduplicate
        seen = {}
        for f in findings:
            key = (f["file"], f["line_start"], f["name"])
            if key not in seen:
                seen[key] = f
        
        return {"findings": list(seen.values())}
    
    def _analyze_with_gemini(self, files: List[Dict[str, str]]) -> Dict[str, Any]:
        context = self._build_context(files)
        prompt = f"""You are CodeReviewAgent, performing Static Application Security Testing (SAST) for SentriX AI.
Analyze the code for: injection flaws (SQLi, command injection, XSS), insecure deserialization, weak cryptography, insecure randomness, debug mode, missing authentication, path traversal, and SSRF.

IMPORTANT: Return ONLY a valid JSON array. Each element must have exactly these fields:
- "file": relative file path (string)
- "name": short vulnerability name (string, e.g. "SQL Injection", "Command Injection")
- "severity": one of "CRITICAL", "HIGH", "MEDIUM", "LOW" (string)
- "line_start": first line number of the vulnerable code (integer, 1-indexed)
- "line_end": last line number of the vulnerable code (integer, 1-indexed)
- "description": detailed explanation including attack scenario and remediation (string)

If no vulnerabilities are found, return an empty array [].

Code to analyze:
{context}"""

        try:
            response = self.client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(temperature=0.2, response_mime_type="application/json")
            )
            findings = json.loads(response.text)
            validated = []
            for f in findings:
                if all(k in f for k in ("file", "name", "severity", "line_start", "line_end", "description")):
                    validated.append(f)
            return {"findings": validated}
        except Exception as e:
            logger.error(f"CodeReviewAgent Gemini call failed, falling back to regex: {e}")
            return self._analyze_with_regex(files)


# ═══════════════════════════════════════════════════════════════════
# DEPENDENCY AGENT — Scans package manifests for outdated/vuln deps
# ═══════════════════════════════════════════════════════════════════

# Known vulnerable package versions (curated list for regex mode)
KNOWN_VULN_PACKAGES = {
    # Python
    "django": {"below": "4.2", "issue": "Multiple security fixes in 4.2+", "severity": "HIGH"},
    "flask": {"below": "2.3.0", "issue": "Multiple XSS and path traversal fixes", "severity": "MEDIUM"},
    "requests": {"below": "2.31.0", "issue": "CVE-2023-32681 — information disclosure via Proxy-Authorization header", "severity": "HIGH"},
    "pyjwt": {"below": "2.4.0", "issue": "CVE-2022-29217 — algorithm confusion allows signature bypass", "severity": "HIGH"},
    "cryptography": {"below": "41.0.0", "issue": "Multiple OpenSSL and memory safety vulnerabilities", "severity": "HIGH"},
    "jinja2": {"below": "3.1.3", "issue": "CVE-2024-22195 — XSS via template rendering", "severity": "HIGH"},
    "werkzeug": {"below": "3.0.0", "issue": "Multiple security fixes including path traversal", "severity": "MEDIUM"},
    "sqlalchemy": {"below": "2.0.0", "issue": "Legacy API with potential SQL injection in text() usage", "severity": "MEDIUM"},
    "pillow": {"below": "10.0.0", "issue": "Multiple buffer overflow and DoS vulnerabilities", "severity": "HIGH"},
    "urllib3": {"below": "2.0.0", "issue": "CVE-2023-43804 — Cookie/Authorization header leak on redirect", "severity": "HIGH"},
    "numpy": {"below": "1.22.0", "issue": "CVE-2021-41495 — buffer overflow in array operations", "severity": "MEDIUM"},
    # JS/Node
    "express": {"below": "4.18.0", "issue": "Open redirect and prototype pollution fixes", "severity": "HIGH"},
    "lodash": {"below": "4.17.21", "issue": "CVE-2021-23337 — command injection via template", "severity": "CRITICAL"},
    "axios": {"below": "1.6.0", "issue": "CVE-2023-45857 — CSRF token leak", "severity": "HIGH"},
    "jsonwebtoken": {"below": "9.0.0", "issue": "CVE-2022-23529 — insecure key handling", "severity": "HIGH"},
}

class DependencyAgent(BaseGeminiAgent):
    def analyze(self, repo_path: str) -> Dict[str, Any]:
        files = self._walk_files(repo_path, [
            'requirements.txt', 'Pipfile', 'setup.py', 'setup.cfg', 'pyproject.toml',
            'package.json', 'package-lock.json', 'yarn.lock',
            'Gemfile', 'go.mod', 'pom.xml', 'build.gradle'
        ])
        
        if self.client:
            return self._analyze_with_gemini(files)
        
        return self._analyze_with_regex(files)
    
    def _analyze_with_regex(self, files: List[Dict[str, str]]) -> Dict[str, Any]:
        """Parse dependency files and check against known vulnerable versions."""
        findings = []
        
        for f in files:
            lines = f["content"].split("\n")
            
            if f["relative"].endswith("requirements.txt") or f["relative"].endswith(".txt"):
                for i, line in enumerate(lines):
                    line = line.strip()
                    if not line or line.startswith('#') or line.startswith('-'):
                        continue
                    # Parse: package==version or package>=version etc.
                    match = re.match(r'^([a-zA-Z0-9_\-]+)\s*[=<>~!]+\s*([0-9][0-9a-zA-Z.]*)', line)
                    if match:
                        pkg_name = match.group(1).lower().replace('-', '').replace('_', '')
                        pkg_version = match.group(2)
                        self._check_package(findings, f["relative"], i + 1, match.group(1), pkg_name, pkg_version)
            
            elif f["relative"].endswith("package.json"):
                try:
                    pkg_data = json.loads(f["content"])
                    all_deps = {}
                    all_deps.update(pkg_data.get("dependencies", {}))
                    all_deps.update(pkg_data.get("devDependencies", {}))
                    
                    for pkg, version_str in all_deps.items():
                        # Find the line number
                        line_num = 1
                        for i, line in enumerate(lines):
                            if f'"{pkg}"' in line:
                                line_num = i + 1
                                break
                        
                        clean_version = re.sub(r'[^0-9.]', '', version_str)
                        pkg_normalized = pkg.lower().replace('-', '').replace('_', '')
                        self._check_package(findings, f["relative"], line_num, pkg, pkg_normalized, clean_version)
                except json.JSONDecodeError:
                    pass
            
            elif f["relative"].endswith("pyproject.toml") or f["relative"].endswith("Pipfile"):
                for i, line in enumerate(lines):
                    match = re.match(r'^([a-zA-Z0-9_\-]+)\s*=\s*["\']?[=<>~]*([0-9][0-9a-zA-Z.]*)', line.strip())
                    if match:
                        pkg_name = match.group(1).lower().replace('-', '').replace('_', '')
                        pkg_version = match.group(2)
                        self._check_package(findings, f["relative"], i + 1, match.group(1), pkg_name, pkg_version)
        
        return {"findings": findings}
    
    def _check_package(self, findings, filepath, line_num, display_name, normalized_name, version):
        """Check a single package against the known vulnerability database."""
        if normalized_name in KNOWN_VULN_PACKAGES:
            vuln_info = KNOWN_VULN_PACKAGES[normalized_name]
            try:
                if self._version_lt(version, vuln_info["below"]):
                    findings.append({
                        "file": filepath,
                        "name": f"Vulnerable {display_name} ({version})",
                        "severity": vuln_info["severity"],
                        "line_start": line_num,
                        "line_end": line_num,
                        "description": f"{display_name} {version} is below the safe threshold ({vuln_info['below']}). {vuln_info['issue']}. Upgrade to >= {vuln_info['below']}."
                    })
            except Exception:
                pass
    
    def _version_lt(self, v1: str, v2: str) -> bool:
        """Simple version comparison: is v1 < v2?"""
        def parse(v):
            return [int(x) for x in re.findall(r'\d+', v)][:3]
        p1, p2 = parse(v1), parse(v2)
        # Pad to same length
        while len(p1) < 3: p1.append(0)
        while len(p2) < 3: p2.append(0)
        return p1 < p2
    
    def _analyze_with_gemini(self, files: List[Dict[str, str]]) -> Dict[str, Any]:
        context = self._build_context(files, max_chars=20000)
        prompt = f"""You are DependencyAgent for SentriX AI.
Analyze these dependency manifest files for packages with known CVEs, severely outdated versions, or abandoned/deprecated packages.

IMPORTANT: Return ONLY a valid JSON array. Each element must have exactly these fields:
- "file": relative file path of the manifest (string)
- "name": "Vulnerable <package_name> (<version>)" (string)
- "severity": one of "CRITICAL", "HIGH", "MEDIUM", "LOW" (string)
- "line_start": line number where the package appears (integer, 1-indexed)
- "line_end": same as line_start (integer)
- "description": CVE number if known, what the vulnerability is, and recommended version (string)

If no vulnerable dependencies are found, return an empty array [].

Manifest files:
{context}"""
        
        try:
            response = self.client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(temperature=0.1, response_mime_type="application/json")
            )
            findings = json.loads(response.text)
            validated = []
            for f in findings:
                if all(k in f for k in ("file", "name", "severity", "line_start", "line_end", "description")):
                    validated.append(f)
            return {"findings": validated}
        except Exception as e:
            logger.error(f"DependencyAgent Gemini call failed, falling back to regex: {e}")
            return self._analyze_with_regex(files)


# ── Helpers ────────────────────────────────────────────────────────

def _sev_rank(severity: str) -> int:
    return {"LOW": 0, "MEDIUM": 1, "HIGH": 2, "CRITICAL": 3}.get(severity, -1)

def get_agent_by_name(name: str):
    agents = {
        "SecretAgent": SecretAgent(),
        "CodeReviewAgent": CodeReviewAgent(),
        "DependencyAgent": DependencyAgent(),
    }
    return agents.get(name)
