"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, BookOpen } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ContractTabs, ObligationStatusBadge } from "@/components/ui/Badges";
import { MOCK_CONTRACTS, MOCK_OBLIGATIONS } from "@/lib/mock-data";
import type { Obligation, ObligationStatus } from "@/lib/types";

type SortField = "responsible_party" | "due_date" | "status";

function formatDate(dateStr: string | null) {
  if (!dateStr) return "Ongoing";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ObligationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const contract = MOCK_CONTRACTS.find((c) => c.id === id) ?? MOCK_CONTRACTS[0];
  const obligations = MOCK_OBLIGATIONS.filter((o) => o.contract_id === id);

  const [sortField, setSortField] = useState<SortField>("due_date");
  const [sortAsc, setSortAsc] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ObligationStatus | "ALL">(
    "ALL"
  );
  const [statuses, setStatuses] = useState<Record<string, ObligationStatus>>(
    Object.fromEntries(obligations.map((o) => [o.id, o.status]))
  );

  function toggleSort(field: SortField) {
    if (sortField === field) setSortAsc((v) => !v);
    else {
      setSortField(field);
      setSortAsc(true);
    }
  }

  function cycleStatus(id: string) {
    const order: ObligationStatus[] = ["PENDING", "COMPLETED", "OVERDUE"];
    setStatuses((prev) => {
      const cur = prev[id];
      const next = order[(order.indexOf(cur) + 1) % order.length];
      return { ...prev, [id]: next };
    });
  }

  const filtered = obligations.filter(
    (o) => statusFilter === "ALL" || statuses[o.id] === statusFilter
  );

  const sorted = [...filtered].sort((a, b) => {
    let av: string, bv: string;
    if (sortField === "due_date") {
      av = a.due_date ?? "9999-12-31";
      bv = b.due_date ?? "9999-12-31";
    } else if (sortField === "responsible_party") {
      av = a.responsible_party;
      bv = b.responsible_party;
    } else {
      av = statuses[a.id];
      bv = statuses[b.id];
    }
    return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const SortIcon = ({ field }: { field: SortField }) => (
    <ArrowUpDown
      className={`w-3 h-3 ml-1 inline-block ${
        sortField === field ? "text-blue-500" : "text-slate-300"
      }`}
    />
  );

  return (
    <div>
      <PageHeader
        title="Obligations"
        subtitle={contract.title}
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: contract.title, href: `/contracts/${contract.id}` },
          { label: "Obligations" },
        ]}
      />
      <ContractTabs contractId={contract.id} active="obligations" />

      <div className="p-8 space-y-4">
        {/* ─ Filters ─ */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-slate-500">Filter:</span>
          {(["ALL", "PENDING", "OVERDUE", "COMPLETED"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                statusFilter === s
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
              }`}
            >
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
          <span className="ml-auto text-xs text-slate-400">
            {sorted.length} obligation{sorted.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* ─ Table ─ */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th
                  className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-slate-800"
                  onClick={() => toggleSort("responsible_party")}
                >
                  Who
                  <SortIcon field="responsible_party" />
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Action
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-slate-800"
                  onClick={() => toggleSort("due_date")}
                >
                  When
                  <SortIcon field="due_date" />
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-slate-800"
                  onClick={() => toggleSort("status")}
                >
                  Status
                  <SortIcon field="status" />
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Source
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-slate-400"
                  >
                    No obligations match the filter.
                  </td>
                </tr>
              ) : (
                sorted.map((ob) => (
                  <tr key={ob.id} className="hover:bg-slate-50 group">
                    <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                      {ob.responsible_party}
                    </td>
                    <td className="px-4 py-3 text-slate-700 max-w-xs">
                      <p className="line-clamp-2">{ob.action}</p>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                        {ob.due_rule}
                      </p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`text-sm ${
                          ob.due_date &&
                          new Date(ob.due_date) < new Date() &&
                          statuses[ob.id] !== "COMPLETED"
                            ? "text-red-600 font-semibold"
                            : "text-slate-700"
                        }`}
                      >
                        {formatDate(ob.due_date)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => cycleStatus(ob.id)}
                        className="hover:opacity-80 transition-opacity"
                        title="Click to cycle status"
                      >
                        <ObligationStatusBadge status={statuses[ob.id]} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/contracts/${contract.id}/source?section=${encodeURIComponent(ob.source_section)}&page=${ob.source_page}`}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:underline whitespace-nowrap"
                      >
                        <BookOpen className="w-3 h-3" />
                        p.{ob.source_page}
                      </Link>
                      <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[150px]">
                        {ob.source_section}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Obligation count summary */}
        <div className="flex gap-6 text-sm text-slate-500">
          {(["PENDING", "OVERDUE", "COMPLETED"] as ObligationStatus[]).map(
            (s) => {
              const count = Object.values(statuses).filter(
                (v) => v === s
              ).length;
              return (
                <span key={s}>
                  <span className="font-semibold text-slate-700">{count}</span>{" "}
                  {s.toLowerCase()}
                </span>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
}
