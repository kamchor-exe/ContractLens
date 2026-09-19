"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Users,
  CheckSquare,
  Activity,
  MessageSquare,
  Clock,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ContractTabs, ContractStatusBadge, ClauseTypeBadge } from "@/components/ui/Badges";
import { fetchContractById, fetchClauses } from "@/lib/api";
import type { Contract, Clause } from "@/lib/types";

function InfoRow({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="py-3 border-b border-slate-100 last:border-0 grid grid-cols-5 gap-4">
      <dt className="col-span-2 text-sm text-slate-500 font-medium">{label}</dt>
      <dd className="col-span-3 text-sm text-slate-800 font-medium">
        {value}
        {sub && <span className="block text-xs text-slate-400 mt-0.5">{sub}</span>}
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

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        Loading contract details from backend database...
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="p-8 text-center text-red-500">
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
          <div className="flex items-center gap-2">
            <ContractStatusBadge status={contract.status} />
            <Link
              href={`/contracts/${contract.id}/chat`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            >
              <MessageSquare className="w-4 h-4" />
              Ask AI Assistant
            </Link>
          </div>
        }
      />
      <ContractTabs contractId={contract.id} active="overview" />

      <div className="p-8 space-y-6">
        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              icon: FileText,
              label: "Pages",
              value: contract.page_count || "—",
              color: "slate" as const,
            },
            {
              icon: Users,
              label: "Parties",
              value: contract.parties?.length || 0,
              color: "blue" as const,
            },
            {
              icon: Activity,
              label: "Clauses Classified",
              value: clauses.length,
              color: "blue" as const,
            },
            {
              icon: CheckSquare,
              label: "Status",
              value: contract.status,
              color: "amber" as const,
            },
          ].map(({ icon: Icon, label, value, color }) => (
            <div
              key={label}
              className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm"
            >
              <div
                className={`flex items-center justify-center w-9 h-9 rounded-lg ${
                  color === "blue"
                    ? "bg-blue-50 text-blue-600"
                    : color === "amber"
                    ? "bg-amber-50 text-amber-600"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-slate-400">{label}</p>
                <p className="text-base font-bold text-slate-900">{value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ─ Contract Metadata Details ─ */}
          <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
              Extracted Contract Details
            </h2>
            <dl>
              <InfoRow
                label="Effective Date"
                value={formatDate(contract.effective_date)}
              />
              <InfoRow
                label="Expiry Date"
                value={formatDate(contract.expiry_date)}
              />
              <InfoRow
                label="Renewal Terms"
                value={contract.renewal_terms || "Not specified in contract"}
              />
              <InfoRow
                label="Payment Terms"
                value={contract.payment_terms || "Not specified in contract"}
              />
              <InfoRow
                label="Termination Conditions"
                value={contract.termination_conditions || "Not specified in contract"}
              />
            </dl>
          </section>

          {/* ─ Identified Parties ─ */}
          <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
              Contract Parties ({contract.parties?.length || 0})
            </h2>
            {!contract.parties || contract.parties.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">
                No contract parties identified
              </p>
            ) : (
              <div className="space-y-3">
                {contract.parties.map((party) => (
                  <div
                    key={party.id}
                    className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100"
                  >
                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-100 shrink-0">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {party.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">
                        Role: {party.role}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Source: Page {party.source_page} · {party.source_section}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ─ Classified Clauses ─ */}
        {clauses.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Classified Clauses ({clauses.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clauses.map((clause) => (
                <div
                  key={clause.id}
                  className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {clause.title}
                    </p>
                    <ClauseTypeBadge type={clause.clause_type} />
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-4">
                    {clause.content}
                  </p>
                  <p className="text-xs text-slate-400 pt-1">
                    {clause.source_section} · Page {clause.source_page}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Quick Navigation Footer */}
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href={`/contracts/${contract.id}/obligations`}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white text-sm font-medium text-slate-700 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <CheckSquare className="w-4 h-4 text-slate-500" />
            View Obligations
          </Link>
          <Link
            href={`/contracts/${contract.id}/timeline`}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Clock className="w-4 h-4 text-slate-500" />
            View Timeline
          </Link>
          <Link
            href={`/contracts/${contract.id}/source`}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            View Raw Contract Document
          </Link>
        </div>
      </div>
    </div>
  );
}
