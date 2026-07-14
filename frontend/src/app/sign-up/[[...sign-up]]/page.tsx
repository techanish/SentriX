import { SignUp } from "@clerk/nextjs";
import { Shield } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="flex flex-col items-center gap-8">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src="/logo.png" alt="SentriX AI" className="w-10 h-10 object-contain drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
            <span className="text-2xl font-black tracking-tight">
              Sentri<span className="text-emerald-500">X</span>
            </span>
          </div>
          <h1 className="text-xl font-bold text-neutral-200">Initialize Your Node</h1>
          <p className="text-xs text-neutral-600 max-w-xs">
            Create your account to deploy your personal security scanning agent and storage container.
          </p>
        </div>
        <SignUp />
      </div>
    </div>
  );
}
