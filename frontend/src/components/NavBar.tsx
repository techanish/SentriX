"use client";

import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Shield } from "lucide-react";

export function NavBar() {
  return (
    <nav className="w-full border-b border-black/10 dark:border-white/10 bg-background/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Shield className="w-6 h-6 text-foreground" />
          <span className="text-xl font-bold tracking-tight">SentriX</span>
        </Link>
        <div className="flex items-center gap-6 text-sm font-medium text-neutral-500 dark:text-neutral-400">
          <Link href="/docs" className="hover:text-foreground transition-colors">Documentation</Link>
          <Link href="/settings" className="hover:text-foreground transition-colors">Settings</Link>
          
          <div className="pl-4 border-l border-neutral-300 dark:border-neutral-700 flex items-center gap-4">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="hover:text-foreground transition-colors">Sign In</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="bg-foreground text-background px-4 py-2 rounded-lg font-bold hover:opacity-90 transition-opacity">Sign Up</button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </div>
        </div>
      </div>
    </nav>
  );
}
