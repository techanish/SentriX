import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Shield } from "lucide-react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SentriX AI",
  description: "Next-generation Autonomous Security Scanner",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans selection:bg-neutral-800 selection:text-white dark:selection:bg-neutral-200 dark:selection:text-black" suppressHydrationWarning>
        <ClerkProvider>
          {/* Global Navigation */}
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

          {/* Main Content Area */}
          <div className="flex-1">
          {children}
          </div>

          {/* Global Footer */}
          <footer className="w-full border-t border-black/10 dark:border-white/10 bg-background py-8 mt-auto">
          <div className="max-w-7xl mx-auto px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400">
          <div>
          Developer: <span className="text-foreground font-medium">techanish</span>
          </div>
          <div className="flex items-center gap-4">
          <a href="https://github.com/techanish" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors" aria-label="GitHub">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
          </a>
          <a href="https://linkedin.com/in/techanish" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors" aria-label="LinkedIn">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
          </a>
          <a href="https://instagram.com/techanish" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors" aria-label="Instagram">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
          </a>
          </div>
          </div>
          </footer>
        </ClerkProvider>
      </body>
    </html>
  );
}