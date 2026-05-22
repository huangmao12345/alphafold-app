"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type JobStatus = "SUBMITTED" | "APPROVED" | "IN_PROCESS" | "PROCESSED" | "FAILED";

// 🛠️ synchronized cleanly with our snake_case database schema values
interface Sequence {
  id: string;
  name: string;
  amino_acids: string;
  status: JobStatus;
  project: {
    name: string;
  };
}

export default function SequencesDashboard() {
  const router = useRouter();
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSequences = async () => {
      try {
        const response = await fetch("/api/graphql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `
              query GetSequences {
                sequences {
                  id
                  name
                  amino_acids
                  status
                  project {
                    name
                  }
                }
              }
            `,
          }),
        });

        const { data } = await response.json();
        if (data?.sequences) {
          setSequences(data.sequences);
        }
      } catch (error) {
        console.error("Failed to fetch sequences:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSequences();
  }, []);

  const getStatusBadge = (status: JobStatus) => {
    const styles = {
      SUBMITTED: "bg-slate-500/20 text-slate-300 border-slate-500/50",
      APPROVED: "bg-blue-500/20 text-blue-300 border-blue-500/50",
      IN_PROCESS: "bg-indigo-500/20 text-indigo-300 border-indigo-500/50",
      PROCESSED: "bg-emerald-500/20 text-emerald-300 border-emerald-500/50",
      FAILED: "bg-red-500/20 text-red-300 border-red-500/50",
    };
    return `px-3 py-1 text-xs font-semibold rounded-full border ${styles[status] || styles.SUBMITTED}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
            Sequence Dashboard
          </h1>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/50 hover:border-slate-600 rounded-md font-medium transition-all"
            >
              ← Back to Home
            </button>
            <button 
              onClick={() => router.push('/submit')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
            >
              + Submit New Sequence
            </button>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-700/50 rounded-lg shadow-xl overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400">Loading sequences...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/50 border-b border-slate-700/50">
                  <th className="p-4 font-semibold text-slate-300">Name</th>
                  <th className="p-4 font-semibold text-slate-300">Project</th>
                  <th className="p-4 font-semibold text-slate-300">Sequence</th>
                  <th className="p-4 font-semibold text-slate-300">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {sequences.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">
                      No sequences found. Submit one to get started.
                    </td>
                  </tr>
                ) : (
                  sequences.map((seq) => (
                    <tr 
                      key={seq.id}
                      onClick={() => router.push(`/sequences/${seq.id}`)}
                      className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                    >
                      <td className="p-4 font-medium text-slate-100 group-hover:text-blue-400 transition-colors">
                        {seq.name}
                      </td>
                      <td className="p-4 text-slate-400">{seq.project?.name || "N/A"}</td>
                      <td className="p-4">
                        <div className="max-w-xs truncate text-slate-500 font-mono text-sm">
                          {/* 🛠️ Fixed property linkage down here */}
                          {seq.amino_acids} 
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={getStatusBadge(seq.status)}>
                          {seq.status.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}