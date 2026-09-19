"use client";

import { use, useEffect, useState } from "react";
import { CheckSquare, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ContractTabs, ObligationStatusBadge } from "@/components/ui/Badges";
import { fetchContractById, fetchObligations, updateObligationStatus } from "@/lib/api";
import type { Contract, Obligation, ObligationStatus } from "@/lib/types";

export default function ObligationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [contract, setContract] = useState<Contract | null>(null);
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  useEffect(() => {
    async function loadData() {
      try {
        const [cData, obData] = await Promise.all([
          fetchContractById(id),
          fetchObligations(id).catch(() => []),
        ]);
        setContract(cData);
        setObligations(obData);
      } catch (err) {
        console.error("Error loading obligations:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  async function handleStatusToggle(obId: string, currentStatus: ObligationStatus) {
    const nextStatus: ObligationStatus =
      currentStatus === "COMPLETED" ? "PENDING" : "COMPLETED";

    // Optimistic UI update
    setObligations((prev) =>
      prev.map((o) => (o.id === obId ? { ...o, status: nextStatus } : o))
    );

    try {
      await updateObligationStatus(obId, nextStatus);
    } catch (e) {
      console.error("Failed to update status on backend:", e);
      // Revert on error
      setObligations((prev) =>
        prev.map((o) => (o.id === obId ? { ...o, status: currentStatus } : o))
      );
    }
  }

  const filteredObligations = obligations.filter((o) => {
    if (filterStatus === "ALL") return true;
    return o.status === filterStatus;
  });

  return (
    <div>
      <PageHeader
        title={contract ? `${contract.title} — Obligations` : "Obligations"}
        subtitle="WHO | ACTION | WHEN | STATUS | SOURCE EVIDENCE"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: contract?.title || "Contract", href: `/contracts/${id}` },
          { label: "Obligations" },
        ]}
      />
      <ContractTabs contractId={id} active="obligations" />

      <div className="p-8 space-y-6">
        {/* Filters bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {["ALL", "PENDING", "COMPLETED", "OVERDUE"].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filterStatus === st
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Showing {filteredObligations.length} of {obligations.length} obligations
          </p>
        </div>

        {loading ? (
          <div className="p-8 bg-white rounded-xl border border-slate-200 text-center text-sm text-slate-400">
            Loading obligations from database...
          </div>
        ) : filteredObligations.length === 0 ? (
          <div className="p-8 bg-white rounded-xl border border-slate-200 text-center text-sm text-slate-400">
            No obligations found matching current filter
          </div>
        ) : (
          <div className="space-y-3">
            {filteredObligations.map((ob) => (
              <div
                key={ob.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3 hover:border-blue-300 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {ob.responsible_party}
                      </span>
                      <ObligationStatusBadge status={ob.status} />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 leading-snug">
                      {ob.action}
                    </h3>
                  </div>

                  {/* Quick status toggle button */}
                  <button
                    onClick={() => handleStatusToggle(ob.id, ob.status)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                      ob.status === "COMPLETED"
                        ? "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    {ob.status === "COMPLETED" ? "Mark Pending" : "Mark Complete"}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div>
                    <span className="font-semibold text-slate-500">Due Rule / Date:</span>{" "}
                    <span className="text-slate-800 font-medium">{ob.due_rule}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500">Contract Source:</span>{" "}
                    <span className="text-slate-800 font-medium">
                      Page {ob.source_page} ({ob.source_section})
                    </span>
                  </div>
                </div>

                {ob.source_text && (
                  <p className="text-xs italic text-slate-500 border-l-2 border-blue-400 pl-3 py-0.5">
                    "{ob.source_text}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
