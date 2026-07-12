"use client";

import { Settings, Key, Database, Trash2, Loader2, AlertTriangle, Shield, User, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NODE_ENV === "production" ? "/api/backend/api" : "http://localhost:8000/api";

type SettingsTab = "storage" | "api" | "danger";

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<SettingsTab>("storage");
  const [apiKey, setApiKey] = useState("");
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [isDeletingData, setIsDeletingData] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteDataConfirm, setShowDeleteDataConfirm] = useState(false);
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
  const [reportCount, setReportCount] = useState(0);

  const email = user?.primaryEmailAddress?.emailAddress;

  // Fetch report count for storage visualization
  useEffect(() => {
    if (email) {
      fetch(`${API_BASE}/history?user_email=${encodeURIComponent(email)}`)
        .then(res => res.json())
        .then(data => {
          const reports = data.reports || data.history || [];
          setReportCount(reports.length);
        })
        .catch(() => {});
    }
  }, [email]);

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem("sentrix_gemini_key", apiKey.trim());
      setApiKeySaved(true);
      setTimeout(() => setApiKeySaved(false), 2000);
    }
  };

  useEffect(() => {
    const savedKey = localStorage.getItem("sentrix_gemini_key");
    if (savedKey) setApiKey(savedKey);
  }, []);

  const handleDeleteData = async () => {
    if (!email) return;
    setIsDeletingData(true);
    try {
      await fetch(`${API_BASE}/settings/data`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_email: email })
      });
      setReportCount(0);
      setShowDeleteDataConfirm(false);
    } catch (e) {
      console.error(e);
    }
    setIsDeletingData(false);
  };

  const handleDeleteAccount = async () => {
    if (!email) return;
    setIsDeletingAccount(true);
    try {
      await fetch(`${API_BASE}/settings/account`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_email: email })
      });
      await signOut();
      router.push("/");
    } catch (e) {
      console.error(e);
      setIsDeletingAccount(false);
    }
  };

  // Not signed in state
  if (isLoaded && !user) {
    return (
      <div className="max-w-4xl mx-auto px-8 py-24 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Shield className="w-16 h-16 text-neutral-700 mx-auto" />
          <h1 className="text-3xl font-black tracking-tight">Authentication Required</h1>
          <p className="text-neutral-500 text-sm max-w-md mx-auto">
            Sign in to access your SentriX settings, manage your storage container, and configure your API keys.
          </p>
        </motion.div>
      </div>
    );
  }

  const tabs = [
    { id: "storage" as SettingsTab, label: "Storage", icon: Database },
    { id: "api" as SettingsTab, label: "API Keys", icon: Key },
    { id: "danger" as SettingsTab, label: "Danger Zone", icon: AlertTriangle },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 sm:px-8 py-12 sm:py-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3 flex items-center gap-3">
            <Settings className="w-7 h-7 text-neutral-600" />
            Settings
          </h1>
          <p className="text-neutral-500 text-sm">
            Manage your storage, configure API keys, and control your account.
          </p>
        </div>

        {/* Account Card */}
        {user && (
          <div className="canvas-card rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 overflow-hidden">
              {user.imageUrl ? (
                <img src={user.imageUrl} alt="" className="w-full h-full object-cover rounded-full" />
              ) : (
                <User className="w-6 h-6 text-emerald-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{user.fullName || "SentriX Operator"}</p>
              <p className="text-xs text-neutral-500 truncate">{email}</p>
            </div>
            <div className="text-right shrink-0 flex items-center gap-2">
              <button 
                onClick={() => openUserProfile()}
                className="hidden sm:flex px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-bold transition-colors items-center gap-2"
              >
                <Settings className="w-3.5 h-3.5" /> Manage
              </button>
              <button 
                onClick={async () => {
                  try {
                    await signOut();
                    router.push('/');
                  } catch (err) {
                    console.error("Sign out failed", err);
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-xs font-bold transition-colors flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Tabs + Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

          {/* Sidebar Tabs */}
          <div className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all flex items-center gap-2.5 ${
                  activeTab === tab.id
                    ? tab.id === "danger"
                      ? "bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20"
                      : "bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20"
                    : "text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.03] border border-transparent"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="md:col-span-3">
            <AnimatePresence mode="wait">

              {/* STORAGE TAB */}
              {activeTab === "storage" && (
                <motion.div key="storage" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                  <div className="canvas-card rounded-2xl p-6 space-y-6">
                    <div>
                      <h3 className="text-lg font-bold flex items-center gap-2 mb-1">
                        <Database className="w-5 h-5 text-emerald-500" />
                        Storage Container
                      </h3>
                      <p className="text-xs text-neutral-500">
                        Each account gets a dedicated storage container capped at 10 scan reports. Reports include full vulnerability data, affected file contents, and risk assessments.
                      </p>
                    </div>

                    {/* Usage Bar */}
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-400 font-medium">Reports Used</span>
                        <span className={`font-bold ${reportCount >= 10 ? "text-rose-400" : reportCount >= 7 ? "text-amber-400" : "text-emerald-400"}`}>
                          {reportCount} / 10
                        </span>
                      </div>
                      <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${reportCount * 10}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className={`h-full rounded-full transition-colors ${
                            reportCount >= 10 ? "bg-rose-500" : reportCount >= 7 ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-neutral-600">
                        <span>0</span>
                        <span>5</span>
                        <span>10</span>
                      </div>
                    </div>

                    {reportCount >= 10 && (
                      <div className="flex items-start gap-3 p-4 rounded-lg bg-rose-950/30 border border-rose-900/30 text-sm">
                        <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-rose-300 font-bold">Storage Full</p>
                          <p className="text-rose-400/80 text-xs mt-1">You cannot run new scans until you clear existing reports. Go to the Danger Zone tab to purge your data.</p>
                        </div>
                      </div>
                    )}

                    {reportCount > 0 && reportCount < 10 && (
                      <p className="text-xs text-neutral-600">
                        You have <span className="text-neutral-400 font-bold">{10 - reportCount}</span> report slots remaining.
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* API KEY TAB */}
              {activeTab === "api" && (
                <motion.div key="api" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                  <div className="canvas-card rounded-2xl p-6 space-y-5">
                    <div>
                      <h3 className="text-lg font-bold flex items-center gap-2 mb-1">
                        <Key className="w-5 h-5 text-emerald-500" />
                        Google Gemini API Key
                      </h3>
                      <p className="text-xs text-neutral-500">
                        Your key powers the AI scanning engine. It is stored locally in your browser and only transmitted to query Google&apos;s Gemini API during scans.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-600">API Key</label>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="AQ.Ab8R..."
                          className="flex-1 bg-white/[0.02] border border-white/[0.08] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition font-mono"
                        />
                        <button
                          onClick={handleSaveApiKey}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-all"
                        >
                          {apiKeySaved ? "Saved ✓" : "Save"}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* DANGER ZONE TAB */}
              {activeTab === "danger" && (
                <motion.div key="danger" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                  <div className="canvas-card rounded-2xl p-6 space-y-6 border-l-2 border-l-rose-500/50">
                    <h3 className="text-lg font-bold text-rose-400 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Danger Zone
                    </h3>

                    {/* Purge Data */}
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-bold text-sm">Purge Scan History</h4>
                        <p className="text-xs text-neutral-500 mt-1">
                          Permanently delete all {reportCount} saved vulnerability reports from your storage container. This frees up space for new scans.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowDeleteDataConfirm(true)}
                        disabled={isDeletingData || !user || reportCount === 0}
                        className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 disabled:opacity-30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete All Reports ({reportCount})
                      </button>
                    </div>

                    <div className="w-full h-px bg-white/[0.06]" />

                    {/* Delete Account */}
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-bold text-sm">Delete Account</h4>
                        <p className="text-xs text-neutral-500 mt-1">
                          Permanently destroy your storage container and all associated data from the SentriX database. You will be signed out immediately.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowDeleteAccountConfirm(true)}
                        disabled={isDeletingAccount || !user}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2 disabled:opacity-30"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Delete Account
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Confirmation Modals */}
      <AnimatePresence>
        {showDeleteDataConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="canvas-card rounded-2xl p-6 max-w-sm w-full"
            >
              <h3 className="text-lg font-black mb-2 text-rose-400">Confirm Purge</h3>
              <p className="text-xs text-neutral-500 mb-6">
                This will permanently delete all {reportCount} scan reports from your storage container. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteDataConfirm(false)} className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 hover:bg-white/5 text-sm font-bold transition-colors">
                  Cancel
                </button>
                <button onClick={handleDeleteData} disabled={isDeletingData} className="flex-1 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                  {isDeletingData && <Loader2 className="w-4 h-4 animate-spin" />}
                  Purge Data
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showDeleteAccountConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="canvas-card rounded-2xl p-6 max-w-sm w-full"
            >
              <h3 className="text-lg font-black mb-2 text-rose-400">Delete Account</h3>
              <p className="text-xs text-neutral-500 mb-6">
                This will permanently destroy your SentriX account, storage container, and all scan data. You will be signed out immediately. This cannot be reversed.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteAccountConfirm(false)} className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 hover:bg-white/5 text-sm font-bold transition-colors">
                  Cancel
                </button>
                <button onClick={handleDeleteAccount} disabled={isDeletingAccount} className="flex-1 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                  {isDeletingAccount && <Loader2 className="w-4 h-4 animate-spin" />}
                  Delete Forever
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
