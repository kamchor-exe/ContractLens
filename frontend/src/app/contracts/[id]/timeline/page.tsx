"use client";

import { use } from "react";
import Link from "next/link";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RotateCcw,
  CreditCard,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ContractTabs, DeadlineTypeBadge } from "@/components/ui/Badges";
import { MOCK_CONTRACTS, MOCK_DEADLINES } from "@/lib/mock-data";
import type { DeadlineType } from "@/lib/types";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function daysUntil(dateStr: string) {
  return Math.round(
    (new Date(dateStr).getTime() - Date.now()) / 86400000
  );
}

const deadlineTypeIcon: Record<DeadlineType, React.ReactNode> = {
  EXPIRY: <AlertTriangle className="w-4 h-4 text-red-500" />,
  RENEWAL_NOTICE: <RotateCcw className="w-4 h-4 text-blue-500" />,
  PAYMENT: <CreditCard className="w-4 h-4 text-green-500" />,
  OBLIGATION: <CheckCircle2 className="w-4 h-4 text-amber-500" />,
  OTHER: <Clock className="w-4 h-4 text-slate-400" />,
};



export default function TimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const contract = MOCK_CONTRACTS.find((c) => c.id === id) ?? MOCK_CONTRACTS[0];
  const deadlines = MOCK_DEADLINES.filter((d) => d.contract_id === id).sort(
    (a, b) =>
      new Date(a.deadline_date).getTime() - new Date(b.deadline_date).getTime()
  );

  const effectiveDate = contract.effective_date;
  const expiryDate = contract.expiry_date;

  // Compute progress percentage
  const totalMs =
    new Date(expiryDate).getTime() - new Date(effectiveDate).getTime();
  const elapsedMs = Date.now() - new Date(effectiveDate).getTime();
  const progress = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));

  return (
    <div>
      <PageHeader
        title="Timeline"
        subtitle={contract.title}
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: contract.title, href: `/contracts/${contract.id}` },
          { label: "Timeline" },
        ]}
      />
      <ContractTabs contractId={contract.id} active="timeline" />

      <div className="p-8 space-y-8">
        {/* ─ Contract lifecycle bar ─ */}
        <section className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-5">
            Contract Lifecycle
          </h2>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Effective: {formatDate(effectiveDate)}
            </span>
            <span className="flex items-center gap-1">
              Expiry: {formatDate(expiryDate)}
              <Calendar className="w-3.5 h-3.5" />
            </span>
          </div>
          {/* Progress bar */}
          <div className="relative h-5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
            {/* Today marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500"
              style={{ left: `${progress}%` }}
            >
              <span className="absolute -top-5 left-1 text-xs text-red-500 font-medium whitespace-nowrap">
                Today
              </span>
            </div>
            {/* Deadline markers */}
            {deadlines.map((d) => {
              const pos = Math.min(
                100,
                Math.max(
                  0,
                  ((new Date(d.deadline_date).getTime() -
                    new Date(effectiveDate).getTime()) /
                    totalMs) *
                    100
                )
              );
              return (
                <div
                  key={d.id}
                  className="absolute top-0 bottom-0 w-0.5 bg-amber-400 opacity-70"
                  style={{ left: `${pos}%` }}
                  title={d.label}
                />
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-1 rounded bg-blue-500" />
              Elapsed ({Math.round(progress)}%)
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-0.5 h-3 bg-red-500" />
              Today
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-0.5 h-3 bg-amber-400" />
              Deadline
            </span>
          </div>
        </section>

        {/* ─ Vertical timeline of events ─ */}
        <section>
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
            Key Events
          </h2>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-200" />

            <div className="space-y-1">
              {/* Contract start */}
              <TimelineEvent
                date={effectiveDate}
                label="Contract Effective"
                type="start"
                contractId={id}
              />

              {/* Deadlines */}
              {deadlines.map((d) => {
                const days = daysUntil(d.deadline_date);
                return (
                  <TimelineEvent
                    key={d.id}
                    date={d.deadline_date}
                    label={d.label}
                    type={d.deadline_type}
                    contractId={id}
                    daysUntil={days}
                    obligationId={d.obligation_id ?? undefined}
                  />
                );
              })}

              {/* Contract end */}
              <TimelineEvent
                date={expiryDate}
                label="Contract Expires"
                type="end"
                contractId={id}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function TimelineEvent({
  date,
  label,
  type,
  contractId,
  daysUntil: days,
  obligationId,
}: {
  date: string;
  label: string;
  type: DeadlineType | "start" | "end";
  contractId: string;
  daysUntil?: number;
  obligationId?: string;
}) {
  const isPast = new Date(date) < new Date();
  const isUrgent = days !== undefined && days >= 0 && days <= 14;
  const isOverdue = days !== undefined && days < 0;

  return (
    <div className="relative flex items-start gap-4 pl-11 py-3">
      {/* Dot */}
      <div
        className={`absolute left-3.5 top-4 w-3 h-3 rounded-full border-2 ${
          type === "start"
            ? "bg-green-500 border-green-500"
            : type === "end"
            ? "bg-red-400 border-red-400"
            : isPast
            ? "bg-slate-300 border-slate-300"
            : isOverdue
            ? "bg-red-500 border-red-500"
            : isUrgent
            ? "bg-amber-400 border-amber-400"
            : "bg-blue-400 border-blue-400"
        }`}
      />

      <div className="flex-1 bg-white rounded-xl border border-slate-200 px-4 py-3 hover:border-blue-200 transition-colors">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p
              className={`text-sm font-medium ${
                isPast && type !== "end" ? "text-slate-400" : "text-slate-800"
              }`}
            >
              {label}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {new Date(date).toLocaleDateString("en-GB", {
                weekday: "short",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {type !== "start" && type !== "end" && (
              <DeadlineTypeBadge type={type as DeadlineType} />
            )}
            {days !== undefined && (
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded ${
                  isOverdue
                    ? "bg-red-100 text-red-700"
                    : isUrgent
                    ? "bg-amber-100 text-amber-700"
                    : isPast
                    ? "bg-slate-100 text-slate-400"
                    : "bg-blue-50 text-blue-600"
                }`}
              >
                {isOverdue
                  ? `${Math.abs(days)}d overdue`
                  : days === 0
                  ? "Today"
                  : `${days}d`}
              </span>
            )}
            {obligationId && (
              <Link
                href={`/contracts/${contractId}/obligations`}
                className="text-xs text-blue-600 hover:underline"
              >
                <BookOpen className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
