"use client";

import { Book, Server, Terminal, Key, Database, Shield, ShieldCheck, GitBranch, Cpu, Zap, Lock, ChevronRight, ArrowRight, FileText, Users, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

type DocSection = "intro" | "how-it-works" | "architecture" | "storage" | "api" | "auth";

const sections = [
  { id: "intro" as DocSection, label: "Introduction", icon: Book, group: "Getting Started" },
  { id: "how-it-works" as DocSection, label: "How It Works", icon: Zap, group: "Getting Started" },
  { id: "architecture" as DocSection, label: "Architecture", icon: Server, group: "Getting Started" },
  { id: "storage" as DocSection, label: "Storage & Limits", icon: Database, group: "Platform" },
  { id: "api" as DocSection, label: "API Reference", icon: Terminal, group: "Developer" },
  { id: "auth" as DocSection, label: "Authentication", icon: Key, group: "Developer" },
];

function CodeBlock({ children, title, lang }: { children: string; title?: string; lang?: string }) {
  return (
    <div className="rounded-xl overflow-hidden border border-white/[0.06] my-4">
      {title && (
        <div className="bg-white/[0.03] px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
          <span className="font-mono text-xs text-cyan-400">{title}</span>
          {lang && <span className="text-[10px] text-neutral-600 bg-white/5 px-2 py-0.5 rounded">{lang}</span>}
        </div>
      )}
      <pre className="bg-[#080808] p-4 font-mono text-sm text-neutral-300 overflow-x-auto leading-relaxed">
        {children}
      </pre>
    </div>
  );
}

function InfoCard({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="canvas-card p-5 rounded-xl space-y-2">
      <div className="flex items-center gap-2.5">
        <div className="p-2 bg-emerald-500/10 rounded-lg">
          <Icon className="w-4 h-4 text-emerald-500" />
        </div>
        <h4 className="font-bold text-sm">{title}</h4>
      </div>
      <p className="text-xs text-neutral-500 leading-relaxed">{children}</p>
    </div>
  );
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState<DocSection>("intro");

  const grouped = sections.reduce((acc, s) => {
    if (!acc[s.group]) acc[s.group] = [];
    acc[s.group].push(s);
    return acc;
  }, {} as Record<string, typeof sections>);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 flex flex-col md:flex-row gap-10 min-h-[80vh]">

      {/* Sidebar */}
      <aside className="w-full md:w-56 shrink-0 space-y-6">
        {Object.entries(grouped).map(([group, items]) => (
          <div key={group}>
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-600 mb-2.5 px-3">{group}</h2>
            <nav className="space-y-0.5">
              {items.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all ${
                    activeSection === item.id
                      ? "bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20"
                      : "text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.03] border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2"><item.icon className="w-3.5 h-3.5" /> {item.label}</div>
                  {activeSection === item.id && <ChevronRight className="w-3 h-3" />}
                </button>
              ))}
            </nav>
          </div>
        ))}
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <AnimatePresence mode="wait">

          {/* ═══ INTRODUCTION ═══ */}
          {activeSection === "intro" && (
            <motion.div key="intro" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
              <div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-4 flex items-center gap-3">
                  <ShieldCheck className="w-8 h-8 text-emerald-500" />
                  SentriX Documentation
                </h1>
                <p className="text-neutral-400 text-sm leading-relaxed max-w-2xl">
                  SentriX is a next-generation autonomous security scanner powered by a coordinated swarm of specialized AI agents. It maps your repository architecture, identifies vulnerabilities at the code level, correlates findings across multiple attack surfaces, and provides line-specific remediation guidance — all in under 60 seconds.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoCard icon={Cpu} title="AI Agent Swarm">
                  Four specialized agents (Planner, Secret, Dependency, Code Review) operate in parallel to analyze your codebase from every angle simultaneously.
                </InfoCard>
                <InfoCard icon={Shield} title="Multi-Vector Analysis">
                  SentriX doesn&apos;t just scan for one type of vulnerability. It cross-references secrets exposure, supply chain risks, and code-level flaws to produce a holistic risk assessment.
                </InfoCard>
                <InfoCard icon={GitBranch} title="Repository-Native">
                  Paste any public GitHub repository URL. SentriX clones it, parses the file tree, and feeds relevant code into each agent for targeted analysis.
                </InfoCard>
                <InfoCard icon={FileText} title="Actionable Reports">
                  Every finding includes the exact file path, affected line numbers, severity classification, and a detailed description. Reports are stored in your personal container for future reference.
                </InfoCard>
              </div>

              <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-xs text-emerald-400/80 leading-relaxed">
                <span className="font-bold text-emerald-400">Who is SentriX for?</span> — Security engineers, DevOps teams, open-source maintainers, and developers who want to catch vulnerabilities before they reach production. SentriX is designed to integrate into your workflow as a pre-merge check or periodic audit tool.
              </div>
            </motion.div>
          )}

          {/* ═══ HOW IT WORKS ═══ */}
          {activeSection === "how-it-works" && (
            <motion.div key="how-it-works" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
              <div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">How It Works</h1>
                <p className="text-neutral-400 text-sm leading-relaxed max-w-2xl">
                  SentriX follows a five-stage pipeline from repository ingestion to report generation. The entire process is fully automated and typically completes in 30-90 seconds.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { step: "1", title: "Repository Ingestion", desc: "You paste a public GitHub URL. The Planner Agent clones the repository, maps the file tree, and identifies which files are security-relevant (config files, auth modules, dependency manifests, API routes)." },
                  { step: "2", title: "Agent Dispatch", desc: "Three specialized agents are deployed in parallel: the Secret Agent scans for hardcoded credentials and API keys; the Dependency Agent cross-references package versions against the OSV vulnerability database; the Code Review Agent performs AST-level pattern matching for injection flaws, auth bypasses, and unsafe API usage." },
                  { step: "3", title: "Finding Correlation", desc: "All agent findings are aggregated, deduplicated, and ranked by severity (CRITICAL → HIGH → MEDIUM → LOW). Each finding is mapped to exact file paths and line numbers." },
                  { step: "4", title: "Report Generation", desc: "The final report includes a holistic risk grade (A through F), a detailed findings list, and a full Vulnerability Explorer with inline code highlighting. The report is saved to your personal storage container." },
                  { step: "5", title: "Storage & History", desc: "Each authenticated user gets a container capped at 10 reports. You can view past reports from the History sidebar on the dashboard, or manage your storage from the Settings page." },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 text-xs font-black text-emerald-500">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm mb-1">{item.title}</h3>
                      <p className="text-xs text-neutral-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ═══ ARCHITECTURE ═══ */}
          {activeSection === "architecture" && (
            <motion.div key="architecture" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
              <div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">Architecture</h1>
                <p className="text-neutral-400 text-sm leading-relaxed max-w-2xl">
                  SentriX is a split-service monorepo deployed on Vercel. The frontend handles UI and authentication; the backend handles AI orchestration and data persistence.
                </p>
              </div>

              <div className="space-y-6">
                {[
                  { icon: Server, title: "Frontend — Next.js 16 (Turbopack)", color: "text-sky-500", desc: "The frontend is a Next.js App Router application with React 19. It handles routing, the scanner UI, Vulnerability Explorer (Monaco-based code viewer), and Clerk authentication. Deployed as a Vercel Serverless Function." },
                  { icon: Cpu, title: "Backend — Python Flask", color: "text-amber-500", desc: "The backend is a Python Flask API that receives scan requests, clones repositories, dispatches AI agents, and persists results to MongoDB. It uses the Google Gemini 2.5 Flash model via the google-genai SDK for intelligent code analysis." },
                  { icon: Database, title: "Database — MongoDB Atlas", color: "text-emerald-500", desc: "All scan reports and user data are stored in MongoDB Atlas. Each user's data is isolated by email address. The system enforces a strict 10-document limit per user to prevent database abuse." },
                  { icon: Lock, title: "Authentication — Clerk", color: "text-violet-500", desc: "User authentication is handled by Clerk, providing secure OAuth sign-in (Google, GitHub, email). The frontend uses ClerkProvider with a custom dark theme. Auth state is checked client-side via the useUser() hook." },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-start">
                    <div className="p-3 bg-white/[0.03] rounded-lg shrink-0"><item.icon className={`w-5 h-5 ${item.color}`} /></div>
                    <div>
                      <h3 className="font-bold text-sm mb-1">{item.title}</h3>
                      <p className="text-xs text-neutral-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ═══ STORAGE & LIMITS ═══ */}
          {activeSection === "storage" && (
            <motion.div key="storage" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
              <div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">Storage & Limits</h1>
                <p className="text-neutral-400 text-sm leading-relaxed max-w-2xl">
                  SentriX uses a container-based storage model. Each authenticated user gets a dedicated container linked to their account.
                </p>
              </div>

              <div className="canvas-card rounded-xl p-5 space-y-4">
                <h3 className="font-bold text-sm">Container Model</h3>
                <div className="space-y-3 text-xs text-neutral-400 leading-relaxed">
                  <p>When you sign up and run your first scan, SentriX automatically provisions a <span className="text-white font-medium">storage container</span> linked to your Clerk account email. This container stores your scan reports in MongoDB.</p>
                  <p>Each container is hard-capped at <span className="text-emerald-400 font-bold">10 reports</span>. Once you hit this limit, the scanner will return a <span className="text-rose-400 font-mono">403 STORAGE_FULL</span> error and you must clear old reports before running new scans.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoCard icon={Database} title="View Storage Usage">
                  Navigate to Settings → Storage to see a visual progress bar of your container usage (X/10 reports). The bar turns amber at 7 reports and red at 10.
                </InfoCard>
                <InfoCard icon={Trash2} title="Clear Reports">
                  Settings → Danger Zone → &quot;Purge Scan History&quot; permanently deletes all reports from your container, freeing all 10 slots.
                </InfoCard>
                <InfoCard icon={Users} title="Delete Account">
                  Settings → Danger Zone → &quot;Delete Account&quot; completely destroys your container and all associated data from the database. You are signed out immediately.
                </InfoCard>
                <InfoCard icon={Shield} title="Data Isolation">
                  Your reports are isolated by your account email. No other user can access or view your scan data. Container operations are atomic and immediate.
                </InfoCard>
              </div>
            </motion.div>
          )}

          {/* ═══ API REFERENCE ═══ */}
          {activeSection === "api" && (
            <motion.div key="api" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
              <div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">API Reference</h1>
                <p className="text-neutral-400 text-sm leading-relaxed max-w-2xl">
                  SentriX exposes a REST API for programmatic access. All endpoints accept and return JSON.
                </p>
              </div>

              {/* POST /api/scan */}
              <div className="canvas-card rounded-xl overflow-hidden">
                <div className="bg-white/[0.03] px-5 py-3 border-b border-white/[0.06] flex items-center gap-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">POST</span>
                  <span className="font-mono text-sm text-white">/api/scan</span>
                </div>
                <div className="p-5 space-y-4">
                  <p className="text-xs text-neutral-400">Initiates a full security audit of a public GitHub repository. Returns vulnerability findings organized by file.</p>
                  <CodeBlock title="Request Body" lang="JSON">{`{
  "repo_url": "https://github.com/org/repo",
  "user_email": "user@example.com"
}`}</CodeBlock>
                  <CodeBlock title="Response (200 OK)" lang="JSON">{`{
  "message": "Scan complete",
  "summary": {
    "total_findings": 4,
    "files_affected": 2,
    "severity_counts": { "CRITICAL": 1, "HIGH": 2, "MEDIUM": 1 }
  },
  "files": [
    {
      "path": "src/auth.ts",
      "language": "typescript",
      "code": "...",
      "vulnerabilities": [
        {
          "name": "Hardcoded JWT Secret",
          "severity": "CRITICAL",
          "agent": "SecretAgent",
          "line_start": 12,
          "line_end": 12,
          "description": "JWT signing key is hardcoded..."
        }
      ]
    }
  ]
}`}</CodeBlock>
                  <CodeBlock title="Error (403 Storage Full)" lang="JSON">{`{
  "error": "Storage Limit Reached. Please clear data in Settings.",
  "code": "STORAGE_FULL"
}`}</CodeBlock>
                </div>
              </div>

              {/* GET /api/history */}
              <div className="canvas-card rounded-xl overflow-hidden">
                <div className="bg-white/[0.03] px-5 py-3 border-b border-white/[0.06] flex items-center gap-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-sky-500/20 text-sky-400 rounded">GET</span>
                  <span className="font-mono text-sm text-white">/api/history</span>
                </div>
                <div className="p-5 space-y-4">
                  <p className="text-xs text-neutral-400">Retrieve all saved scan reports for the authenticated user (up to 10).</p>
                  <CodeBlock title="Query Parameters" lang="HTTP">{`GET /api/history?user_email=user@example.com`}</CodeBlock>
                </div>
              </div>

              {/* DELETE endpoints */}
              <div className="canvas-card rounded-xl overflow-hidden">
                <div className="bg-white/[0.03] px-5 py-3 border-b border-white/[0.06] flex items-center gap-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-500/20 text-rose-400 rounded">DELETE</span>
                  <span className="font-mono text-sm text-white">/api/settings/data</span>
                </div>
                <div className="p-5 space-y-4">
                  <p className="text-xs text-neutral-400">Permanently deletes all scan reports for the given user. Frees all 10 storage slots.</p>
                  <CodeBlock title="Request Body" lang="JSON">{`{ "user_email": "user@example.com" }`}</CodeBlock>
                </div>
              </div>

              <div className="canvas-card rounded-xl overflow-hidden">
                <div className="bg-white/[0.03] px-5 py-3 border-b border-white/[0.06] flex items-center gap-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-500/20 text-rose-400 rounded">DELETE</span>
                  <span className="font-mono text-sm text-white">/api/settings/account</span>
                </div>
                <div className="p-5 space-y-4">
                  <p className="text-xs text-neutral-400">Destroys the user&apos;s storage container and account record entirely. Irreversible.</p>
                  <CodeBlock title="Request Body" lang="JSON">{`{ "user_email": "user@example.com" }`}</CodeBlock>
                </div>
              </div>

              {/* POST /api/chat */}
              <div className="canvas-card rounded-xl overflow-hidden">
                <div className="bg-white/[0.03] px-5 py-3 border-b border-white/[0.06] flex items-center gap-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">POST</span>
                  <span className="font-mono text-sm text-white">/api/chat</span>
                </div>
                <div className="p-5 space-y-4">
                  <p className="text-xs text-neutral-400">Send a message to the SentriX AI assistant. Uses Google Gemini 3.1 Flash Lite for responses.</p>
                  <CodeBlock title="Request Body" lang="JSON">{`{ "message": "What is SQL injection?" }`}</CodeBlock>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ AUTHENTICATION ═══ */}
          {activeSection === "auth" && (
            <motion.div key="auth" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
              <div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">Authentication</h1>
                <p className="text-neutral-400 text-sm leading-relaxed max-w-2xl">
                  SentriX uses Clerk for user authentication, providing secure OAuth sign-in with a custom dark-themed UI.
                </p>
              </div>

              <div className="space-y-4 text-xs text-neutral-400 leading-relaxed">
                <p>
                  Authentication is required to run scans. When an unauthenticated user clicks <span className="text-white font-medium">&quot;Run Analysis&quot;</span>, a Clerk sign-in modal appears automatically — the user stays on the dashboard and is not redirected to a separate page.
                </p>
                <p>
                  Once signed in, the user&apos;s email address is extracted from <span className="text-cyan-400 font-mono">user.primaryEmailAddress</span> via the <span className="text-cyan-400 font-mono">useUser()</span> hook and passed to the backend with every scan request. This email is used to create and identify the user&apos;s storage container in MongoDB.
                </p>
              </div>

              <div className="p-4 bg-amber-500/5 border-l-2 border-amber-500/50 rounded-r-lg text-xs space-y-2">
                <h4 className="font-bold text-amber-400">Supported Providers</h4>
                <p className="text-amber-400/70">
                  Clerk is configured to accept Google OAuth, GitHub OAuth, and email/password authentication. Providers can be enabled or disabled from the Clerk Dashboard.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-sm mb-4">Required Environment Variables</h3>
                <div className="canvas-card rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/[0.03] border-b border-white/[0.06]">
                        <th className="p-4 font-mono text-[10px] text-neutral-500 uppercase tracking-wider">Variable</th>
                        <th className="p-4 font-mono text-[10px] text-neutral-500 uppercase tracking-wider">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      <tr>
                        <td className="p-4 font-mono text-xs text-emerald-400">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</td>
                        <td className="p-4 text-xs text-neutral-400">Public key from your Clerk Dashboard. Safe to expose in client bundles.</td>
                      </tr>
                      <tr>
                        <td className="p-4 font-mono text-xs text-rose-400">CLERK_SECRET_KEY</td>
                        <td className="p-4 text-xs text-neutral-400">Secret key from Clerk. Must be set in Vercel Environment Variables. Never commit to git.</td>
                      </tr>
                      <tr>
                        <td className="p-4 font-mono text-xs text-sky-400">NEXT_PUBLIC_CLERK_SIGN_IN_URL</td>
                        <td className="p-4 text-xs text-neutral-400">Path to the sign-in page. Set to <span className="font-mono text-white">/sign-in</span>.</td>
                      </tr>
                      <tr>
                        <td className="p-4 font-mono text-xs text-sky-400">NEXT_PUBLIC_CLERK_SIGN_UP_URL</td>
                        <td className="p-4 text-xs text-neutral-400">Path to the sign-up page. Set to <span className="font-mono text-white">/sign-up</span>.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
