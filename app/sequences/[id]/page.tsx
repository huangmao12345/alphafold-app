import React from "react";
import Link from "next/link";

type JobStatus = "SUBMITTED" | "APPROVED" | "IN_PROCESS" | "PROCESSED" | "FAILED";

interface SequenceData {
  id: string;
  name: string;
  aminoAcids: string;
  status: JobStatus;
  project: {
    name: string;
  };
}

interface SequencePageProps {
  params: Promise<{
    id: string;
  }>;
}

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

// Real GraphQL Fetching Engine
async function getSequenceData(id: string): Promise<SequenceData | null> {
  const query = `
    query GetSequence($id: ID!) {
      sequence(id: $id) {
        id
        name
        aminoAcids
        status
        project {
          name
        }
      }
    }
  `;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables: { id } }),
      cache: 'no-store', 
    });

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();
    if (json.errors) {
      console.error("GraphQL errors:", json.errors);
      return null;
    }
    return json.data.sequence;
  } catch (error) {
    console.error("Fetch error:", error);
    return null;
  }
}

export default async function SequenceDetailsPage({ params }: SequencePageProps) {
  const resolvedParams = await params;
  const sequenceId = resolvedParams.id;
  const sequence = await getSequenceData(sequenceId);

  // Fallback if sequence is missing from DB
  if (!sequence) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-300">Sequence Not Found</h1>
          <p className="text-slate-500 mt-2">The sequence ID you requested does not exist in the dashboard engine.</p>
          <Link href="/sequences" className="text-teal-400 mt-4 inline-block hover:underline">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Block */}
        <header className="border-b border-slate-700 pb-4 mb-6 flex justify-between items-start">
          <div>
            <span className="text-xs font-semibold tracking-wider text-teal-400 uppercase">
              Vaxcyte AlphaFold Portal
            </span>
            <h1 className="text-3xl font-bold mt-1">{sequence.name}</h1>
            <p className="text-slate-400 text-sm mt-1">
              Project: <span className="font-semibold text-slate-200">{sequence.project.name}</span>
            </p>
          </div>
          <div className="flex flex-col items-end gap-3 mt-2">
            <Link 
              href="/sequences" 
              className="text-xs font-medium text-slate-400 hover:text-teal-400 transition-colors flex items-center gap-1 group"
            >
              <span className="transform group-hover:-translate-x-0.5 transition-transform">←</span> 
              Back to Sequences
            </Link>
            <span className={getStatusBadge(sequence.status)}>
              {sequence.status.replace("_", " ")}
            </span>
          </div>
        </header>

        {/* Content Stack */}
        <div className="flex flex-col gap-6">
          
          {/* Metadata Section */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-slate-200">Sequence Metadata</h2>
            <div className="bg-slate-900 p-4 rounded-md border border-slate-700">
              <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-2">Raw Amino Acid Sequence</h3>
              <p className="text-sm text-slate-300 font-mono break-all leading-relaxed tracking-tight">
                {sequence.aminoAcids}
              </p>
            </div>
          </div>

          {/* AlphaFold 3D Render Output Section */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-md flex flex-col justify-between">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-slate-200">AlphaFold Prediction Output</h2>
              
              {/* Conditional Action: Show Download Button only when status is PROCESSED */}
              {sequence.status === "PROCESSED" && (
                <button 
                  disabled
                  className="bg-teal-600/50 text-teal-200 border border-teal-500/30 px-4 py-1.5 text-xs font-medium rounded opacity-60 cursor-not-allowed flex items-center gap-1.5 shadow"
                >
                  <span>⬇</span> Download AlphaFold Data
                </button>
              )}
            </div>

            {/* Dynamic Status Engine Blocks */}
            {["SUBMITTED", "APPROVED", "IN_PROCESS"].includes(sequence.status) && (
              <div className="bg-slate-950 h-96 rounded border border-slate-800 flex flex-col items-center justify-center text-center p-6">
                <div className="animate-pulse text-indigo-400 text-2xl mb-2">⌁</div>
                <p className="text-sm font-medium text-slate-400">AlphaFold Output not available</p>
                <p className="text-xs text-slate-500 mt-1">Prediction pipeline is currently queued or active. Check back later.</p>
              </div>
            )}

            {sequence.status === "PROCESSED" && (
              <div className="bg-slate-950 h-96 rounded border border-slate-800 flex items-center justify-center text-xs text-slate-400 font-mono">
                [ Insert AlphaFold Output Data Here - Ready for 3Dmol.js Canvas Canvas ]
              </div>
            )}

            {sequence.status === "FAILED" && (
              <div className="bg-slate-950 h-96 rounded border border-slate-800 flex flex-col items-center justify-center text-center p-6 border-red-900/30">
                <div className="text-red-400 text-3xl mb-2">⚠</div>
                <p className="text-sm font-semibold text-red-400 uppercase tracking-wide">Sequence Execution Failed</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  The folding pipeline encountered an error parsing the FASTA residue geometry. Please check target validation parameters.
                </p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}