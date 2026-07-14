# SentriX AI

**Autonomous AI Security Engineer**
Powered by Google Gemini 3.1 Flash Lite + Advanced Agent Swarm

---

## Vision

Imagine every codebase having a dedicated, hyper-vigilant Security Engineer who:
- Maps out your entire project architecture instantly.
- Uncovers deep-rooted vulnerabilities across dependencies, secrets, and core logic.
- Speaks directly with your developers to explain security risks in plain English.
- Autonomously generates secure, drop-in replacement code patches for critical flaws.

SentriX AI is that engineer. It doesn't just alert you to vulnerabilities; it actively fixes them.

## The Agent Swarm Architecture

The core of SentriX AI is driven by a specialized multi-agent swarm architecture. Instead of a monolithic analysis pass, specialized AI personas tackle different attack vectors:

*   **Secret Agent:** Deep-scans code and configuration files for exposed API keys, database credentials, and hardcoded JWT secrets.
*   **Dependency Agent:** Cross-references `package.json`, `requirements.txt`, and other manifests against known CVE databases to flag vulnerable or abandoned libraries.
*   **Code Review Agent:** Performs Static Application Security Testing (SAST) to uncover injection flaws (SQLi, XSS, Command Injection), insecure deserialization, weak cryptography, and SSRF vulnerabilities.

## Core Platform Features

### Instant Vulnerability Mapping
Paste any public repository URL into the SentriX engine. The swarm will immediately download, parse, and analyze the codebase, surfacing a prioritized list of critical, high, medium, and low risks.

### AI Patch Generation
Stop writing boilerplate fixes. The Vulnerability Explorer allows you to instantly generate secure, drop-in replacement patches using the **Gemini 3.1 Flash Lite** engine. Click a button, wait three seconds, and copy your secured code block.

### Interactive Security Assistant
Every scan comes paired with the SentriX Chat Agent. Don't understand why an MD5 hash is vulnerable? Just open the chat and ask the agent to explain the attack vector and how to resolve it in your specific language.

### Secure Storage Containers
Every user account receives a sandboxed, isolated storage container backed by MongoDB. Scan histories are securely encrypted and capped to ensure data freshness. Users have complete, autonomous control over their data footprint via the **Danger Zone** settings, allowing one-click data purges and account deletion.

## Technology Stack

- **Frontend:** Next.js (App Router), React 18, Tailwind CSS, Framer Motion, Monaco Editor, Clerk Auth
- **Backend:** Flask, Python 3, Gunicorn
- **Database:** MongoDB (Motor Async)
- **AI Engine:** Google Gemini (Generative Language API)

---

*© 2026 SentriX AI. All Rights Reserved. This is a proprietary, closed-source security platform.*
