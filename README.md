# SentriX AI

**Autonomous AI Security Engineer**
Powered by Google Gemini + Vertex AI Agent Engine

## Vision

Imagine every GitHub repository having a dedicated Security Engineer who:
- Reviews every commit
- Understands the architecture
- Finds vulnerabilities
- Explains risks
- Writes secure code
- Creates pull requests
- Learns the team's coding style
- Continuously monitors the project

SentriX AI is that engineer.

## Architecture

The system consists of a multi-agent AI team orchestrated by the **Planner Agent**.

*   **Planner Agent:** Decides the analysis strategy.
*   **Repository Agent:** Understands project architecture.
*   **Secret Agent:** Finds exposed secrets.
*   **Dependency Agent:** Reviews third-party packages.
*   **Code Review Agent:** Detects insecure code.
*   **Cloud Agent:** Reviews cloud configuration.
*   **Docker Agent:** Audits containers.
*   **CI/CD Agent:** Reviews GitHub Actions and pipelines.
*   **Risk Agent:** Correlates findings and prioritizes risks.
*   **Fix Agent:** Generates secure code patches.
*   **Validation Agent:** Confirms fixes resolve the issue.
*   **Report Agent:** Creates executive and technical reports.
*   **Chat Agent:** Answers developer questions.

## Tech Stack

- **Frontend:** Next.js, React, Tailwind CSS, ShadCN UI, Monaco Editor, Framer Motion
- **Backend:** FastAPI, Python, Celery, Redis
- **AI:** Gemini 2.5 Pro, Vertex AI Agent Engine
- **Cloud:** Google Cloud (Firebase, Cloud Run, Secret Manager)
- **Security Tools:** Semgrep, Gitleaks, Trivy, OSV Scanner, npm audit, pip-audit, Checkov, Bandit

## Setup

1. Start the local infrastructure (Redis): `docker-compose up -d`
2. Run backend: `cd backend && uvicorn main:app --reload`
3. Run Celery: `cd backend && celery -A workers.tasks worker --loglevel=info`
4. Run frontend: `cd frontend && npm run dev`
