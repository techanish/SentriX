"use client";

import { Book, FileText, Code, ShieldCheck, Database, Key, Server, Terminal, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

type DocSection = "intro" | "architecture" | "api" | "auth";

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState<DocSection>("intro");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 flex flex-col md:flex-row gap-12 min-h-[80vh]">
      
      {/* Navigation Sidebar */}
      <aside className="w-full md:w-64 shrink-0 space-y-8">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-4 px-3">Getting Started</h2>
          <nav className="space-y-1">
            <button 
              onClick={() => setActiveSection("intro")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                activeSection === "intro" ? "bg-emerald-500/10 text-emerald-500 font-bold" : "text-neutral-400 hover:text-foreground hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2"><Book className="w-4 h-4" /> Introduction</div>
              {activeSection === "intro" && <ChevronRight className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => setActiveSection("architecture")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                activeSection === "architecture" ? "bg-emerald-500/10 text-emerald-500 font-bold" : "text-neutral-400 hover:text-foreground hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2"><Server className="w-4 h-4" /> Architecture</div>
              {activeSection === "architecture" && <ChevronRight className="w-4 h-4" />}
            </button>
          </nav>
        </div>

        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-4 px-3">Developer API</h2>
          <nav className="space-y-1">
            <button 
              onClick={() => setActiveSection("api")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                activeSection === "api" ? "bg-cyan-500/10 text-cyan-500 font-bold" : "text-neutral-400 hover:text-foreground hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2"><Terminal className="w-4 h-4" /> Endpoints</div>
              {activeSection === "api" && <ChevronRight className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => setActiveSection("auth")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                activeSection === "auth" ? "bg-cyan-500/10 text-cyan-500 font-bold" : "text-neutral-400 hover:text-foreground hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2"><Key className="w-4 h-4" /> Authentication</div>
              {activeSection === "auth" && <ChevronRight className="w-4 h-4" />}
            </button>
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          
          {/* INTRODUCTION */}
          {activeSection === "intro" && (
            <motion.div key="intro" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
              <div>
                <h1 className="text-4xl font-black tracking-tight mb-4 flex items-center gap-3">
                  <ShieldCheck className="w-8 h-8 text-emerald-500" />
                  SentriX Documentation
                </h1>
                <p className="text-neutral-400 text-lg leading-relaxed">
                  SentriX is a next-generation autonomous security scanner powered by a swarm of specialized AI agents. It maps your architecture, correlates vulnerabilities, and provides line-specific remediation patches.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="canvas-card p-6 rounded-2xl border border-white/10">
                  <h3 className="font-bold text-lg mb-2">Automated Threat Modeling</h3>
                  <p className="text-sm text-neutral-500">The Planner Agent dynamically parses your repository structure to determine the most effective attack vectors to test.</p>
                </div>
                <div className="canvas-card p-6 rounded-2xl border border-white/10">
                  <h3 className="font-bold text-lg mb-2">Multi-Agent Swarm</h3>
                  <p className="text-sm text-neutral-500">Specialized agents (Secrets, Dependencies, Code Review) operate in parallel to massively reduce scan times.</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ARCHITECTURE */}
          {activeSection === "architecture" && (
            <motion.div key="architecture" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
              <h1 className="text-4xl font-black tracking-tight mb-4">Architecture</h1>
              <p className="text-neutral-400 text-lg leading-relaxed">
                SentriX is built on a scalable, serverless-ready stack utilizing Next.js for the edge frontend and Python Flask for the heavy AI orchestration backend.
              </p>
              
              <div className="space-y-6 mt-8">
                <div className="flex gap-4 items-start">
                  <div className="p-3 bg-white/5 rounded-lg shrink-0"><Database className="w-6 h-6 text-amber-500" /></div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Data Layer (MongoDB)</h3>
                    <p className="text-neutral-400 text-sm leading-relaxed">
                      All scan reports and user contexts are persisted in MongoDB. The system enforces a strict 10-report storage limit per user to maintain database performance and prevent abuse.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="p-3 bg-white/5 rounded-lg shrink-0"><FileText className="w-6 h-6 text-sky-500" /></div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">AI Integration Layer</h3>
                    <p className="text-neutral-400 text-sm leading-relaxed">
                      The Python backend utilizes the official `google-genai` SDK to orchestrate multiple Gemini 2.5 Flash agents. AST parsing and dependency cross-referencing are handled natively in Python before being fed into the LLM context.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* API REFERENCE */}
          {activeSection === "api" && (
            <motion.div key="api" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
              <h1 className="text-4xl font-black tracking-tight mb-4">API Reference</h1>
              <p className="text-neutral-400 text-lg leading-relaxed">
                Integrate SentriX directly into your CI/CD pipelines using our REST endpoints.
              </p>
              
              <div className="canvas-card rounded-2xl overflow-hidden border border-white/10 mt-8">
                <div className="bg-black/40 px-6 py-4 border-b border-white/10 flex items-center justify-between">
                  <span className="font-mono text-sm text-cyan-400">POST /api/scan</span>
                  <span className="text-xs text-neutral-500 bg-white/5 px-2 py-1 rounded">JSON</span>
                </div>
                <div className="p-6 space-y-6">
                  <p className="text-sm text-neutral-400">Initiates a comprehensive security audit of a public GitHub repository.</p>
                  
                  <div>
                    <h4 className="text-xs font-bold uppercase text-neutral-500 mb-2">Request Body</h4>
                    <pre className="bg-[#0a0a0a] border border-[#222] p-4 rounded-lg font-mono text-sm text-neutral-300 overflow-x-auto">
{`{
  "repo_url": "https://github.com/org/repo",
  "user_email": "developer@example.com"
}`}
                    </pre>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase text-neutral-500 mb-2">Response (200 OK)</h4>
                    <pre className="bg-[#0a0a0a] border border-[#222] p-4 rounded-lg font-mono text-sm text-emerald-400 overflow-x-auto">
{`{
  "status": "success",
  "files": [
    {
      "path": "src/auth.ts",
      "vulnerabilities": [
        {
          "name": "Hardcoded JWT Secret",
          "severity": "CRITICAL",
          "agent": "Secret Agent"
        }
      ]
    }
  ]
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* AUTHENTICATION */}
          {activeSection === "auth" && (
            <motion.div key="auth" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
              <h1 className="text-4xl font-black tracking-tight mb-4">Authentication</h1>
              <p className="text-neutral-400 text-lg leading-relaxed">
                SentriX relies on robust Single Sign-On (SSO) architecture powered by NextAuth.js (v5 Beta).
              </p>

              <div className="space-y-6 mt-8 text-neutral-400 text-sm leading-relaxed">
                <p>
                  All dashboard routes, including the scanner engine and history logs, are strictly protected by Next.js Edge Middleware. Unauthorized requests are intercepted and redirected to the login gate.
                </p>
                <div className="p-4 bg-amber-500/10 border-l-4 border-amber-500 rounded-r-lg text-amber-500">
                  <h4 className="font-bold mb-1">Provider Configuration</h4>
                  To enable GitHub and Google OAuth, you must provide valid Client IDs and Secrets in your environment variables.
                </div>
                
                <h3 className="text-white font-bold text-lg mt-8 mb-4">Required Environment Variables</h3>
                <div className="bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10">
                        <th className="p-4 font-mono text-xs">Variable</th>
                        <th className="p-4 font-mono text-xs">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      <tr>
                        <td className="p-4 font-mono text-xs text-emerald-400">AUTH_SECRET</td>
                        <td className="p-4">32-character secure random string used to encrypt JWT session tokens.</td>
                      </tr>
                      <tr>
                        <td className="p-4 font-mono text-xs text-sky-400">AUTH_GITHUB_ID</td>
                        <td className="p-4">OAuth App Client ID generated from GitHub Developer Settings.</td>
                      </tr>
                      <tr>
                        <td className="p-4 font-mono text-xs text-sky-400">AUTH_GITHUB_SECRET</td>
                        <td className="p-4">OAuth App Client Secret generated from GitHub Developer Settings.</td>
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
