"use client";

import { Settings, Key, Bell, Shield, Terminal, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NODE_ENV === "production" ? "/api/backend/api" : "http://localhost:8000/api";

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  
  const [apiKey, setApiKey] = useState("");
  const [isDeletingData, setIsDeletingData] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const email = user?.primaryEmailAddress?.emailAddress;

  const handleDeleteData = async () => {
    if (!email || !confirm("Are you sure you want to delete all 10 scan reports? This cannot be undone.")) return;
    setIsDeletingData(true);
    try {
      await fetch(`${API_BASE}/settings/data`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_email: email })
      });
      alert("All scan reports have been deleted.");
    } catch (e) {
      console.error(e);
      alert("Failed to delete data.");
    }
    setIsDeletingData(false);
  };

  const handleDeleteAccount = async () => {
    if (!email || !confirm("Are you sure you want to completely delete your account and all data? You will be logged out immediately.")) return;
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
      alert("Failed to delete account.");
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-8 py-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-4 flex items-center gap-3">
            <Settings className="w-8 h-8 text-neutral-400" />
            Node Settings
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-lg">
            Configure your SentriX local environment, manage API keys, and adjust scanning parameters.
          </p>
          {isLoaded && user && (
            <div className="mt-4 inline-block px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-neutral-400">
              Authenticated as: <span className="text-white font-bold">{email}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          {/* Sidebar */}
          <div className="space-y-2">
            <button className="w-full text-left px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 font-medium text-foreground flex items-center gap-2">
              <Key className="w-4 h-4" /> API Keys
            </button>
            <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-500 transition-colors flex items-center gap-2">
              <Terminal className="w-4 h-4" /> Scanner Engine
            </button>
            <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-500 transition-colors flex items-center gap-2">
              <Bell className="w-4 h-4" /> Notifications
            </button>
            <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-500 transition-colors flex items-center gap-2">
              <Shield className="w-4 h-4" /> Security
            </button>
          </div>

          {/* Main Panel */}
          <div className="md:col-span-2 space-y-6">
            <div className="canvas-card p-6 rounded-2xl space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Key className="w-5 h-5 text-emerald-500" />
                Google Gemini API Key
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Provide your API key to power the AI scanning engine. Your key is stored securely in your browser and never transmitted to our servers except to query the models.
              </p>
              
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">API Key</label>
                <div className="flex gap-2">
                  <input 
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AQ.Ab8R..."
                    className="flex-1 bg-transparent border border-neutral-300 dark:border-neutral-700 rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-emerald-500 transition"
                  />
                  <button className="bg-foreground text-background px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity">
                    Save
                  </button>
                </div>
              </div>
            </div>

            <div className="canvas-card p-6 rounded-2xl space-y-6 border-l-4 border-l-rose-500">
              <h3 className="text-xl font-bold text-rose-500">Danger Zone</h3>
              
              <div className="space-y-2">
                <h4 className="font-bold">Purge Scan History</h4>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Clear all 10 saved vulnerability reports from the backend storage container to free up space.
                </p>
                <button 
                  onClick={handleDeleteData}
                  disabled={isDeletingData || !user}
                  className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-500 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isDeletingData ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Delete Data
                </button>
              </div>

              <div className="w-full h-px bg-white/10" />

              <div className="space-y-2">
                <h4 className="font-bold">Delete Account</h4>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Permanently wipe your account, settings, and all associated scan clusters from the SentriX DB.
                </p>
                <button 
                  onClick={handleDeleteAccount}
                  disabled={isDeletingAccount || !user}
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isDeletingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
