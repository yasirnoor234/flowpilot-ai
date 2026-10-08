import React from 'react';
import Link from 'next/link';
import { Sparkles, Bot, Zap, ShieldCheck } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center p-4 selection:bg-indigo-500 selection:text-white overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/15 blur-[120px] pointer-events-none" />

      {/* Header Logo */}
      <div className="mb-8 flex flex-col items-center text-center z-10">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            FlowPilot <span className="text-indigo-400 font-medium">AI</span>
          </span>
        </Link>
        <p className="text-xs text-zinc-400 mt-2 font-medium">
          Autonomous AI Business Automation for High-Velocity Teams
        </p>
      </div>

      {/* Auth Content Card */}
      <div className="w-full max-w-md z-10">
        {children}
      </div>

      {/* Trust Badges */}
      <div className="mt-8 flex items-center gap-6 text-xs text-zinc-500 z-10">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Tenant Isolated RLS</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap className="h-4 w-4 text-amber-400" />
          <span>Durable Serverless Engine</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-indigo-400" />
          <span>OpenAI Powered</span>
        </div>
      </div>
    </div>
  );
}
