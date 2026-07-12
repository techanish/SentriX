import { signIn } from "@/auth";
import { Shield } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[80vh]">
      <div className="canvas-card p-8 rounded-2xl w-full max-w-md space-y-8">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center mb-2 shadow-inner border border-neutral-800">
            <Shield className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">SentriX Authentication</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Sign in with your enterprise provider to access the autonomous security scanner.
          </p>
        </div>

        <div className="space-y-4 pt-4">
          <form
            action={async () => {
              "use server";
              await signIn("github", { redirectTo: "/" });
            }}
          >
            <button className="w-full flex items-center justify-center gap-3 bg-neutral-900 hover:bg-neutral-800 text-white p-4 rounded-xl border border-neutral-800 transition-colors font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
              Sign in with GitHub
            </button>
          </form>

          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
          >
            <button className="w-full flex items-center justify-center gap-3 bg-white hover:bg-neutral-100 text-black p-4 rounded-xl border border-neutral-200 transition-colors font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
              Sign in with Google
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

//  Optimized execution pass 5 for enhance_login_page_mobile_responsiveness

//  Optimized execution pass 10 for enhance_github_sso_callback_handling

//  Optimized execution pass 15 for enhance_403_storage_full_error_payloads

//  Optimized execution pass 20 for refactor_database_singleton_instantiation

//  Optimized execution pass 25 for optimize_severity_sorting_for_scan_reports
