"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, Shield, AlertTriangle, GitBranch, Terminal, Loader2, XCircle, CheckCircle2, ShieldAlert, Clock, Trash2, X, MoreHorizontal } from "lucide-react";
import { VulnerabilityExplorer, type VulnerabilityFile } from "@/components/VulnerabilityExplorer";
import { ChatAssistant } from "@/components/ChatAssistant";
import { ThreeBackground } from "@/components/ThreeBackground";
import { useState, useEffect, useCallback } from "react";
import { useUser, useClerk } from "@clerk/nextjs";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

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
  const [riskState, setRiskState] = useState({ score: "—", label: "", text: "text-neutral-500", border: "border-neutral-500/20", bg: "bg-neutral-900/30 border-neutral-800" });
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [terminalSteps, setTerminalSteps] = useState<TerminalStep[]>([]);
  const [repoName, setRepoName] = useState("waiting-for-target");

  const { user, isLoaded } = useUser();
  const { openSignIn } = useClerk();
  const email = user?.primaryEmailAddress?.emailAddress;

  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [showStorageFull, setShowStorageFull] = useState(false);

  useEffect(() => {
    if (email) {
      fetch(`${API_BASE}/history?user_email=${encodeURIComponent(email)}`)
        .then(res => res.json())
        .then(data => {
          if (data.reports) setHistory(data.reports);
          else if (data.history) setHistory(data.history);
        })
        .catch(err => console.error("Failed to fetch history:", err));
    }
  }, [email]);

  const loadReport = (report: any) => {
    setRepoUrl(report.repo || report.repo_url || "");
    setRepoName(getRepoName(report.repo || report.repo_url || ""));
    const files: VulnerabilityFile[] = (report.files || []).map((f: any) => ({
      ...f,
      vulnerabilities: f.vulnerabilities.map((v: any) => ({
        ...v,
        lineStart: v.line_start || 1,
        lineEnd: v.line_end || 1,
      }))
    }));

    const scanFindings: Finding[] = [];
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
    setRiskState(calculateRisk(scanFindings));
    setScanStatus("done");
    setShowHistory(false);
    
    setTerminalSteps([
      { agent: "History", action: "Loaded previous report from database", time: "0.1s", status: "done" }
    ]);
  };

  const deleteReport = async (reportId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!reportId) return;
    try {
      const res = await fetch(`${API_BASE}/history/${reportId}`, { method: 'DELETE' });
      if (res.ok) {
        setHistory(prev => prev.filter(r => r._id !== reportId));
      }
    } catch (err) {
      console.error("Failed to delete report", err);
    }
  };

  useEffect(() => {
    setMounted(true);
    const handleRejection = (e: PromiseRejectionEvent) => {
      if (typeof e.reason === "object" && e.reason !== null && !(e.reason instanceof Error)) {
        e.preventDefault();
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

  const calculateRisk = (findings: Finding[]) => {
    const critical = findings.filter(f => f.severity === "CRITICAL").length;
    const high = findings.filter(f => f.severity === "HIGH").length;
    if (critical >= 3) return { score: "F", label: "Extremely High Risk", text: "text-rose-500", border: "border-rose-500/30", bg: "bg-rose-950/30 border-rose-900/40" };
    if (critical >= 1) return { score: "D+", label: "High Risk Profile", text: "text-rose-500", border: "border-rose-500/30", bg: "bg-rose-950/30 border-rose-900/40" };
    if (high >= 3) return { score: "C", label: "Elevated Risk", text: "text-amber-500", border: "border-amber-500/30", bg: "bg-amber-950/30 border-amber-900/40" };
    if (high >= 1) return { score: "B-", label: "Moderate Risk", text: "text-amber-400", border: "border-amber-400/30", bg: "bg-amber-950/30 border-amber-900/40" };
    return { score: "A", label: "Low Risk", text: "text-emerald-500", border: "border-emerald-500/30", bg: "bg-emerald-950/30 border-emerald-900/40" };
  };

  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleScan = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;

    // AUTH GATE: If not signed in, trigger Clerk modal
    if (!user) {
      openSignIn();
      return;
    }

    setScanStatus("scanning");
    setScanError("");
    setFindings([]);
    setScanFiles([]);
    setRiskState({ score: "-", label: "", text: "text-neutral-500", border: "border-neutral-500/20", bg: "bg-neutral-900/30 border-neutral-800" });
    const name = getRepoName(repoUrl);
    setRepoName(name);

    const steps: TerminalStep[] = [
      { agent: "Planner Agent", action: "Initializing agent swarm...", time: "...", status: "active" },
      { agent: "Secret Agent", action: "Waiting...", time: "—", status: "pending" },
      { agent: "Dependency Agent", action: "Waiting...", time: "—", status: "pending" },
      { agent: "Code Review Agent", action: "Waiting...", time: "—", status: "pending" },
    ];
    setTerminalSteps([...steps]);

    try {
      const startTime = Date.now();

      const fetchPromise = fetch(`${API_BASE}/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo_url: repoUrl.trim(),
          user_email: email
        }),
      }).then(async (res) => {
        if (!res.ok) {
          if (res.status === 403) {
            setShowStorageFull(true);
            throw new Error("Storage Limit Reached.");
          }
          const errData = await res.json().catch(() => ({ error: "Backend unreachable" }));
          throw new Error(errData.error || `HTTP ${res.status}`);
        }
        return res.json();
      });

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
      })().catch(() => {});

      const [data] = await Promise.all([fetchPromise, animatePromise]);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

      steps[3] = { agent: "Code Review Agent", action: `Completed AST pattern matching`, time: `${elapsed}s`, status: "done" };
      setTerminalSteps([...steps]);

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
      setRiskState(calculateRisk(scanFindings));
      setScanStatus("done");

    } catch (err: any) {
      console.error("Scan failed:", err);
      setScanError(err.message || "Failed to connect to backend");
      setScanStatus("error");

      steps.forEach((s, i) => {
        if (s.status !== "done") {
          steps[i] = { ...s, action: "Failed", time: "—", status: "done" };
        }
      });
      setTerminalSteps([...steps]);
    }
  }, [repoUrl, user, email, openSignIn]);

  if (!mounted) return null;

  const severityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL": return { bg: "bg-rose-950/30", border: "border-rose-900/40", text: "text-rose-400", badge: "bg-rose-900/50 text-rose-300" };
      case "HIGH": return { bg: "bg-amber-950/30", border: "border-amber-900/40", text: "text-amber-400", badge: "bg-amber-900/50 text-amber-300" };
      case "MEDIUM": return { bg: "bg-sky-950/30", border: "border-sky-900/40", text: "text-sky-400", badge: "bg-sky-900/50 text-sky-300" };
      default: return { bg: "bg-neutral-950/30", border: "border-neutral-800", text: "text-neutral-400", badge: "bg-neutral-800 text-neutral-300" };
    }
  };

  const defaultSteps: TerminalStep[] = [
    { agent: "System", action: "Awaiting target repository...", time: "—", status: "pending" },
  ];

  const displaySteps = terminalSteps.length > 0 ? terminalSteps : defaultSteps;

  return (
    <div className="w-full relative">
      <ThreeBackground />

      {/* Storage Full Modal */}
      <AnimatePresence>
        {showStorageFull && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="canvas-card rounded-2xl p-8 max-w-md w-full relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500" />
              <ShieldAlert className="w-12 h-12 text-rose-500 mb-4" />
              <h2 className="text-2xl font-black mb-2">Storage Limit Reached</h2>
              <p className="text-neutral-500 text-sm mb-6">
                Your account has hit the 10-report cap. Delete old reports in Settings to continue scanning.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowStorageFull(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-sm font-bold"
                >
                  Dismiss
                </button>
                <a
                  href="/settings"
                  className="flex-1 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-center transition-colors text-sm font-bold"
                >
                  Manage Storage
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-6 sm:px-8 py-12 sm:py-16 space-y-12 sm:space-y-16">

        {/* Header Bar */}
        <div className="flex justify-between items-center w-full">
          <div />
          {user && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="canvas-card px-4 py-2 rounded-full text-sm font-bold hover:border-white/20 transition-all flex items-center gap-2"
            >
              <Clock className="w-4 h-4 text-neutral-500" />
              History
              <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full text-xs font-bold">
                {history.length}/10
              </span>
            </button>
          )}
        </div>

        {/* Hero */}
        <section className="text-center space-y-8 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-500 uppercase tracking-widest mb-6">
              <Shield className="w-3 h-3" />
              AI-Powered Security
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-5 leading-[1.1]">
              Autonomous Security<br />
              <span className="gradient-text">Audits in Seconds.</span>
            </h1>
            <p className="text-base sm:text-lg text-neutral-500 max-w-xl mx-auto leading-relaxed">
              Paste a repository link. Our AI agent swarm maps the architecture, correlates vulnerabilities, and generates secure patches — instantly.
            </p>
          </motion.div>

          <motion.form
            onSubmit={handleScan}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 canvas-card p-2 rounded-xl focus-within:border-emerald-500/30 transition-all"
          >
            <GitBranch className="w-5 h-5 text-neutral-600 ml-3 shrink-0" />
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/your-org/your-repo"
              className="flex-1 bg-transparent border-none outline-none px-3 py-3 text-white placeholder:text-neutral-600 font-mono text-sm"
            />
            <button
              type="submit"
              disabled={scanStatus === "scanning"}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/20 text-sm"
            >
              {scanStatus === "scanning" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              {scanStatus === "scanning" ? "Scanning..." : "Run Analysis"}
            </button>
          </motion.form>

          {/* Auth hint for signed-out users */}
          {isLoaded && !user && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-xs text-neutral-600"
            >
              Sign in required to run scans. Your reports are saved to your personal storage container.
            </motion.p>
          )}

          {/* Error Banner */}
          <AnimatePresence>
            {scanStatus === "error" && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 bg-rose-950/30 border border-rose-900/40 rounded-lg px-4 py-3 text-sm text-rose-300"
              >
                <XCircle className="w-5 h-5 shrink-0" />
                <span>{scanError || "An unknown error occurred."}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Terminal Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-8 rounded-2xl overflow-hidden border border-white/[0.06] flex flex-col h-full"
          >
            <div className="bg-[#0d0d0d] px-4 py-3 flex items-center gap-2 border-b border-white/[0.06] shrink-0">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <div className="flex-1 text-center font-mono text-xs text-neutral-600">
                sentrix-core ~ {repoName}
              </div>
            </div>

            <div className="bg-[#080808] p-6 font-mono text-sm space-y-4 min-h-[300px] flex-1">
              <div className="text-emerald-500 mb-6 flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                {scanStatus === "idle"
                  ? "SentriX Agent Swarm v1.0 — Ready"
                  : `Target: ${repoName} (main branch)`}
              </div>

              <div className="space-y-3">
                {displaySteps.map((step, idx) => (
                  <motion.div
                    key={`${step.agent}-${idx}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    className="flex items-start gap-3"
                  >
                    <div className="mt-0.5 shrink-0 font-bold text-xs w-8">
                      {step.status === "done" ? <span className="text-emerald-500">[OK]</span> :
                       step.status === "active" ? <span className="text-cyan-400 animate-pulse">[**]</span> :
                       <span className="text-neutral-700">[-]</span>}
                    </div>
                    <div className="flex-1 flex flex-col sm:flex-row justify-between sm:items-center gap-1">
                      <div>
                        <span className={`font-bold ${step.status === 'pending' ? 'text-neutral-700' : 'text-cyan-300'}`}>
                          {step.agent}:
                        </span>
                        <span className={`ml-2 ${step.status === 'pending' ? 'text-neutral-700' : 'text-neutral-400'}`}>
                          {step.action}
                        </span>
                      </div>
                      <span className="text-xs text-neutral-600">{step.time}</span>
                    </div>
                  </motion.div>
                ))}

                {scanStatus === "scanning" && (
                  <div className="flex items-center gap-1 text-emerald-500 mt-4">
                    <span className="animate-blink">█</span>
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

          {/* Stats & Findings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-4 space-y-6"
          >
            {/* Score Card */}
            <div className="canvas-card rounded-2xl p-6 flex flex-col items-center justify-center text-center">
              <div className="text-[10px] font-bold tracking-[0.2em] text-neutral-600 uppercase mb-4">Risk Score</div>
              <div className="relative">
                <div className={`text-7xl font-black ${scanStatus === "done" ? riskState.text : "text-neutral-500"}`}>
                  {scanStatus === "scanning" ? (
                    <Loader2 className="w-16 h-16 animate-spin text-neutral-700 mx-auto" />
                  ) : riskState.score}
                </div>
                {scanStatus === "done" && (
                  <div className={`absolute -inset-4 rounded-full border-2 ${riskState.border} animate-pulse-glow`} />
                )}
              </div>
              <AnimatePresence>
                {scanStatus === "done" && riskState.label && (
                  <motion.p
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`text-xs ${riskState.text} font-bold mt-4 px-3 py-1 rounded-full border ${riskState.bg}`}
                  >
                    {riskState.label}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Findings List */}
            <div className="canvas-card rounded-2xl p-6">
              <h3 className="font-bold mb-4 flex items-center justify-between text-sm">
                Findings
                <span className="text-[10px] font-normal text-neutral-600">
                  {scanStatus === "scanning" ? "Scanning..." : scanStatus === "done" ? `${findings.length} found` : "Live Updates"}
                </span>
              </h3>
              <div className="space-y-2.5">
                {scanStatus === "scanning" ? (
                  <div className="text-sm text-neutral-600 text-center py-8 animate-pulse flex flex-col items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing repository...
                  </div>
                ) : scanStatus === "idle" ? (
                  <div className="text-sm text-neutral-600 text-center py-8">
                    Enter a repo URL to begin.
                  </div>
                ) : scanStatus === "error" ? (
                  <div className="text-sm text-rose-500 text-center py-8 flex flex-col items-center gap-2">
                    <XCircle className="w-5 h-5" />
                    Scan failed.
                  </div>
                ) : (
                  <AnimatePresence>
                    {findings.map((finding, idx) => {
                      const colors = severityColor(finding.severity);
                      return (
                        <motion.div
                          key={`${finding.name}-${idx}`}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.06 }}
                          className={`flex items-center justify-between p-3 rounded-lg ${colors.bg} border ${colors.border}`}
                        >
                          <div className="flex items-center gap-2 text-neutral-200 text-xs font-medium">
                            <AlertTriangle className={`w-3.5 h-3.5 ${colors.text}`} /> {finding.name}
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 ${colors.badge} rounded`}>{finding.severity}</span>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Vulnerability Explorer */}
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
                <span className="text-xs text-neutral-600">Click a file → click a vulnerability → jump to affected lines</span>
              </div>
              <VulnerabilityExplorer files={scanFiles} />
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* History Sidebar */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="fixed top-0 right-0 w-full sm:w-96 h-screen bg-[#080808]/95 backdrop-blur-xl border-l border-white/[0.06] z-50 flex flex-col shadow-2xl"
          >
            <div className="p-6 border-b border-white/[0.06] flex justify-between items-center">
              <div>
                <h2 className="font-bold text-lg">Scan History</h2>
                <p className="text-xs text-neutral-600 mt-1">{history.length} / 10 Reports Saved</p>
              </div>
              <button onClick={() => setShowHistory(false)} className="text-neutral-600 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Storage Bar */}
            <div className="px-6 py-4 border-b border-white/[0.06]">
              <div className="flex justify-between text-xs text-neutral-500 mb-2">
                <span>Storage Used</span>
                <span className={history.length >= 10 ? "text-rose-400 font-bold" : "text-emerald-500"}>{history.length * 10}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${history.length * 10}%` }}
                  className={`h-full rounded-full ${history.length >= 10 ? "bg-rose-500" : history.length >= 7 ? "bg-amber-500" : "bg-emerald-500"}`}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {history.length === 0 ? (
                <div className="text-center text-neutral-600 py-10 text-sm">
                  No scan history yet.
                </div>
              ) : (
                history.map((report, idx) => {
                  let timestamp = "—";
                  if (report.timestamp) timestamp = new Date(report.timestamp).toLocaleDateString();
                  else if (report._id) timestamp = new Date(parseInt(report._id.substring(0, 8), 16) * 1000).toLocaleDateString();
                  
                  let risk = report.risk_score;
                  if (!risk && report.summary?.severity_counts) {
                    const r = calculateRisk([
                      ...Array(report.summary.severity_counts.CRITICAL || 0).fill({ severity: "CRITICAL" }),
                      ...Array(report.summary.severity_counts.HIGH || 0).fill({ severity: "HIGH" })
                    ] as any);
                    risk = r.score;
                  }
                  
                  return (
                  <div key={idx} className="p-4 rounded-xl canvas-card hover:border-white/10 transition-colors group">
                    <div className="flex justify-between items-start mb-2">
                      <button onClick={() => loadReport(report)} className="font-bold text-sm truncate pr-4 text-cyan-400 hover:text-cyan-300 transition-colors text-left">
                        {report.repo_name || report.repo || report.repo_url || "Repository"}
                      </button>
                      <div className="relative">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === report._id ? null : report._id); }} 
                          className="text-neutral-600 hover:text-white p-1 -mr-1 transition-colors"
                          title="Options"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        <AnimatePresence>
                          {openDropdownId === report._id && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95, y: -5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -5 }}
                              transition={{ duration: 0.15 }}
                              className="absolute right-0 top-full mt-1 w-28 bg-rose-950/40 backdrop-blur-xl border border-rose-500/30 rounded-lg overflow-hidden z-50 shadow-lg shadow-black/50"
                            >
                              <button 
                                onClick={(e) => deleteReport(report._id, e)} 
                                className="w-full px-3 py-2 text-left text-xs text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 font-bold transition-colors flex items-center gap-2"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-neutral-500">{report.summary?.total_findings || report.vulnerability_count || 0} findings</span>
                      <span className="text-xs font-bold px-2 py-0.5 bg-white/5 rounded text-neutral-400">
                        {risk || "—"}
                      </span>
                    </div>
                  </div>
                )})
              )}
            </div>

            {history.length >= 10 && (
              <div className="p-4 bg-rose-950/30 border-t border-rose-900/30 text-xs text-rose-400 text-center font-medium">
                Storage full — delete old reports in Settings
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <ChatAssistant />
    </div>
  );
}
