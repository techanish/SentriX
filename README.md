<div align="center">
  <img src="frontend/public/SentriX.png" width="180" alt="SentriX AI Logo" />
  

**The Autonomous AI Security Engineer for Modern Codebases**

[![Built with React](https://img.shields.io/badge/Built_with-React_18-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Powered by Next.js](https://img.shields.io/badge/Powered_by-Next.js-000000?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Backend Flask](https://img.shields.io/badge/Backend-Flask-000000?style=for-the-badge&logo=flask)](https://flask.palletsprojects.com/)
[![Database MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![AI Gemini](https://img.shields.io/badge/AI_Engine-Gemini_3.1_Flash_Lite-4285F4?style=for-the-badge&logo=google)](https://deepmind.google/technologies/gemini/)

*SentriX AI doesn't just alert you to vulnerabilities; it actively writes the code to fix them.*

</div>

---

## 🚀 The Vision

Imagine every codebase having a dedicated, hyper-vigilant Security Engineer who works at the speed of light. An engineer who:
- Maps out your entire project architecture instantly.
- Uncovers deep-rooted vulnerabilities across dependencies, secrets, and core logic.
- Speaks directly with your developers to explain security risks in plain English.
- **Autonomously generates secure, drop-in replacement code patches for critical flaws.**

---

## 🧠 The Agent Swarm Architecture

The core of SentriX AI is driven by a specialized multi-agent swarm architecture. Instead of a monolithic analysis pass, specialized AI personas tackle different attack vectors in parallel:

| Agent Persona | Focus Area | Capability |
| :--- | :--- | :--- |
| 🕵️ **Secret Agent** | Hardcoded Credentials | Deep-scans code and configuration files for exposed API keys, database credentials, and hardcoded JWT secrets. |
| 📦 **Dependency Agent** | Supply Chain Security | Cross-references manifests (`package.json`, `requirements.txt`) against known CVE databases to flag vulnerable libraries. |
| 🛡️ **Code Review Agent** | Static Analysis (SAST) | Uncovers injection flaws (SQLi, XSS, Command Injection), insecure deserialization, weak cryptography, and SSRF vulnerabilities. |

---

## ✨ Core Platform Features

### 🔍 Instant Vulnerability Mapping
Paste any public repository URL into the SentriX engine. The swarm will immediately download, parse, and analyze the codebase, surfacing a prioritized list of **CRITICAL**, **HIGH**, **MEDIUM**, and **LOW** risks with stunning visual clarity.

### 🪄 AI Patch Generation
Stop writing boilerplate security fixes. The interactive Vulnerability Explorer allows you to instantly generate secure, drop-in replacement patches using the **Gemini 3.1 Flash Lite** engine. Click a button, wait three seconds, and copy your newly secured code block.

### 💬 Interactive Security Assistant
Every scan comes paired with the SentriX Chat Agent. Don't understand why an MD5 hash is vulnerable? Open the chat interface and ask the agent to explain the attack vector and how to resolve it specifically in your project's programming language.

### 🗄️ Secure Storage Containers
Every user account receives an isolated storage container backed by MongoDB. Scan histories are securely stored and capped to ensure data freshness. Users have complete, autonomous control over their data footprint via the **Danger Zone** settings, allowing one-click data purges and complete account deletion.

---

## 🛠️ Technology Stack

<details>
<summary><b>Click to expand architecture details</b></summary>
<br>

- **Frontend Application**
  - Next.js (App Router) & React 18
  - Tailwind CSS & Framer Motion for dynamic animations
  - Monaco Editor for premium code visualization
  - Clerk Authentication for robust identity management
- **Backend Infrastructure**
  - Python 3 & Flask (Served via Gunicorn)
  - Railway Deployment
- **Database Layer**
  - MongoDB with Motor Async Driver
- **AI Integration**
  - Google Gemini Generative Language API
</details>

---

<div align="center">
  <i>© 2026 SentriX AI. All Rights Reserved. <br> This is a proprietary, closed-source security platform.</i>
</div>
