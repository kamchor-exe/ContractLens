"use client";

import { use, useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ContractTabs } from "@/components/ui/Badges";
import { fetchContractById } from "@/lib/api";
import type { Contract } from "@/lib/types";

export default function SourceViewerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [contract, setContract] = useState<Contract & { raw_text?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchContractById(id);
        setContract(data);
      } catch (err) {
        console.error("Error loading source viewer:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  return (
    <div>
      <PageHeader
        title={contract ? `${contract.title} — Source Viewer` : "Source Viewer"}
        subtitle="Extracted page-preserving contract document text"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: contract?.title || "Contract", href: `/contracts/${id}` },
          { label: "Source Viewer" },
        ]}
      />
      <ContractTabs contractId={id} active="source" />

      <div className="p-8 space-y-4">
        {loading ? (
          <div className="p-8 bg-white rounded-xl border border-slate-200 text-center text-sm text-slate-400">
            Loading contract text from backend database...
          </div>
        ) : !contract?.raw_text ? (
          <div className="p-8 bg-white rounded-xl border border-slate-200 text-center text-sm text-slate-400">
            No extracted raw text found for this contract
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 pb-3 border-b border-slate-100">
              <FileText className="w-4 h-4 text-blue-600" />
              Document Text Layer ({contract.page_count} pages)
            </div>
            <pre className="whitespace-pre-wrap font-mono text-xs text-slate-700 leading-relaxed bg-slate-50/80 p-5 rounded-xl border border-slate-100 max-h-[700px] overflow-y-auto">
              {contract.raw_text}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
