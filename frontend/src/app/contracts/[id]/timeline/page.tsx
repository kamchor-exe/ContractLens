"use client";

import { use, useEffect, useState } from "react";
import { Clock, Calendar } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ContractTabs, DeadlineTypeBadge } from "@/components/ui/Badges";
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

  function formatDate(dateStr: string) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function daysUntilLabel(dateStr: string) {
    const days = Math.round(
      (new Date(dateStr).getTime() - Date.now()) / 86400000
    );
    if (days < 0) return `${Math.abs(days)} days ago`;
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    return `In ${days} days`;
  }

  return (
    <div>
      <PageHeader
        title={contract ? `${contract.title} — Timeline` : "Contract Timeline"}
        subtitle="Chronological contract lifecycle deadlines and notices"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: contract?.title || "Contract", href: `/contracts/${id}` },
          { label: "Timeline" },
        ]}
      />
      <ContractTabs contractId={id} active="timeline" />

      <div className="p-8 space-y-6">
        {loading ? (
          <div className="p-8 bg-white rounded-xl border border-slate-200 text-center text-sm text-slate-400">
            Loading timeline deadlines from database...
          </div>
        ) : deadlines.length === 0 ? (
          <div className="p-8 bg-white rounded-xl border border-slate-200 text-center text-sm text-slate-400">
            No deadlines recorded for this contract
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-6">
            {deadlines.map((deadline) => (
              <div key={deadline.id} className="relative group">
                {/* Timeline dot */}
                <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-white border-2 border-blue-600 shadow-sm group-hover:scale-125 transition-transform" />

                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2 hover:border-blue-300 transition-all">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <DeadlineTypeBadge type={deadline.deadline_type} />
                      <span className="text-xs font-medium text-slate-500">
                        {daysUntilLabel(deadline.deadline_date)}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {formatDate(deadline.deadline_date)}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-slate-900">
                    {deadline.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
