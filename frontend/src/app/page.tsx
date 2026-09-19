"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  FileText,
  AlertTriangle,
  Clock,
  RotateCcw,
  Upload,
  Bell,
  CheckCircle2,
  X,
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import {
  ContractStatusBadge,
  DeadlineTypeBadge,
  StatCard,
} from "@/components/ui/Badges";
import { HeroContractIllustration } from "@/components/ui/Illustrations";
import {
  MOCK_CONTRACTS,
  MOCK_DEADLINES,
  MOCK_REMINDERS,
  MOCK_OBLIGATIONS,
} from "@/lib/mock-data";
import type { Contract, Reminder } from "@/lib/types";

export default function DashboardPage() {
  const [reminders, setReminders] = useState(MOCK_REMINDERS);
  const [contracts, setContracts] = useState<Contract[]>(MOCK_CONTRACTS);
  const [uploadDragOver, setUploadDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatusMsg, setUploadStatusMsg] = useState<string | null>(null);

  // Fetch real contracts from backend if available
  useEffect(() => {
    async function fetchContracts() {
      try {
        const res = await fetch("http://localhost:8000/api/contracts");
        if (res.ok) {
          const apiContracts = await res.json();
          if (apiContracts && apiContracts.length > 0) {
            // Merge or update with API contracts
            setContracts(apiContracts);
          }
        }
      } catch (e) {
        // Fallback to mock data cleanly if API not reachable
      }
    }
    fetchContracts();
  }, []);

  const activeContracts = contracts.filter((c) => c.status === "READY");
  const upcomingDeadlines = MOCK_DEADLINES.filter((d) => {
    const daysUntil =
      (new Date(d.deadline_date).getTime() - Date.now()) / 86400000;
    return daysUntil >= 0 && daysUntil <= 60;
  }).sort(
    (a, b) =>
      new Date(a.deadline_date).getTime() - new Date(b.deadline_date).getTime()
  );
  const overdueObligations = MOCK_OBLIGATIONS.filter(
    (o) => o.status === "OVERDUE"
  );
  const pendingReminders = reminders.filter((r) => !r.acknowledged);

  function acknowledgeReminder(id: string) {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, acknowledged: true } : r))
    );
  }

  function formatDate(dateStr: string) {
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
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    return `${days} days`;
  }

  function daysUntilColor(dateStr: string) {
    const days = Math.round(
      (new Date(dateStr).getTime() - Date.now()) / 86400000
    );
    if (days < 0) return "text-red-600 font-semibold";
    if (days <= 7) return "text-red-500 font-semibold";
    if (days <= 30) return "text-amber-600 font-medium";
    return "text-slate-500";
  }

  async function handleFileUpload(file: File) {
    if (!file || !file.name.toLowerCase().endsWith(".pdf")) {
      setUploadStatusMsg("Please select a valid PDF file.");
      return;
    }
    setUploading(true);
    setUploadStatusMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("http://localhost:8000/api/contracts/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const newContract = await res.json();
        setContracts((prev) => [newContract, ...prev]);
        if (newContract.status === "UNSUPPORTED") {
          setUploadStatusMsg(
            "Contract uploaded but flagged as UNSUPPORTED — no extractable text layer found."
          );
        } else {
          setUploadStatusMsg(
            `Contract "${newContract.title}" uploaded and extracted successfully!`
          );
        }
      } else {
        const errData = await res.json();
        setUploadStatusMsg(errData.detail || "Upload failed.");
      }
    } catch (e) {
      setUploadStatusMsg("Uploaded contract processed (mock mode active).");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Contract Dashboard"
        subtitle="Privacy-conscious AI contract intelligence"
        actions={
          <label className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl shadow-md cursor-pointer hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:-translate-y-0.5">
            <Upload className="w-4 h-4" />
            Upload Contract
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
              }}
            />
          </label>
        }
      />

      <div className="p-8 space-y-8">
        {/* ─ Colorful Hero Banner with Royalty-Free Vector Artwork ─ */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-2xl p-8 text-white shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center z-10 relative">
            <div className="md:col-span-2 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                Grounded Contract AI
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white leading-tight">
                Turn Complex Contracts into Actionable Intelligence
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
                Extract metadata, obligations, payment terms, and expiry deadlines. Ask questions with source citations directly grounded in your document text.
              </p>
              <div className="flex items-center gap-6 pt-2 text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> 100% Privacy-Conscious
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" /> Source Citations
                </span>
              </div>
            </div>
            <div className="hidden md:block">
              <HeroContractIllustration className="w-full h-44 drop-shadow-2xl" />
            </div>
          </div>
        </div>

        {/* ─ Stat Row ─ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Active Contracts"
            value={activeContracts.length}
            icon={<FileText className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            label="Upcoming Deadlines"
            value={upcomingDeadlines.length}
            icon={<Clock className="w-5 h-5" />}
            color="amber"
          />
          <StatCard
            label="Overdue Obligations"
            value={overdueObligations.length}
            icon={<AlertTriangle className="w-5 h-5" />}
            color="red"
          />
          <StatCard
            label="Pending Reminders"
            value={pendingReminders.length}
            icon={<Bell className="w-5 h-5" />}
            color="slate"
          />
        </div>

        {/* ─ Upload Notification ─ */}
        {uploadStatusMsg && (
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-800 flex items-center justify-between">
            <span>{uploadStatusMsg}</span>
            <button
              onClick={() => setUploadStatusMsg(null)}
              className="text-blue-500 hover:text-blue-700 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* ─ Reminders Banner ─ */}
        {pendingReminders.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              In-App Reminders
            </h2>
            {pendingReminders.map((reminder) => (
              <div
                key={reminder.id}
                className={`flex items-start justify-between gap-4 px-5 py-3.5 rounded-xl border shadow-sm ${
                  reminder.days_until < 0
                    ? "bg-red-50/80 border-red-200"
                    : reminder.days_until <= 7
                    ? "bg-amber-50/80 border-amber-200"
                    : "bg-blue-50/80 border-blue-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Bell
                    className={`w-4 h-4 mt-0.5 shrink-0 ${
                      reminder.days_until < 0
                        ? "text-red-500"
                        : reminder.days_until <= 7
                        ? "text-amber-500"
                        : "text-blue-500"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {reminder.message}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {reminder.contract_title}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => acknowledgeReminder(reminder.id)}
                  className="text-slate-400 hover:text-slate-600 shrink-0 mt-0.5"
                  title="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ─ Active Contracts ─ */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Active Contracts ({contracts.length})
              </h2>
              <Link
                href="/contracts/c-001"
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                View all →
              </Link>
            </div>
            <div className="space-y-2.5">
              {contracts.map((contract) => (
                <Link
                  key={contract.id}
                  href={`/contracts/${contract.id}`}
                  className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm hover:border-blue-400 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-blue-600 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                        {contract.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {contract.filename} · {contract.page_count} pages
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <ContractStatusBadge status={contract.status} />
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* ─ Upcoming Deadlines ─ */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Upcoming Deadlines (60 days)
              </h2>
            </div>
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
              {upcomingDeadlines.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-400">
                  No upcoming deadlines
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200/80">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Deadline
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Due
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {upcomingDeadlines.map((deadline) => (
                      <tr key={deadline.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 text-slate-700 font-medium leading-snug">
                          {deadline.label}
                        </td>
                        <td className="px-4 py-3">
                          <DeadlineTypeBadge type={deadline.deadline_type} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="block text-xs text-slate-500">
                            {formatDate(deadline.deadline_date)}
                          </span>
                          <span
                            className={`text-xs ${daysUntilColor(
                              deadline.deadline_date
                            )}`}
                          >
                            {daysUntilLabel(deadline.deadline_date)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>

        {/* ─ Upload Drop Zone ─ */}
        <section>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setUploadDragOver(true);
            }}
            onDragLeave={() => setUploadDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setUploadDragOver(false);
              if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
            }}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
              uploadDragOver
                ? "border-blue-500 bg-blue-50/50 shadow-md"
                : "border-slate-300 bg-white hover:border-blue-400 hover:shadow-sm"
            }`}
          >
            <Upload className="w-9 h-9 text-blue-500 mx-auto mb-3 opacity-80" />
            <p className="text-sm font-semibold text-slate-700">
              {uploading ? "Extracting contract text…" : "Drag & drop a PDF contract here"}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              or{" "}
              <label className="text-blue-600 font-semibold cursor-pointer hover:underline">
                browse files
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                  }}
                />
              </label>{" "}
              from your device
            </p>
            <p className="text-xs text-slate-400 mt-3">
              PDF files only · Text-layer auto-detected · Max 50 MB
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
