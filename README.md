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


## Enterprise Architecture Updates
- Add architecture overview to docs
- Document NextAuth integration steps
- Explain MongoDB container limits
- Document OAuth environment variables
- Detail the 10-report storage cap
- Explain data purging in settings
- Document the GET /history endpoint
- Document the POST /scan payload updates
- Detail the frontend middleware logic
- Explain the protected route redirects
- Document GitHub SSO configuration
- Document Google SSO configuration
- Explain MongoDB unique indexing on emails
- Document the DELETE /settings/data route
- Document the DELETE /settings/account route
- Explain JSON serialization stripping for MongoDB
- Add troubleshooting for Vercel builds
- Document Lucide SVG inline replacements
- Explain the global layout persistence
- Document the dark mode typography plugin
- Add developer attribution details
- Finalize enterprise documentation layout
