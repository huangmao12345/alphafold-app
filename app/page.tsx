"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-4xl w-full text-center space-y-8">
        {/* Header Section */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm border border-blue-500/20 font-medium">
            🧬 Vaxcyte Biologics Platform
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Alphafold Sequence Management Portal
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Submit raw amino acid chains, manage active predictive folding pipelines, 
            and analyze 3D protein models in real time.
          </p>
        </div>

        <hr className="border-slate-800 my-8" />

        {/* Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          
          {/* Action 1: Submit a Sequence */}
          <Link 
            href="/submit" 
            className="group relative flex flex-col justify-between p-6 bg-slate-800/50 hover:bg-slate-800 rounded-2xl border border-slate-700/50 hover:border-blue-500/50 transition-all duration-200 text-left shadow-xl hover:shadow-blue-500/5"
          >
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 text-xl font-bold group-hover:scale-110 transition-transform duration-200">
                ＋
              </div>
              <h2 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors">
                Submit Sequence
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Enter FASTA formatting or raw strings up to 1,500 characters to initiate local on-premise Alphafold execution.
              </p>
            </div>
            <div className="mt-6 text-xs text-blue-400 font-medium flex items-center gap-1">
              Go to submission form <span className="transform group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>

          {/* Action 2: View Submitted Sequences */}
          <Link 
            href="/sequences" 
            className="group relative flex flex-col justify-between p-6 bg-slate-800/50 hover:bg-slate-800 rounded-2xl border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-200 text-left shadow-xl hover:shadow-indigo-500/5"
          >
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 text-xl font-bold group-hover:scale-110 transition-transform duration-200">
                ☰
              </div>
              <h2 className="text-xl font-semibold text-white group-hover:text-indigo-400 transition-colors">
                Sequence Dashboard
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Monitor live cluster job queues, view processing logs, and filter through the master registry of corporate sequence data.
              </p>
            </div>
            <div className="mt-6 text-xs text-indigo-400 font-medium flex items-center gap-1">
              Open master registry <span className="transform group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>

        </div>

        {/* Footer / Status Indicator */}
        <div className="pt-8 text-xs text-slate-500 flex items-center justify-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Connected to secure GraphQL endpoint via `/api/graphql`
        </div>
      </div>
    </main>
  );
}