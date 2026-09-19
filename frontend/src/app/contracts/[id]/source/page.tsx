"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import { BookOpen, FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/PageHeader";
import { ContractTabs } from "@/components/ui/Badges";
import { MOCK_CONTRACTS, MOCK_OBLIGATIONS, MOCK_CLAUSES } from "@/lib/mock-data";

// Mock chunks for source viewer demo
const MOCK_CHUNKS = [
  {
    id: "ch-004",
    source_page: 8,
    source_section: "Section 4.1 — Payment Terms",
    content:
      "4.1 Payment. Licensee shall pay the monthly license fee of five thousand dollars ($5,000) on the first day of each calendar month during the Term. Payments not received within ten (10) days of the due date shall accrue interest at a rate of one and a half percent (1.5%) per month, or the maximum rate permitted by applicable law, whichever is less. All payments shall be made in United States Dollars by wire transfer to the account designated by Licensor in writing.",
  },
  {
    id: "ch-009",
    source_page: 17,
    source_section: "Section 9.2 — Termination for Breach",
    content:
      "9.2 Termination for Material Breach. Either party may terminate this Agreement immediately upon written notice if the other party commits a material breach of this Agreement that remains uncured for a period of fifteen (15) days after the non-breaching party provides written notice of such breach. A material breach shall include, without limitation, failure to pay amounts due under Section 4, unauthorized use of the Platform, or breach of confidentiality obligations under Section 10.",
  },
  {
    id: "ch-015",
    source_page: 15,
    source_section: "Section 8.2 — Automatic Renewal",
    content:
      "8.2 Renewal. Upon the expiration of the Initial Term or any Renewal Term, this Agreement shall automatically renew for successive twelve (12) month Renewal Terms under the same terms and conditions unless either party provides written notice of its intent not to renew no later than thirty (30) days prior to the end of the then-current term. Licensor may adjust pricing for any Renewal Term upon sixty (60) days prior written notice to Licensee.",
  },
  {
    id: "ch-019",
    source_page: 19,
    source_section: "Section 9.4 — Security Audit",
    content:
      "9.4 Security Audit. Licensee shall submit a security audit report prepared by an independent qualified security assessor to Licensor within ten (10) business days following the end of each calendar quarter. Such report shall cover Licensee's security practices as they relate to access and use of the Platform, and shall be treated as Confidential Information of Licensee.",
  },
];

function SourceViewerContent({ contractId }: { contractId: string }) {
  const searchParams = useSearchParams();
  const chunkId = searchParams.get("chunk");
  const pageParam = searchParams.get("page");
  const sectionParam = searchParams.get("section");

  const contract =
    MOCK_CONTRACTS.find((c) => c.id === contractId) ?? MOCK_CONTRACTS[0];

  // Find the requested chunk
  const activeChunk = chunkId
    ? MOCK_CHUNKS.find((c) => c.id === chunkId)
    : sectionParam
    ? MOCK_CHUNKS.find((c) => c.source_section.includes(decodeURIComponent(sectionParam)))
    : null;

  return (
    <div className="p-8 space-y-6">
      {activeChunk ? (
        <>
          {/* Active chunk highlight */}
          <div className="bg-white rounded-xl border border-blue-300 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-blue-50 border-b border-blue-200 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-800">
                {activeChunk.source_section}
              </span>
              <span className="text-xs text-blue-500 ml-auto">
                Page {activeChunk.source_page}
              </span>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {activeChunk.content}
              </p>
            </div>
          </div>

          <Link
            href={`/contracts/${contractId}/chat`}
            className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to AI Assistant
          </Link>
        </>
      ) : (
        <div className="text-center py-12 text-slate-400">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            No source selected. Click a citation in the AI Assistant to view the
            source text here.
          </p>
        </div>
      )}

      {/* All available contract sections */}
      <section>
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
          All Contract Sections
        </h2>
        <div className="space-y-2">
          {MOCK_CHUNKS.map((chunk) => (
            <Link
              key={chunk.id}
              href={`/contracts/${contractId}/source?chunk=${chunk.id}&page=${chunk.source_page}&section=${encodeURIComponent(chunk.source_section)}`}
              className={`block bg-white rounded-xl border p-4 hover:border-blue-300 transition-colors ${
                chunk.id === activeChunk?.id
                  ? "border-blue-400 ring-1 ring-blue-300"
                  : "border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-800">
                  {chunk.source_section}
                </span>
                <span className="text-xs text-slate-400">p.{chunk.source_page}</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                {chunk.content}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function SourceViewerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const contract = MOCK_CONTRACTS.find((c) => c.id === id) ?? MOCK_CONTRACTS[0];

  return (
    <div>
      <PageHeader
        title="Source Viewer"
        subtitle={contract.title}
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: contract.title, href: `/contracts/${contract.id}` },
          { label: "Source Viewer" },
        ]}
      />
      <ContractTabs contractId={contract.id} active="source" />
      <Suspense
        fallback={
          <div className="p-8 text-sm text-slate-400">Loading source…</div>
        }
      >
        <SourceViewerContent contractId={id} />
      </Suspense>
    </div>
  );
}
