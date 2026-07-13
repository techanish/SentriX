"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { Shield } from "lucide-react";

export function NavBar() {
  const { isSignedIn, isLoaded, user } = useUser();
  const { openSignIn, openSignUp, signOut, openUserProfile } = useClerk();

  return (
    <nav className="w-full border-b border-white/5 bg-black/60 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-3.5 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative">
            <Shield className="w-6 h-6 text-emerald-500 transition-transform group-hover:scale-110" />
            <div className="absolute inset-0 bg-emerald-500/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="text-lg font-black tracking-tight">
            Sentri<span className="text-emerald-500">X</span>
          </span>
          <span className="hidden sm:inline-flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </Link>

        <div className="flex items-center gap-5 text-sm font-medium">
          <Link href="/docs" className="text-neutral-500 hover:text-neutral-200 transition-colors">
            Docs
          </Link>
          <Link href="/settings" className="text-neutral-500 hover:text-neutral-200 transition-colors">
            Settings
          </Link>

          <div className="pl-4 border-l border-white/10 flex items-center gap-3">
            {isLoaded && !isSignedIn && (
              <>
                <button 
                  onClick={() => openSignIn()}
                  className="text-neutral-400 hover:text-white transition-colors text-sm"
                >
                  Sign In
                </button>
                <button 
                  onClick={() => openSignUp()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg font-bold text-sm transition-all hover:shadow-lg hover:shadow-emerald-900/30"
                >
                  Get Started
                </button>
              </>
            )}
            {isLoaded && isSignedIn && (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => openUserProfile()}
                  className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center overflow-hidden border border-emerald-500/30 hover:border-emerald-500 transition-colors"
                  title="Profile"
                >
                  {user?.imageUrl ? (
                    <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <Shield className="w-4 h-4 text-emerald-500" />
                  )}
                </button>
                <button 
                  onClick={async () => {
                    await signOut();
                    window.location.href = "/";
                  }}
                  className="text-neutral-500 hover:text-rose-400 transition-colors text-xs font-bold"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
