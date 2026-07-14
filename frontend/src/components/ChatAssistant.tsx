"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, X, Bot, User } from "lucide-react";
import ReactMarkdown from 'react-markdown';

const TypingIndicator = () => (
  <div className="flex gap-1 items-center h-4 px-2">
    <motion.div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
    <motion.div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
    <motion.div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
  </div>
);

export function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm SentriX Chat Agent. I can help you understand the vulnerabilities found in your repository or explain the generated fixes. What would you like to know?" }
  ]);
  const [input, setInput] = useState("");

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    
    // Add loading state
    const loadingId = Date.now();
    setMessages(prev => [...prev, { id: loadingId, role: "assistant", content: "..." }]);

    try {
      const userApiKey = localStorage.getItem("sentrix_gemini_key") || undefined;
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
      const res = await fetch(`${apiBase}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: input,
          api_key: userApiKey
        })
      });
      const data = await res.json();
      
      setMessages(prev => prev.map(msg => 
        (msg as any).id === loadingId ? { role: "assistant", content: data.response || data.error } : msg
      ));
    } catch (e) {
      setMessages(prev => prev.map(msg => 
        (msg as any).id === loadingId ? { role: "assistant", content: "ERROR: Failed to connect to proxy." } : msg
      ));
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-900/50 transition-transform hover:scale-105 z-50"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-96 h-[500px] bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50"
          >
            <div className="p-4 bg-neutral-950 border-b border-neutral-800 flex justify-between items-center">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <Bot className="w-5 h-5" />
                SentriX AI Assistant
              </div>
              <button onClick={() => setIsOpen(false)} className="text-neutral-500 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "assistant" ? "bg-emerald-900/50 text-emerald-400" : "bg-neutral-800 text-neutral-300"}`}>
                    {msg.role === "assistant" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                  <div className={`p-3 rounded-lg text-sm max-w-[85%] ${msg.role === "assistant" ? "bg-neutral-800 text-neutral-200" : "bg-emerald-600 text-white"}`}>
                    {msg.content === "..." ? <TypingIndicator /> : (
                      msg.role === "assistant" ? (
                        <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-neutral-900 prose-pre:border prose-pre:border-neutral-700">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        msg.content
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex gap-2">
              <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                placeholder="Ask about security..."
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
              />
              <button 
                onClick={handleSend}
                className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
