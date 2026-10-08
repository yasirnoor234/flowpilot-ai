import React from 'react';
import Link from 'next/link';
import { Workflow } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAFAF8] text-zinc-900 flex flex-col justify-center items-center p-4 selection:bg-indigo-500 selection:text-white">
      {/* Header Logo */}
      <div className="mb-8 flex flex-col items-center text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Workflow className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-zinc-900">
            FlowPilot <span className="text-indigo-600 font-semibold">AI</span>
          </span>
        </Link>
        <p className="text-xs text-zinc-500 mt-2 font-medium">
          Lead capture, qualification, and team automation
        </p>
      </div>

      {/* Auth Content Card */}
      <div className="w-full max-w-md">
        {children}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-zinc-400">
        FlowPilot AI &bull; Built by CodexveTech
      </div>
    </div>
  );
}

