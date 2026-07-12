"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, Shield, AlertTriangle, GitBranch, Terminal, Loader2, XCircle, CheckCircle2, ShieldAlert } from "lucide-react";
import { VulnerabilityExplorer, type VulnerabilityFile } from "@/components/VulnerabilityExplorer";
import { ChatAssistant } from "@/components/ChatAssistant";
import { ThreeBackground } from "@/components/ThreeBackground";
import { useState, useEffect, useCallback } from "react";

const API_BASE = process.env.NODE_ENV === "production" ? "/api/backend/api" : "http://localhost:8000/api";

// Mock data removed. We now fetch real files from the backend scan!

type ScanStatus = "idle" | "scanning" | "done" | "error";

interface Finding {
  name: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  agent: string;
  detail?: string;
}

interface TerminalStep {
  agent: string;
  action: string;
  time: string;
  status: "done" | "active" | "pending";
}

export default function PremiumDashboard() {
  const [mounted, setMounted] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
  const [scanError, setScanError] = useState("");
  const [findings, setFindings] = useState<Finding[]>([]);
  const [scanFiles, setScanFiles] = useState<VulnerabilityFile[]>([]);
  const [riskScore, setRiskScore] = useState("—");
  const [riskLabel, setRiskLabel] = useState("");
  const [terminalSteps, setTerminalSteps] = useState<TerminalStep[]>([]);
  const [repoName, setRepoName] = useState("waiting-for-target");

  // Prevent hydration mismatch from browser extensions (Bitdefender, Grammarly, etc.)
  useEffect(() => { 
    setMounted(true); 
    
    // Silence Unhandled Rejection errors caused by Monaco Editor CDN being blocked by extensions
    const handleRejection = (e: PromiseRejectionEvent) => {
      if (typeof e.reason === "object" && e.reason !== null && !(e.reason instanceof Error)) {
        e.preventDefault();
        console.warn("Caught unhandled rejection (likely Monaco CDN block):", e.reason);
      }
    };
    window.addEventListener("unhandledrejection", handleRejection);
    return () => window.removeEventListener("unhandledrejection", handleRejection);
  }, []);

  const getRepoName = (url: string) => {
    try {
      const parts = url.replace(/\/+$/, "").split("/");
      return parts[parts.length - 1]?.replace(".git", "") || "repo";
    } catch { return "repo"; }
  };

  const calculateRisk = (findings: Finding[]): { score: string; label: string; color: string } => {
    const critical = findings.filter(f => f.severity === "CRITICAL").length;
    const high = findings.filter(f => f.severity === "HIGH").length;
    if (critical >= 3) return { score: "F", label: "Extremely High Risk", color: "text-rose-500" };
    if (critical >= 1) return { score: "D+", label: "High Risk Profile", color: "text-rose-500" };
    if (high >= 3) return { score: "C", label: "Elevated Risk", color: "text-amber-500" };
    if (high >= 1) return { score: "B-", label: "Moderate Risk", color: "text-amber-400" };
    return { score: "A", label: "Low Risk", color: "text-emerald-500" };
  };

  const handleScan = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;

    // Reset state
    setScanStatus("scanning");
    setScanError("");
    setFindings([]);
    setScanFiles([]);
    setRiskScore("-");
    setRiskLabel("");
    const name = getRepoName(repoUrl);
    setRepoName(name);

    // Animate terminal steps
    const steps: TerminalStep[] = [
      { agent: "Planner Agent", action: "Initializing agent swarm...", time: "...", status: "active" },
      { agent: "Secret Agent", action: "Waiting...", time: "—", status: "pending" },
      { agent: "Dependency Agent", action: "Waiting...", time: "—", status: "pending" },
      { agent: "Code Review Agent", action: "Waiting...", time: "—", status: "pending" },
    ];
    setTerminalSteps([...steps]);

    try {
      const startTime = Date.now();

      // Fetch from backend
      const fetchPromise = fetch(`${API_BASE}/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo_url: repoUrl.trim() }),
      }).then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({ error: "Backend unreachable" }));
          throw new Error(errData.error || `HTTP ${res.status}`);
        }
        return res.json();
      });

      // Animate steps concurrently while waiting
      const animatePromise = (async () => {
        await new Promise(r => setTimeout(r, 800));
        steps[0] = { agent: "Planner Agent", action: `Cloned & parsed ${name} architecture`, time: `0.8s`, status: "done" };
        steps[1].status = "active";
        steps[1].action = "Scanning commits for exposed keys...";
        setTerminalSteps([...steps]);

        await new Promise(r => setTimeout(r, 1200));
        steps[1] = { agent: "Secret Agent", action: `Analyzed secrets & credentials`, time: `2.0s`, status: "done" };
        steps[2].status = "active";
        steps[2].action = "Cross-referencing OSV database...";
        setTerminalSteps([...steps]);

        await new Promise(r => setTimeout(r, 1200));
        steps[2] = { agent: "Dependency Agent", action: `Verified supply chain integrity`, time: `3.2s`, status: "done" };
        steps[3].status = "active";
        steps[3].action = "Analyzing Abstract Syntax Trees...";
        setTerminalSteps([...steps]);
      })().catch(err => console.warn("Animation loop aborted", err));

      // Wait for both fetch and animation to finish
      const [data] = await Promise.all([fetchPromise, animatePromise]);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

      // Finish the final step
      steps[3] = { agent: "Code Review Agent", action: `Completed AST pattern matching`, time: `${elapsed}s`, status: "done" };
      setTerminalSteps([...steps]);

      // Extract findings from the new backend payload structure
      const scanFindings: Finding[] = [];
      const files: VulnerabilityFile[] = (data.files || []).map((f: any) => ({
        ...f,
        vulnerabilities: f.vulnerabilities.map((v: any) => ({
          ...v,
          lineStart: v.line_start || 1,
          lineEnd: v.line_end || 1,
        }))
      }));
      
      files.forEach(f => {
        f.vulnerabilities.forEach(v => {
          scanFindings.push({
            name: v.name,
            severity: v.severity,
            agent: v.agent,
            detail: v.description,
          });
        });
      });

      setScanFiles(files);
      setFindings(scanFindings);
      const risk = calculateRisk(scanFindings);
      setRiskScore(risk.score);
      setRiskLabel(risk.label);
      setScanStatus("done");

    } catch (err: any) {
      console.error("Scan failed:", err);
      setScanError(err.message || "Failed to connect to backend");
      setScanStatus("error");

      // Mark all steps as failed
      steps.forEach((s, i) => {
        if (s.status !== "done") {
          steps[i] = { ...s, action: "Failed", time: "—", status: "done" };
        }
      });
      setTerminalSteps([...steps]);
    }
  }, [repoUrl]);

  // Don't render until mounted to avoid hydration mismatches from browser extensions
  if (!mounted) {
    return null;
  }

  const severityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL": return { bg: "bg-rose-50 dark:bg-rose-950/20", border: "border-rose-100 dark:border-rose-900/30", text: "text-rose-600 dark:text-rose-400", badge: "bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300" };
      case "HIGH": return { bg: "bg-amber-50 dark:bg-amber-950/20", border: "border-amber-100 dark:border-amber-900/30", text: "text-amber-600 dark:text-amber-400", badge: "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300" };
      case "MEDIUM": return { bg: "bg-sky-50 dark:bg-sky-950/20", border: "border-sky-100 dark:border-sky-900/30", text: "text-sky-600 dark:text-sky-400", badge: "bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300" };
      default: return { bg: "bg-neutral-50 dark:bg-neutral-950/20", border: "border-neutral-100 dark:border-neutral-900/30", text: "text-neutral-600 dark:text-neutral-400", badge: "bg-neutral-100 dark:bg-neutral-900/50 text-neutral-700 dark:text-neutral-300" };
    }
  };

  const defaultSteps: TerminalStep[] = [
    { agent: "System", action: "Awaiting target repository...", time: "—", status: "pending" },
  ];

  const displaySteps = terminalSteps.length > 0 ? terminalSteps : defaultSteps;

  return (
    <div className="w-full relative">
      <ThreeBackground />
      
      <main className="max-w-7xl mx-auto px-8 py-16 space-y-16">
        
        {/* Search / Hero Section */}
        <section className="text-center space-y-8 max-w-3xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl font-black tracking-tight mb-4">
              Autonomous Security Audits.
            </h1>
            <p className="text-lg text-neutral-500 dark:text-neutral-400">
              Paste a repository link. Our specialized AI agent swarm will map the architecture, correlate vulnerabilities, and generate secure patches instantly.
            </p>
          </motion.div>

          <motion.form 
            onSubmit={handleScan}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 bg-background canvas-card p-2 rounded-xl focus-within:ring-2 focus-within:ring-foreground transition-all"
          >
            <GitBranch className="w-6 h-6 text-neutral-400 ml-3 shrink-0" />
            <input 
              type="text" 
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/your-org/your-repo"
              className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-foreground placeholder:text-neutral-400 font-mono text-sm"
            />
            <button 
              type="submit"
              disabled={scanStatus === "scanning"}
              className="bg-foreground text-background px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {scanStatus === "scanning" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              {scanStatus === "scanning" ? "Scanning..." : "Run Analysis"}
            </button>
          </motion.form>

          {/* Error Banner */}
          <AnimatePresence>
            {scanStatus === "error" && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg px-4 py-3 text-sm text-rose-700 dark:text-rose-300"
              >
                <XCircle className="w-5 h-5 shrink-0" />
                <span>{scanError || "An unknown error occurred."}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Status Panel (Terminal Look) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-8 rounded-2xl overflow-hidden shadow-2xl border border-black/20 dark:border-white/10 flex flex-col h-full"
          >
            {/* Terminal Header */}
            <div className="bg-[#1e1e1e] px-4 py-3 flex items-center gap-2 border-b border-[#333] shrink-0">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              </div>
              <div className="flex-1 text-center font-mono text-xs text-neutral-400">
                sentrix-core ~ {repoName}
              </div>
            </div>

            {/* Terminal Body */}
            <div className="bg-[#0a0a0a] p-6 font-mono text-sm space-y-4 min-h-[300px] flex-1">
              <div className="text-emerald-500 mb-6 flex items-center gap-2">
                <Terminal className="w-4 h-4" /> 
                {scanStatus === "idle" 
                  ? "SentriX Agent Swarm v1.0 — Ready" 
                  : `Target: ${repoName} (main branch)`}
              </div>

              <div className="space-y-4">
                {displaySteps.map((step, idx) => (
                  <motion.div 
                    key={`${step.agent}-${idx}`} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="mt-0.5 shrink-0">
                      {step.status === "done" ? <span className="text-emerald-500">[OK]</span> : 
                       step.status === "active" ? <span className="text-cyan-400 animate-pulse">[*] </span> : 
                       <span className="text-neutral-600">[-] </span>}
                    </div>
                    <div className="flex-1 flex flex-col sm:flex-row justify-between sm:items-center">
                      <div>
                        <span className={`font-bold ${step.status === 'pending' ? 'text-neutral-600' : 'text-cyan-300'}`}>
                          {step.agent}: 
                        </span>
                        <span className={`ml-2 ${step.status === 'pending' ? 'text-neutral-600' : 'text-neutral-300'}`}>
                          {step.action}
                        </span>
                      </div>
                      <span className="text-xs text-neutral-500 mt-1 sm:mt-0">{step.time}</span>
                    </div>
                  </motion.div>
                ))}
                
                {scanStatus === "scanning" && (
                  <div className="flex items-center gap-2 text-cyan-400 animate-pulse mt-4">
                    <span>_</span>
                  </div>
                )}
                {scanStatus === "done" && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="text-emerald-400 mt-4 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Analysis complete. {findings.length} vulnerabilities detected.
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Stats & Vulnerabilities */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-4 space-y-8"
          >
            {/* Score Card */}
            <div className="canvas-card rounded-2xl p-6 flex flex-col items-center justify-center text-center">
              <div className="text-xs font-bold tracking-widest text-neutral-500 uppercase mb-4">Risk Score</div>
              <div className="text-7xl font-black text-foreground">
                {scanStatus === "scanning" ? (
                  <Loader2 className="w-16 h-16 animate-spin text-neutral-400 mx-auto" />
                ) : riskScore}
              </div>
              <AnimatePresence>
                {scanStatus === "done" && riskLabel && (
                  <motion.p 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-sm text-rose-500 font-medium mt-4 bg-rose-50 dark:bg-rose-950/30 px-3 py-1 rounded-full"
                  >
                    {riskLabel}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Findings List */}
            <div className="canvas-card rounded-2xl p-6">
              <h3 className="font-bold mb-4 flex items-center justify-between">
                Findings
                <span className="text-xs font-normal text-neutral-500">
                  {scanStatus === "scanning" ? "Scanning..." : scanStatus === "done" ? `${findings.length} found` : "Live Updates"}
                </span>
              </h3>
              <div className="space-y-3">
                {scanStatus === "scanning" ? (
                  <div className="text-sm text-neutral-500 text-center py-6 animate-pulse flex flex-col items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing repository...
                  </div>
                ) : scanStatus === "idle" ? (
                  <div className="text-sm text-neutral-500 text-center py-6">
                    Enter a repository URL to begin analysis.
                  </div>
                ) : scanStatus === "error" ? (
                  <div className="text-sm text-rose-500 text-center py-6 flex flex-col items-center gap-2">
                    <XCircle className="w-5 h-5" />
                    Scan failed. Check backend connection.
                  </div>
                ) : (
                  <AnimatePresence>
                    {findings.map((finding, idx) => {
                      const colors = severityColor(finding.severity);
                      return (
                        <motion.div
                          key={`${finding.name}-${idx}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className={`flex items-center justify-between p-3 rounded-lg ${colors.bg} border ${colors.border}`}
                        >
                          <div className={`flex items-center gap-2 ${colors.text} text-sm font-medium`}>
                            <AlertTriangle className="w-4 h-4" /> {finding.name}
                          </div>
                          <span className={`text-xs font-bold px-2 py-1 ${colors.badge} rounded`}>{finding.severity}</span>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>
            </div>
          </motion.div>

        </div>

        {/* Vulnerability Explorer — only after scan completes */}
        <AnimatePresence>
          {scanStatus === "done" && findings.length > 0 && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.3 }}
            >
              <div className="mb-4 flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <h3 className="text-lg font-bold">Vulnerability Analysis</h3>
                <span className="text-xs text-neutral-500">Click a file to inspect • Click a vulnerability to jump to the affected lines</span>
              </div>
              <VulnerabilityExplorer files={scanFiles} />
            </motion.section>
          )}
        </AnimatePresence>

      </main>

      <ChatAssistant />
    </div>
  );
}
