import Link from "next/link";
import { ClauseType, ObligationStatus, DeadlineType, ContractStatus } from "@/lib/types";

// ─── Status Badge ──────────────────────────────────────────────────────────────

const obligationStatusConfig: Record<
  ObligationStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: "Pending",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  OVERDUE: {
    label: "Overdue",
    className: "bg-red-100 text-red-800 border-red-200",
  },
};

export function ObligationStatusBadge({ status }: { status: ObligationStatus }) {
  const { label, className } = obligationStatusConfig[status];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}
    >
      {label}
    </span>
  );
}

// ─── Contract Status Badge ─────────────────────────────────────────────────────

const contractStatusConfig: Record<
  ContractStatus,
  { label: string; className: string }
> = {
  PENDING: { label: "Pending", className: "bg-slate-100 text-slate-700 border-slate-200" },
  PROCESSING: { label: "Processing", className: "bg-blue-100 text-blue-700 border-blue-200" },
  READY: { label: "Ready", className: "bg-green-100 text-green-800 border-green-200" },
  FAILED: { label: "Failed", className: "bg-red-100 text-red-800 border-red-200" },
  UNSUPPORTED: { label: "Unsupported", className: "bg-orange-100 text-orange-800 border-orange-200" },
};

export function ContractStatusBadge({ status }: { status: ContractStatus }) {
  const { label, className } = contractStatusConfig[status];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}
    >
      {status === "PROCESSING" && (
        <span className="mr-1.5 inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
      )}
      {label}
    </span>
  );
}

// ─── Clause Type Badge ─────────────────────────────────────────────────────────

const clauseTypeColors: Record<ClauseType, string> = {
  PAYMENT: "bg-green-100 text-green-800",
  RENEWAL: "bg-blue-100 text-blue-800",
  TERMINATION: "bg-red-100 text-red-800",
  CONFIDENTIALITY: "bg-purple-100 text-purple-800",
  INDEMNITY: "bg-orange-100 text-orange-800",
  FORCE_MAJEURE: "bg-yellow-100 text-yellow-800",
  DATA_PROTECTION: "bg-teal-100 text-teal-800",
  LIABILITY: "bg-rose-100 text-rose-800",
  INTELLECTUAL_PROPERTY: "bg-indigo-100 text-indigo-800",
  OTHER: "bg-slate-100 text-slate-700",
};

export function ClauseTypeBadge({ type }: { type: ClauseType }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${clauseTypeColors[type]}`}
    >
      {type.replace(/_/g, " ")}
    </span>
  );
}

// ─── Deadline Type Badge ───────────────────────────────────────────────────────

const deadlineTypeColors: Record<DeadlineType, string> = {
  EXPIRY: "bg-red-100 text-red-800",
  RENEWAL_NOTICE: "bg-blue-100 text-blue-800",
  PAYMENT: "bg-green-100 text-green-800",
  OBLIGATION: "bg-amber-100 text-amber-800",
  OTHER: "bg-slate-100 text-slate-700",
};

export function DeadlineTypeBadge({ type }: { type: DeadlineType }) {
  const label = type.replace(/_/g, " ");
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${deadlineTypeColors[type]}`}
    >
      {label}
    </span>
  );
}

// ─── Contract Nav Tabs ─────────────────────────────────────────────────────────

interface ContractTabsProps {
  contractId: string;
  active: "overview" | "obligations" | "timeline" | "chat" | "source";
}

const tabs = [
  { key: "overview", label: "Overview", href: "" },
  { key: "obligations", label: "Obligations", href: "/obligations" },
  { key: "timeline", label: "Timeline", href: "/timeline" },
  { key: "chat", label: "AI Assistant", href: "/chat" },
  { key: "source", label: "Source Viewer", href: "/source" },
] as const;

export function ContractTabs({ contractId, active }: ContractTabsProps) {
  return (
    <div className="border-b border-slate-200 bg-white px-8">
      <nav className="flex gap-0 -mb-px">
        {tabs.map(({ key, label, href }) => {
          const isActive = key === active;
          return (
            <Link
              key={key}
              href={`/contracts/${contractId}${href}`}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: "blue" | "green" | "amber" | "red" | "slate";
}

const statColors = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-green-50 text-green-600",
  amber: "bg-amber-50 text-amber-600",
  red: "bg-red-50 text-red-600",
  slate: "bg-slate-100 text-slate-600",
};

export function StatCard({ label, value, icon, color = "blue" }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
      <div className={`flex items-center justify-center w-11 h-11 rounded-xl ${statColors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
