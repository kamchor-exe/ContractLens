"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Users,
  CheckSquare,
  Activity,
  MessageSquare,
  Clock,
  Trash2,
  Calendar,
  ShieldCheck,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ContractTabs, ContractStatusBadge, ClauseTypeBadge } from "@/components/ui/Badges";
import { fetchContractById, fetchClauses, deleteContract } from "@/lib/api";
import type { Contract, Clause } from "@/lib/types";

function DataRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="py-3 border-b border-slate-100 last:border-0 grid grid-cols-5 gap-4 items-center">
      <dt className="col-span-2 text-xs font-bold uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="col-span-3 text-sm text-slate-900 font-semibold bg-slate-50 p-2 rounded-lg border border-slate-100">
        {value}
      </dd>
    </div>
  );
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ContractOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [contract, setContract] = useState<Contract | null>(null);
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [contractData, clausesData] = await Promise.all([
          fetchContractById(id),
          fetchClauses(id).catch(() => []),
        ]);
        setContract(contractData);
        setClauses(clausesData);
      } catch (err: any) {
        setError("Could not load contract details.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  async function handleDelete() {
    if (!contract) return;
    if (!confirm(`Are you sure you want to delete contract "${contract.title}"?`)) return;

    try {
      await deleteContract(contract.id);
      router.push("/");
    } catch (e) {
      alert("Failed to delete contract. Please try again.");
    }
  }

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 text-sm">
        Loading contract details from database...
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="p-12 text-center text-red-500 text-sm">
        {error || "Contract not found"}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={contract.title}
        subtitle={contract.filename}
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: contract.title }]}
        actions={
          <div className="flex items-center gap-3">
            <ContractStatusBadge status={contract.status} />
            <Link
              href={`/contracts/${contract.id}/chat`}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md"
            >
              <MessageSquare className="w-4 h-4" />
              Ask AI Assistant
            </Link>
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-sm"
              title="Delete Contract"
            >
              <Trash2 className="w-4 h-4" />
              Delete Contract
            </button>
          </div>
        }
      />
      <ContractTabs contractId={contract.id} active="overview" />

      <div className="p-8 space-y-6">
        {/* Top Summary Banner */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
              Document Title
            </span>
            <h1 className="text-xl font-bold">{contract.title}</h1>
            <p className="text-xs text-slate-300">
              {contract.filename} · {contract.page_count} Pages · Status: {contract.status}
            </p>
          </div>

          <div className="flex items-center gap-4 border-l border-slate-700 pl-6">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Effective Start
              </span>
              <span className="text-sm font-bold text-white">
                {formatDate(contract.effective_date)}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Expiry Date
              </span>
              <span className="text-sm font-bold text-amber-300">
                {formatDate(contract.expiry_date)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ─ Contract Data Panel (NO button styling) ─ */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Extracted Contract Terms & Conditions
            </h2>
            <dl>
              <DataRow
                label="Effective Date"
                value={formatDate(contract.effective_date)}
              />
              <DataRow
                label="Expiry Date"
                value={formatDate(contract.expiry_date)}
              />
              <DataRow
                label="Renewal Terms"
                value={contract.renewal_terms || "Not specified"}
              />
              <DataRow
                label="Payment Terms"
                value={contract.payment_terms || "Not specified"}
              />
              <DataRow
                label="Termination Notice"
                value={contract.termination_conditions || "Not specified"}
              />
            </dl>
          </section>

          {/* ─ Contract Parties Panel ─ */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Identified Contract Parties ({contract.parties?.length || 0})
            </h2>
            {!contract.parties || contract.parties.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                No contract parties identified
              </p>
            ) : (
              <div className="space-y-3">
                {contract.parties.map((party) => (
                  <div
                    key={party.id}
                    className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {party.role[0] || "P"}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {party.name}
                      </h3>
                      <p className="text-xs text-blue-700 font-semibold mt-0.5">
                        Role: {party.role}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1 font-mono">
                        Evidence: Page {party.source_page} · {party.source_section}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ─ Classified Clauses Panel ─ */}
        {clauses.length > 0 && (
          <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              Key Classified Clauses ({clauses.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clauses.map((clause) => (
                <div
                  key={clause.id}
                  className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      {clause.title}
                    </span>
                    <ClauseTypeBadge type={clause.clause_type} />
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-sans">
                    {clause.content}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-200/60">
                    {clause.source_section} · Page {clause.source_page}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
