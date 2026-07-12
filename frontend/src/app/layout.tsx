import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Shield, Github, Linkedin, Instagram } from "lucide-react";
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
        
        {/* Global Navigation */}
        <nav className="w-full border-b border-black/10 dark:border-white/10 bg-background/80 backdrop-blur-md sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Shield className="w-6 h-6 text-foreground" />
              <span className="text-xl font-bold tracking-tight">SentriX</span>
            </Link>
            <div className="flex gap-6 text-sm font-medium text-neutral-500 dark:text-neutral-400">
              <Link href="/docs" className="hover:text-foreground transition-colors">Documentation</Link>
              <Link href="/settings" className="hover:text-foreground transition-colors">Settings</Link>
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
              <a href="https://github.com/techanish" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="https://linkedin.com/in/techanish" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="https://instagram.com/techanish" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
        </footer>

      </body>
    </html>
  );
}
