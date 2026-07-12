"use client";

import { Book, FileText, Code, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function DocsPage() {
  return (
    <div className="max-w-4xl mx-auto px-8 py-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-4 flex items-center gap-3">
            <Book className="w-8 h-8 text-emerald-500" />
            SentriX Documentation
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-lg">
            Welcome to the official documentation for the SentriX Autonomous Security Scanner. 
            Learn how our AI swarm maps your architecture, correlates vulnerabilities, and keeps your codebase bulletproof.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          {/* Section 1 */}
          <div className="canvas-card p-6 rounded-2xl hover:border-emerald-500/50 transition-colors cursor-pointer group">
            <ShieldCheck className="w-8 h-8 text-emerald-500 mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="text-xl font-bold mb-2">Getting Started</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Learn how to paste a repository link and initiate your first comprehensive security audit.
            </p>
          </div>

          {/* Section 2 */}
          <div className="canvas-card p-6 rounded-2xl hover:border-emerald-500/50 transition-colors cursor-pointer group">
            <Code className="w-8 h-8 text-amber-500 mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="text-xl font-bold mb-2">Agent Swarm Architecture</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Deep dive into how the Secret, Dependency, and Code Review agents operate in parallel.
            </p>
          </div>

          {/* Section 3 */}
          <div className="canvas-card p-6 rounded-2xl hover:border-emerald-500/50 transition-colors cursor-pointer group">
            <FileText className="w-8 h-8 text-sky-500 mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="text-xl font-bold mb-2">Vulnerability Remediation</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Understand how SentriX generates actionable, line-specific patches for identified threats.
            </p>
          </div>
        </div>

        <div className="mt-16 p-8 canvas-card rounded-2xl border-l-4 border-l-emerald-500">
          <h3 className="text-lg font-bold mb-2">Need API Access?</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            For enterprise integration, you can tap directly into the SentriX backend engine using your API key. 
            Check out the Settings page to configure your nodes.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
