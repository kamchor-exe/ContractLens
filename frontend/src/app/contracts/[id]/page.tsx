"use client";

import { use } from "react";
import Link from "next/link";
import {
  Calendar,
  Users,
  RotateCcw,
  CreditCard,
  XCircle,
  FileText,
  MessageSquare,
  CheckSquare,
  Clock,
  Activity,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ContractTabs } from "@/components/ui/Badges";
import { ContractStatusBadge, ClauseTypeBadge } from "@/components/ui/Badges";
import { MOCK_CONTRACTS, MOCK_CLAUSES } from "@/lib/mock-data";

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
      <dd className="col-span-3 text-sm text-slate-800">
        {value}
        {sub && <span className="block text-xs text-slate-400 mt-0.5">{sub}</span>}
      </dd>
    </div>
  );
}

function formatDate(dateStr: string) {
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
  const contract = MOCK_CONTRACTS.find((c) => c.id === id) ?? MOCK_CONTRACTS[0];
  const clauses = MOCK_CLAUSES.filter((cl) => cl.contract_id === contract.id);

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
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Ask a Question
            </Link>
          </div>
        }
      />
      <ContractTabs contractId={contract.id} active="overview" />

      <div className="p-8 space-y-6">
        {/* Quick stats */}
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
              value: contract.parties.length || "—",
              color: "blue" as const,
            },
            {
              icon: Activity,
              label: "Clauses",
              value: clauses.length,
              color: "blue" as const,
            },
            {
              icon: CheckSquare,
              label: "Obligations",
              value: 5,
              color: "amber" as const,
            },
          ].map(({ icon: Icon, label, value, color }) => (
            <div
              key={label}
              className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3"
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
                <p className="text-lg font-bold text-slate-900">{value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ─ Contract Details ─ */}
          <section className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
              Contract Details
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
                value={contract.renewal_terms || "Not specified"}
              />
              <InfoRow
                label="Payment Terms"
                value={contract.payment_terms || "Not specified"}
              />
              <InfoRow
                label="Termination"
                value={contract.termination_conditions || "Not specified"}
              />
            </dl>
          </section>

          {/* ─ Parties ─ */}
          <section className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
              Parties
            </h2>
            {contract.parties.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">
                Processing…
              </p>
            ) : (
              <div className="space-y-3">
                {contract.parties.map((party) => (
                  <div
                    key={party.id}
                    className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-100 shrink-0">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {party.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {party.role}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        p.{party.source_page} · {party.source_section}
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
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
              Key Clauses
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {clauses.map((clause) => (
                <div
                  key={clause.id}
                  className="bg-white rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-sm font-semibold text-slate-800">
                      {clause.title}
                    </p>
                    <ClauseTypeBadge type={clause.clause_type} />
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {clause.content}
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    {clause.source_section} · p.{clause.source_page}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/contracts/${contract.id}/obligations`}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <CheckSquare className="w-4 h-4 text-slate-500" />
            View Obligations
          </Link>
          <Link
            href={`/contracts/${contract.id}/timeline`}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Clock className="w-4 h-4 text-slate-500" />
            View Timeline
          </Link>
          <Link
            href={`/contracts/${contract.id}/chat`}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <MessageSquare className="w-4 h-4 text-slate-500" />
            AI Assistant
          </Link>
        </div>
      </div>
    </div>
  );
}
