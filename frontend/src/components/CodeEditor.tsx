"use client";

import Editor from "@monaco-editor/react";
import { useState } from "react";

interface CodeEditorProps {
  originalCode: string;
  fixedCode?: string;
  language?: string;
}

export function CodeEditor({ originalCode, fixedCode, language = "python" }: CodeEditorProps) {
  const [showFix, setShowFix] = useState(false);

  return (
    <div className="w-full h-[500px] border border-neutral-800 rounded-lg overflow-hidden flex flex-col bg-[#1e1e1e]">
      <div className="flex bg-neutral-900 border-b border-neutral-800 px-4 py-2 justify-between items-center">
        <div className="text-sm text-neutral-400 font-mono">
          {showFix ? "Secured Code (AI Generated)" : "Original Vulnerable Code"}
        </div>
        {fixedCode && (
          <button 
            onClick={() => setShowFix(!showFix)}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              showFix ? "bg-emerald-500/20 text-emerald-400" : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
            }`}
          >
            {showFix ? "View Original" : "View Fix"}
          </button>
        )}
      </div>
      <div className="flex-1">
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          value={showFix ? fixedCode : originalCode}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 14,
            scrollBeyondLastLine: false,
          }}
        />
      </div>
    </div>
  );
}
