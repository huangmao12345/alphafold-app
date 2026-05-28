"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type JobStatus = "SUBMITTED" | "APPROVED" | "IN_PROCESS" | "PROCESSED" | "FAILED";

interface Sequence {
  id: string;
  name: string;
  aminoAcids: string; // Grabbed from GraphQL request
  createdAt: string;
  project: {
    name: string;
  };
}

export default function ApproveSequencesDashboard() {
  const router = useRouter();
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State Layers
  const [activeModalSequence, setActiveModalSequence] = useState<Sequence | null>(null);

  // 1. Updated GraphQL Fetching Engine to grab aminoAcids
  useEffect(() => {
    const fetchSubmittedSequences = async () => {
      try {
        const query = `
          query GetSubmittedSequences {
            sequences {
              id
              name
              aminoAcids
              createdAt
              status
              project {
                name
              }
            }
          }
        `;

        const response = await fetch("/api/graphql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });

        if (!response.ok) {
          throw new Error(`Server returned status code ${response.status}`);
        }

        const { data, errors } = await response.json();
        
        if (errors && errors.length > 0) {
          throw new Error(errors[0].message);
        }

        if (data?.sequences) {
          const filtered = data.sequences.filter(
            (seq: any) => seq.status === "SUBMITTED"
          );
          setSequences(filtered);
        }
      } catch (err: any) {
        console.error("Failed to fetch sequences:", err);
        setError(err.message || "Failed to load submitted sequences.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmittedSequences();
  }, []);

  // 2. Selection Logic Handlers (Checkbox Bound Only)
  const handleToggleSelectAll = () => {
    if (selectedIds.size === sequences.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sequences.map((seq) => seq.id)));
    }
  };

  const handleToggleRowCheckbox = (id: string) => {
    const nextSelected = new Set(selectedIds);
    if (nextSelected.has(id)) {
      nextSelected.delete(id);
    } else {
      nextSelected.add(id);
    }
    setSelectedIds(nextSelected);
  };

  const handlePipelineSubmission = () => {
    if (selectedIds.size === 0) return;
    const targetsToProcess = Array.from(selectedIds);
    alert(`Staging backend pipeline execution for ${targetsToProcess.length} target structure(s).`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section Layout */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Submitted Sequences for Approval
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Select and dispatch pending sequences directly into the AlphaFold prediction engine.
            </p>
          </div>
          <Link 
            href="/sequences"
            className="px-4 py-2 text-sm bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-md font-medium transition-colors"
          >
            ← Main Dashboard
          </Link>
        </div>

        {/* Action Controls & Data Metrics Bar */}
        <div className="flex justify-between items-center bg-slate-900/50 border border-slate-800/60 rounded-t-lg p-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleToggleSelectAll}
              disabled={sequences.length === 0}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded transition-colors disabled:opacity-50"
            >
              {selectedIds.size === sequences.length && sequences.length > 0 
                ? "Deselect All" 
                : "Select All Sequences"}
            </button>
            <span className="text-xs text-slate-400">
              {selectedIds.size} of {sequences.length} selected
            </span>
          </div>

          <button
            onClick={handlePipelineSubmission}
            disabled={selectedIds.size === 0}
            className={`px-4 py-2 text-sm font-medium rounded-md shadow-sm transition-all ${
              selectedIds.size > 0
                ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/30"
            }`}
          >
            Submit {selectedIds.size} Sequence{selectedIds.size !== 1 ? "s" : ""} to AlphaFold
          </button>
        </div>

        {/* Data Presentation Table Grid */}
        <div className="bg-slate-900/30 border-x border-b border-slate-800/60 rounded-b-lg overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              <div className="animate-pulse">Querying active GraphQL nodes for submitted records...</div>
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-400 text-sm border-t border-red-900/20 bg-red-950/10">
              ⚠️ {error}
            </div>
          ) : sequences.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              No pending sequences found with status <code className="bg-slate-800 px-1.5 py-0.5 rounded text-blue-300 font-mono text-xs">SUBMITTED</code>.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/20 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-4 px-6 w-12 text-center">Select</th>
                    <th className="py-4 px-4">Sequence Target Name</th>
                    <th className="py-4 px-4"># of Amino Acids</th>
                    <th className="py-4 px-4">Associated Project</th>
                    <th className="py-4 px-4 text-right">Date/Time Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
                  {sequences.map((sequence) => {
                    const isChecked = selectedIds.has(sequence.id);
                    return (
                      <tr 
                        key={sequence.id}
                        className={`hover:bg-slate-800/30 transition-colors cursor-pointer ${
                          isChecked ? "bg-blue-950/5" : ""
                        }`}
                        onClick={() => setActiveModalSequence(sequence)} // Clicking row opens Modal
                      >
                        {/* Checkbox Column - Only this allows selection */}
                        <td 
                          className="py-4 px-6 text-center" 
                          onClick={(e) => e.stopPropagation()} // Prevents launching the modal on checkbox container click
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleRowCheckbox(sequence.id)}
                            className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-950 cursor-pointer"
                          />
                        </td>

                        {/* Metadata Field Elements */}
                        <td className="py-4 px-4 font-medium text-slate-200">
                          {sequence.name}
                        </td>
                        <td className="py-4 px-4 text-indigo-300 font-mono text-xs">
                          {sequence.aminoAcids ? `${sequence.aminoAcids.length} AA` : "0 AA"}
                        </td>
                        <td className="py-4 px-4">
                          <span className="bg-slate-800/60 px-2 py-1 text-xs rounded border border-slate-700/50 text-slate-300">
                            {sequence.project?.name || "Unassigned"}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400 font-mono text-xs">
                        {sequence.createdAt ? (() => {
                          // 1. Coerce whatever type comes across into a base-10 integer number
                          const timestampInt = parseInt(String(sequence.createdAt), 10);
                          
                          // 2. If it's a valid numerical timestamp, build a real date, otherwise wrap the raw string fallback
                          const dateObject = !isNaN(timestampInt) ? new Date(timestampInt) : new Date(sequence.createdAt);
                          
                          // 3. Fallback check to safely print just the YYYY-MM-DD string part without crashing
                          return !isNaN(dateObject.getTime()) 
                            ? dateObject.toISOString().split('T')[0] 
                            : "N/A";
                        })() : "N/A"}
                      </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 3. Sliding/Popping Overlay Dialogue Modal for Sequence Inspection */}
        {activeModalSequence && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
            <div 
              className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 overflow-hidden"
              onClick={(e) => e.stopPropagation()} // Keeps interior modal clicks from triggering close events
            >
              {/* Header block within modal */}
              <div className="flex justify-between items-start border-b border-slate-800 pb-4 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-100">
                    {activeModalSequence.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Project: {activeModalSequence.project?.name || "Unassigned"} • {activeModalSequence.aminoAcids?.length || 0} residues
                  </p>
                </div>
                <button
                  onClick={() => setActiveModalSequence(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Target Text Data Area */}
              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                  Sequence:
                </label>
                <div className="w-full bg-slate-950 p-4 border border-slate-800/80 rounded-lg max-h-60 overflow-y-auto font-mono text-xs text-emerald-400 tracking-wide break-all select-all whitespace-pre-wrap">
                  {activeModalSequence.aminoAcids || "No sequence payload defined."}
                </div>
              </div>

              {/* Modal Control Action footer */}
              <div className="flex justify-end mt-6 pt-4 border-t border-slate-800">
                <button
                  onClick={() => setActiveModalSequence(null)}
                  className="px-4 py-2 text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors"
                >
                  Close Inspection Window
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}