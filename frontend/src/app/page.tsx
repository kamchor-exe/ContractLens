"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Clock,
  Upload,
  Bell,
  CheckCircle2,
  X,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ContractStatusBadge, DeadlineTypeBadge } from "@/components/ui/Badges";
import {
  fetchContracts,
  uploadContract,
  deleteContract,
  fetchGlobalDeadlines,
  fetchReminders,
  acknowledgeReminder as apiAcknowledgeReminder,
} from "@/lib/api";
import type { Contract, Deadline, Reminder } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  const [uploadDragOver, setUploadDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatusMsg, setUploadStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [contractsData, deadlinesData, remindersData] = await Promise.all([
          fetchContracts().catch(() => []),
          fetchGlobalDeadlines(365).catch(() => []),
          fetchReminders().catch(() => []),
        ]);
        setContracts(contractsData);
        setDeadlines(deadlinesData);
        setReminders(remindersData);
      } catch (e) {
        console.error("Dashboard data load error:", e);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const pendingReminders = reminders.filter((r) => !r.acknowledged);

  async function handleAcknowledgeReminder(id: string) {
    try {
      await apiAcknowledgeReminder(id);
      setReminders((prev) =>
        prev.map((r) => (r.id === id ? { ...r, acknowledged: true } : r))
      );
    } catch (e) {
      console.error("Failed to acknowledge reminder:", e);
    }
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  async function handleFileUpload(file: File) {
    if (!file || !file.name.toLowerCase().endsWith(".pdf")) {
      setUploadStatusMsg("Please select a valid PDF file.");
      return;
    }
    setUploading(true);
    setUploadStatusMsg("Uploading contract & extracting AI text layer...");

    try {
      const newContract = await uploadContract(file);
      setContracts((prev) => [newContract, ...prev]);

      if (newContract.status === "UNSUPPORTED") {
        setUploadStatusMsg("Uploaded PDF has no text layer (scanned). Flagged as UNSUPPORTED.");
      } else {
        setUploadStatusMsg(`Contract "${newContract.title}" processed successfully! Redirecting...`);
        setTimeout(() => {
          router.push(`/contracts/${newContract.id}`);
        }, 1000);
      }
    } catch (e: any) {
      setUploadStatusMsg(e?.message || "Upload failed. Check backend server.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteContract(e: React.MouseEvent, id: string, title: string) {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`Are you sure you want to delete contract "${title}"?`)) return;

    try {
      await deleteContract(id);
      setContracts((prev) => prev.filter((c) => c.id !== id));
      setUploadStatusMsg(`Deleted contract "${title}".`);
    } catch (err) {
      alert("Failed to delete contract. Please try again.");
    }
  }

  return (
    <div className="space-y-8 p-8 max-w-6xl mx-auto">
      {/* ─ Top Hero Banner ─ */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-8 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Grounded Contract Intelligence
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Contract Intelligence Platform
          </h1>
          <p className="text-xs text-slate-300 leading-relaxed max-w-lg">
            Upload business PDFs to extract metadata, actionable obligations, payment dates, and ask grounded Q&A with evidence citations.
          </p>
        </div>

        {/* Primary Action Button */}
        <label className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-sm rounded-2xl shadow-lg cursor-pointer transition-all transform hover:-translate-y-0.5 shrink-0">
          <Upload className="w-4 h-4" />
          {uploading ? "Processing PDF..." : "Upload Contract PDF"}
          <input
            type="file"
            accept=".pdf"
            disabled={uploading}
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
            }}
          />
        </label>
      </div>

      {/* ─ Stat Overview Row ─ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Contracts</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{contracts.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Upcoming Deadlines</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{deadlines.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Reminders</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{pendingReminders.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ─ Upload Notification Alert ─ */}
      {uploadStatusMsg && (
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-sm text-blue-900 font-semibold flex items-center justify-between shadow-sm">
          <span>{uploadStatusMsg}</span>
          <button onClick={() => setUploadStatusMsg(null)} className="text-blue-500 hover:text-blue-700 font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {/* ─ Drag & Drop Upload Zone ─ */}
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
          className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all ${
            uploadDragOver
              ? "border-blue-500 bg-blue-50/50 shadow-md"
              : "border-slate-300 bg-white hover:border-blue-400 hover:shadow-sm"
          }`}
        >
          <Upload className="w-10 h-10 text-blue-600 mx-auto mb-3 opacity-80" />
          <p className="text-sm font-bold text-slate-800">
            {uploading ? "Extracting & analyzing contract..." : "Drag & drop your PDF contract here"}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            or{" "}
            <label className="text-blue-600 font-bold cursor-pointer hover:underline">
              browse files
              <input
                type="file"
                accept=".pdf"
                disabled={uploading}
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                }}
              />
            </label>{" "}
            from your device
          </p>
        </div>
      </section>

      {/* ─ Contracts Table ─ */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Uploaded Contracts ({contracts.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading contracts...</div>
        ) : contracts.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No contracts uploaded yet. Upload a PDF above to get started!
          </div>
        ) : (
          <div className="space-y-3">
            {contracts.map((c) => (
              <div
                key={c.id}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <Link href={`/contracts/${c.id}`} className="text-sm font-bold text-slate-900 hover:text-blue-600 truncate block">
                      {c.title}
                    </Link>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {c.filename} · {c.page_count} pages
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <ContractStatusBadge status={c.status} />
                  <Link
                    href={`/contracts/${c.id}`}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={(e) => handleDeleteContract(e, c.id, c.title)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete contract"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
