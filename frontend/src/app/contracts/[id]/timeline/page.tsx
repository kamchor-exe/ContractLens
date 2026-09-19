"use client";

import { use, useEffect, useState } from "react";
import { Copy, Check, Calendar } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ContractTabs } from "@/components/ui/Badges";
import { fetchContractById, fetchDeadlines } from "@/lib/api";
import type { Contract, Deadline } from "@/lib/types";

export default function TimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [contract, setContract] = useState<Contract | null>(null);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [cData, dData] = await Promise.all([
          fetchContractById(id),
          fetchDeadlines(id).catch(() => []),
        ]);
        setContract(cData);
        setDeadlines(dData);
      } catch (err) {
        console.error("Error loading timeline deadlines:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  function formatDateFormatted(dateStr: string) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString("en-US", { month: "short" });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  }

  function handleCopyTimeline() {
    const textToCopy = deadlines
      .map((d) => `${formatDateFormatted(d.deadline_date)}\t${d.label}`)
      .join("\n");
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <PageHeader
        title={contract ? `${contract.title} — Timeline` : "Contract Timeline"}
        subtitle="Chronological sequence of key contract dates, renewal warnings, and notice deadlines"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: contract?.title || "Contract", href: `/contracts/${id}` },
          { label: "Timeline" },
        ]}
      />
      <ContractTabs contractId={id} active="timeline" />

      <div className="p-8 max-w-4xl mx-auto space-y-6">
        {/* Title Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2 text-white">
            <span className="text-2xl">🗓️</span> Timeline
          </h1>
        </div>

        {loading ? (
          <div className="p-12 bg-[#18181b] rounded-3xl border border-slate-800 text-center text-sm text-slate-400">
            Extracting contract timeline events...
          </div>
        ) : deadlines.length === 0 ? (
          <div className="p-12 bg-[#18181b] rounded-3xl border border-slate-800 text-center text-sm text-slate-400">
            No deadline events detected in this contract.
          </div>
        ) : (
          /* Exact Dark Timeline Card matching the reference image */
          <div className="relative bg-[#18181b] rounded-3xl p-8 border border-slate-800 shadow-2xl space-y-6">
            {/* Top Right Copy Button */}
            <button
              onClick={handleCopyTimeline}
              className="absolute top-6 right-6 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Copy timeline to clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            <div className="space-y-4 pt-2">
              {deadlines.map((deadline, idx) => (
                <div key={deadline.id} className="space-y-3">
                  <div className="grid grid-cols-12 items-baseline gap-4 text-sm font-mono">
                    <span className="col-span-4 text-slate-300 font-medium tracking-wide">
                      {formatDateFormatted(deadline.deadline_date)}
                    </span>
                    <span className="col-span-8 text-white font-sans font-medium leading-relaxed">
                      {deadline.label}
                    </span>
                  </div>

                  {idx < deadlines.length - 1 && (
                    <div className="text-slate-500 font-mono text-xs pl-8 py-0.5">
                      ↓
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
