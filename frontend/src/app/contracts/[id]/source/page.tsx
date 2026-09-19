"use client";

import { use, useEffect, useState } from "react";
import { FileText, Search, Sparkles, Layers, Calendar, Shield, Bookmark } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ContractTabs } from "@/components/ui/Badges";
import { fetchContractById, fetchClauses } from "@/lib/api";
import type { Contract, Clause } from "@/lib/types";

export default function SourceViewerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [contract, setContract] = useState<Contract | null>(null);
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [cData, clData] = await Promise.all([
          fetchContractById(id),
          fetchClauses(id).catch(() => []),
        ]);
        setContract(cData);
        setClauses(clData);
      } catch (err) {
        console.error("Error loading source viewer:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  function highlightLine(line: string) {
    if (!line.trim()) return <br />;

    // Check if line is a Page Marker
    if (line.match(/^---\s*PAGE\s+\d+\s*---/i)) {
      return (
        <div className="my-4 py-2 px-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-300" />
          {line}
        </div>
      );
    }

    // Check if section header
    const isSectionHeader = line.match(/^(?:Section\s+\d+|[\d\.]+\s+[A-Z\s]{3,})/i);

    // Date pattern matching all common formats
    const datePattern = /(\b(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}\b|\b\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+\d{4}\b|\b\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\b|\b\d{1,2}[-/.]\d{1,2}[-/.]\d{4}\b)/gi;

    const parts = line.split(datePattern);
    const elements = parts.map((part, i) => {
      if (part.match(datePattern)) {
        return (
          <mark
            key={i}
            className="bg-amber-300 text-amber-950 font-bold font-mono px-1.5 py-0.5 rounded shadow-sm border border-amber-400 mx-0.5 inline-flex items-center gap-1 text-xs"
            title="Extracted Contract Date"
          >
            <Calendar className="w-3 h-3 text-amber-900 inline" />
            {part}
          </mark>
        );
      }
      return part;
    });

    if (isSectionHeader) {
      return (
        <div className="my-3 p-3 bg-blue-50/80 border-l-4 border-blue-600 rounded-r-xl font-bold text-blue-950 text-sm flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{elements}</span>
        </div>
      );
    }

    return <div className="py-0.5 leading-relaxed text-slate-800 text-xs font-mono">{elements}</div>;
  }

  return (
    <div>
      <PageHeader
        title={contract ? `${contract.title} — Document Source Viewer` : "Document Source Viewer"}
        subtitle="Full extracted text layer with highlighted dates, deadlines, and clauses"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: contract?.title || "Contract", href: `/contracts/${id}` },
          { label: "Source Viewer" },
        ]}
      />
      <ContractTabs contractId={id} active="source" />

      <div className="p-8 space-y-6">
        {/* Highlight Controls Legend */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search contract text..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                Active Highlights:
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-300 text-amber-950 font-bold border border-amber-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Dates & Deadlines
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-blue-700 text-white font-bold flex items-center gap-1">
                <Bookmark className="w-3 h-3" /> Clauses & Sections
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-300 font-semibold flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>PyMuPDF Text Layer · {contract?.page_count || 1} Pages</span>
          </div>
        </div>

        {loading ? (
          <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-sm text-slate-400">
            Loading document text from database...
          </div>
        ) : !contract?.raw_text ? (
          <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-sm text-slate-400">
            No text layer found for this contract.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-100 border-b border-slate-200 px-6 py-3 text-xs font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                {contract.filename}
              </span>
              <span className="text-slate-500 font-mono">Raw Document View</span>
            </div>

            <div className="p-8 max-h-[750px] overflow-y-auto bg-slate-50/50">
              {contract.raw_text.split("\n").map((line, idx) => (
                <div key={idx}>{highlightLine(line)}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
