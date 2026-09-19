"use client";

import { use, useState, useRef, useEffect } from "react";
import { Send, Bot, User, BookOpen, ChevronDown } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ContractTabs } from "@/components/ui/Badges";
import { MOCK_CONTRACTS, MOCK_CHAT_MESSAGES } from "@/lib/mock-data";
import type { ChatMessage, Citation } from "@/lib/types";
import Link from "next/link";

// Simple markdown-like renderer for bold text
function MessageContent({ content }: { content: string }) {
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="font-semibold">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

function CitationCard({
  citation,
  contractId,
}: {
  citation: Citation;
  contractId: string;
}) {
  return (
    <Link
      href={`/contracts/${contractId}/source?chunk=${citation.chunk_id}&page=${citation.source_page}&section=${encodeURIComponent(citation.source_section)}`}
      className="block mt-2 p-3 rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <BookOpen className="w-3.5 h-3.5 text-blue-500 shrink-0" />
        <span className="text-xs font-semibold text-blue-700">
          {citation.source_section}
        </span>
        <span className="text-xs text-slate-400">· p.{citation.source_page}</span>
      </div>
      <p className="text-xs text-slate-600 italic leading-relaxed line-clamp-3">
        "{citation.snippet}"
      </p>
    </Link>
  );
}

const SUGGESTED_QUESTIONS = [
  "What happens if we miss a payment?",
  "When must we send the non-renewal notice?",
  "What is the uptime SLA?",
  "How can either party terminate?",
  "What data protection obligations apply?",
];

export default function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const contract = MOCK_CONTRACTS.find((c) => c.id === id) ?? MOCK_CONTRACTS[0];
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_CHAT_MESSAGES);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSuggestion(q: string) {
    setInput(q);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    setInput("");

    const userMsg: ChatMessage = {
      id: `m-${Date.now()}-u`,
      role: "USER",
      content: trimmed,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    // Mock AI response delay (real response from backend in Phase 9)
    await new Promise((res) => setTimeout(res, 1200));

    const assistantMsg: ChatMessage = {
      id: `m-${Date.now()}-a`,
      role: "ASSISTANT",
      content:
        "I'm currently running on mock data. Once the backend is connected in Phase 9, I'll retrieve relevant contract clauses and answer your question with source citations.",
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setLoading(false);
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="AI Assistant"
        subtitle={contract.title}
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: contract.title, href: `/contracts/${contract.id}` },
          { label: "AI Assistant" },
        ]}
      />
      <ContractTabs contractId={contract.id} active="chat" />

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
        {/* Disclaimer */}
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
          <strong>Not legal advice.</strong> ContractLens provides information
          grounded in your contract text only. Consult a qualified lawyer for
          legal decisions.
        </div>

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${
              msg.role === "USER" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            {/* Avatar */}
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${
                msg.role === "USER"
                  ? "bg-blue-600"
                  : "bg-slate-100 border border-slate-200"
              }`}
            >
              {msg.role === "USER" ? (
                <User className="w-4 h-4 text-white" />
              ) : (
                <Bot className="w-4 h-4 text-slate-600" />
              )}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-2xl ${
                msg.role === "USER" ? "items-end" : "items-start"
              } flex flex-col`}
            >
              <div
                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "USER"
                    ? "bg-blue-600 text-white rounded-tr-sm"
                    : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm"
                }`}
              >
                <MessageContent content={msg.content} />
              </div>
              {/* Citations */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-2 w-full space-y-1">
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    Sources cited
                  </p>
                  {msg.citations.map((c) => (
                    <CitationCard
                      key={c.chunk_id}
                      citation={c}
                      contractId={contract.id}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 border border-slate-200 shrink-0">
              <Bot className="w-4 h-4 text-slate-600" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      <div className="px-8 pb-2">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => handleSuggestion(q)}
              className="shrink-0 px-3 py-1.5 text-xs text-slate-600 bg-white border border-slate-200 rounded-full hover:border-blue-300 hover:text-blue-700 transition-colors whitespace-nowrap"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="px-8 pb-6">
        <form
          onSubmit={handleSubmit}
          className="flex gap-2 bg-white border border-slate-200 rounded-xl p-2 shadow-sm focus-within:border-blue-400 transition-colors"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about this contract…"
            className="flex-1 px-3 py-2 text-sm bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
