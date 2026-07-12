"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated" && pathname !== "/login") {
      router.push("/login");
    }
  }, [status, pathname, router]);

  // Don't render anything while checking auth to prevent layout flashes
  if (!isMounted || status === "loading") {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-background text-foreground space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <p className="text-sm text-neutral-500 font-mono tracking-widest uppercase animate-pulse">Initializing SentriX Core</p>
      </div>
    );
  }

  // If unauthenticated and not on login page, render nothing while redirect happens
  if (status === "unauthenticated" && pathname !== "/login") {
    return null;
  }

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthGuard>{children}</AuthGuard>
    </SessionProvider>
  );
}
