"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface SequenceEntry {
  id: string;
  name: string;
  projectId: string;
  sequence: string;
}

interface ProjectData {
  id: string;
  name: string;
}

export default function SubmitSequencesPage() {
  const [entries, setEntries] = useState<SequenceEntry[]>([
    { id: "init-1", name: "", projectId: "", sequence: "" },
  ]);

  // State to hold active structural tracking projects pulled from PostgreSQL records
  const [availableProjects, setAvailableProjects] = useState<ProjectData[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Fetch dynamic projects database records upon UI registration mount
  useEffect(() => {
    const fetchActiveProjects = async () => {
      try {
        const response = await fetch("/api/graphql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `
              query GetAvailableProjects {
                projects {
                  id
                  name
                }
              }
            `,
          }),
        });

        const json = await response.json();
        if (json.data && json.data.projects) {
          setAvailableProjects(json.data.projects);
        } else {
          setErrorMsg("Could not fetch valid project list assignments from records server context.");
        }
      } catch (err) {
        setErrorMsg("Network execution block trying to communicate with active projects layout.");
      }
    };

    fetchActiveProjects();
  }, []);

  const handleAddSequence = () => {
    if (entries.length < 10) {
      setEntries([
        ...entries,
        { id: Math.random().toString(), name: "", projectId: "", sequence: "" },
      ]);
    }
  };

  const handleRemoveSequence = (idToRemove: string) => {
    if (entries.length > 1) {
      setEntries(entries.filter((entry) => entry.id !== idToRemove));
      if (fieldErrors[idToRemove]) {
        const updatedErrors = { ...fieldErrors };
        delete updatedErrors[idToRemove];
        setFieldErrors(updatedErrors);
      }
    }
  };

  const handleChange = (
    id: string,
    field: keyof SequenceEntry,
    value: string
  ) => {
    setEntries(
      entries.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setFieldErrors({});
    setIsSuccess(false);

    // Sanity check ensuring the scientist filled out selections before pushing network resources
    const isFormFilled = entries.every(
      (entry) =>
        entry.name.trim() !== "" &&
        entry.projectId !== "" &&
        entry.sequence.trim() !== ""
    );

    if (!isFormFilled) {
      setErrorMsg("Please fill out all fields (including Project assignments) for every row card.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            mutation ProcessVaxcyteSequences($payload: [SequenceInput!]!) {
              submitBulkSequences(sequences: $payload) {
                id
                name
              }
            }
          `,
          variables: {
            payload: entries.map((entry) => ({
              name: entry.name,
              projectId: entry.projectId, // Now dynamically binding selection elements!
              aminoAcids: entry.sequence,
            }))
          },
        }),
      });

      const json = await response.json();

      if (json.errors && json.errors.length > 0) {
        const primaryError = json.errors[0].message;
        setErrorMsg(primaryError);
        alert(`Validation failure: ${primaryError}`);

        const contextMatch = primaryError.match(/"([^"]+)"/);
        if (contextMatch && contextMatch[1]) {
          const offendingName = contextMatch[1];
          const matchedEntry = entries.find((e) => e.name.trim() === offendingName);
          if (matchedEntry) {
            setFieldErrors({ [matchedEntry.id]: primaryError });
          }
        }
        setIsSubmitting(false);
        return;
      }

      setIsSuccess(true);
      // Flush form back to a clean state frame
      setEntries([{ id: Math.random().toString(), name: "", projectId: "", sequence: "" }]);

    } catch (networkError) {
      setErrorMsg("Severe system exception trying to communicate with backend gateway.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-8 text-slate-100">
      <div className="max-w-4xl mx-auto">

        {/* Navigation Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent pb-1">
              Submit Sequences
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Add up to 10 protein sequences for Alphafold processing.
            </p>
          </div>
          <div className="flex gap-4">
            <Link
              href="/"
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              ← Back to Home
            </Link>
            <Link
              href="/sequences"
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              View Dashboard
            </Link>
          </div>
        </div>

        {/* Success State */}
        {isSuccess && (
          <div className="mb-6 p-4 bg-emerald-900/30 border border-emerald-500/30 text-emerald-400 rounded-lg flex items-center justify-between shadow-sm">
            <p className="font-medium">
              Successfully validated and submitted {entries.length} sequence(s)!
            </p>
            <button
              onClick={() => setIsSuccess(false)}
              className="text-sm font-bold hover:text-emerald-300 transition-colors"
            >
              Submit More
            </button>
          </div>
        )}

        {/* Global Error State */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500/30 text-red-400 rounded-lg shadow-sm">
            <p className="font-medium">{errorMsg}</p>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {entries.map((entry, index) => {
            const hasError = !!fieldErrors[entry.id];
            return (
              <div
                key={entry.id}
                className={`bg-slate-800/50 p-6 rounded-2xl shadow-xl border relative transition-all ${hasError ? "border-red-500/50" : "border-slate-700/50"
                  }`}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className={`font-semibold ${hasError ? "text-red-400" : "text-slate-200"}`}>
                    Sequence #{index + 1} {hasError && "— Invalid"}
                  </h3>
                  {entries.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSequence(entry.id)}
                      disabled={isSubmitting}
                      className="text-slate-500 hover:text-red-400 transition-colors disabled:opacity-50"
                      aria-label="Remove sequence"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Name Input */}
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">
                      Sequence Name
                    </label>
                    <input
                      type="text"
                      value={entry.name}
                      onChange={(e) => handleChange(entry.id, "name", e.target.value)}
                      disabled={isSubmitting}
                      className={`w-full rounded-md bg-slate-900 border px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-800 disabled:text-slate-500 transition-colors ${hasError ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-slate-700"
                        }`}
                      placeholder="e.g. 6xHisLysozyme"
                    />
                  </div>

                  {/* Dynamic Project Dropdown Selection Layer */}
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">
                      Project Assignment
                    </label>
                    <select
                      value={entry.projectId}
                      onChange={(e) => handleChange(entry.id, "projectId", e.target.value)}
                      disabled={isSubmitting || availableProjects.length === 0}
                      className={`w-full rounded-md bg-slate-900 border px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-800 disabled:text-slate-500 transition-colors ${hasError ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-slate-700"
                        }`}
                    >
                      <option value="" disabled className="text-slate-500">
                        {availableProjects.length === 0 ? "Loading project options..." : "Select a project..."}
                      </option>
                      {availableProjects.map((proj) => (
                        <option key={proj.id} value={proj.id} className="bg-slate-900 text-slate-100">
                          {proj.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Amino Acid Sequence Textarea */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    Amino Acid Sequence
                  </label>
                  <textarea
                    value={entry.sequence}
                    onChange={(e) => handleChange(entry.id, "sequence", e.target.value)}
                    disabled={isSubmitting}
                    maxLength={1500}
                    rows={4}
                    className={`w-full rounded-md bg-slate-900 border px-3 py-2 text-sm font-mono text-slate-101 placeholder-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-800 disabled:text-slate-500 transition-colors ${hasError ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-slate-700"
                      }`}
                    placeholder="Paste raw FASTA/AA string here..."
                  />
                  <div className="flex justify-between mt-1">
                    <div>
                      {hasError && (
                        <span className="text-xs text-red-400 font-medium block">
                          {fieldErrors[entry.id]}
                        </span>
                      )}
                    </div>
                    <span className={`text-xs ${entry.sequence.length === 1500 ? 'text-red-400 font-bold' : 'text-slate-500'}`}>
                      {entry.sequence.length} / 1500
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-4">
            <div>
              {entries.length < 10 && (
                <button
                  type="button"
                  onClick={handleAddSequence}
                  disabled={isSubmitting}
                  className="text-sm font-medium text-blue-400 hover:text-blue-300 disabled:opacity-50 transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add another sequence
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || availableProjects.length === 0}
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-2.5 rounded-lg font-medium shadow-lg hover:shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-blue-500/50"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                "Submit Sequences"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}