import React from 'react';

interface SequencePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SequenceDetailsPage({ params }: SequencePageProps) {
  // Await the dynamic route parameters safely in the App Router
  const resolvedParams = await params;
  const sequenceId = resolvedParams.id;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Block */}
        <header className="border-b border-slate-700 pb-4 mb-6">
          <span className="text-xs font-semibold tracking-wider text-teal-400 uppercase">
            Vaxcyte AlphaFold Portal
          </span>
          <h1 className="text-3xl font-bold mt-1">
            Sequence Analysis Workflow
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Target ID: <span className="font-mono text-slate-200">{sequenceId}</span>
          </p>
        </header>

        {/* Dashboard Grid Placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Metadata Section */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-slate-200">Sequence Metadata</h2>
            <p className="text-sm text-slate-400 italic">
              Database query for metadata placeholder...
            </p>
          </div>

          {/* AlphaFold 3D Render Output Section */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-md flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-4 text-slate-200">AlphaFold Prediction Output</h2>
              <p className="text-sm text-slate-400 italic">
                PDB structures and confidence scores placeholder...
              </p>
            </div>
            <div className="mt-6 bg-slate-950 h-32 rounded border border-slate-800 flex items-center justify-center text-xs text-slate-500 font-mono">
              [ 3D Structure Canvas Placeholder ]
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}