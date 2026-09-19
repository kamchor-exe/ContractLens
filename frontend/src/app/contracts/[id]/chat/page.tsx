"use client";

import { use, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Send, Bot, User as UserIcon, Sparkles, FileText, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ContractTabs } from "@/components/ui/Badges";
import { fetchContractById, fetchChatHistory, sendChatMessage } from "@/lib/api";
import type { Contract, ChatMessage } from "@/lib/types";

export default function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [contract, setContract] = useState<Contract | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [cData, chatData] = await Promise.all([
          fetchContractById(id),
          fetchChatHistory(id).catch(() => []),
        ]);
        setContract(cData);
        setMessages(chatData);
      } catch (err) {
        console.error("Error loading chat data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userText = input.trim();
    setInput("");
    setSending(true);

    // Optimistically append User Message
    const tempUserMsg: ChatMessage = {
      id: "temp-" + Date.now(),
      role: "USER",
      content: userText,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const assistantResponse = await sendChatMessage(id, userText);
      setMessages((prev) => [...prev, assistantResponse]);
    } catch (err) {
      console.error("Chat error:", err);
      const errorMsg: ChatMessage = {
        id: "err-" + Date.now(),
        role: "ASSISTANT",
        content: "Sorry, I could not complete your query. Please check your backend service.",
        citations: [],
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
      <PageHeader
        title={contract ? `${contract.title} — AI Assistant` : "Grounded AI Chat"}
        subtitle="Grounded Q&A with direct evidence citations"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: contract?.title || "Contract", href: `/contracts/${id}` },
          { label: "Chat" },
        ]}
      />
      <ContractTabs contractId={id} active="chat" />

      {/* Main Chat Container */}
      <div className="flex-1 flex flex-col min-h-0 p-6 max-w-5xl w-full mx-auto">
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-400">
              Loading chat history from database...
            </div>
          ) : messages.length === 0 ? (
            <div className="p-8 text-center space-y-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                Ask anything about {contract?.title || "this contract"}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Answers are strictly grounded in contract text with page & section citations.
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {[
                  "What is the monthly payment fee?",
                  "When does this agreement expire?",
                  "What are the termination conditions?",
                ].map((sample) => (
                  <button
                    key={sample}
                    onClick={() => setInput(sample)}
                    className="text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 rounded-xl transition-colors"
                  >
                    "{sample}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.role === "USER" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "ASSISTANT" && (
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-2xl p-4 text-sm leading-relaxed shadow-sm space-y-3 ${
                    msg.role === "USER"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium"
                      : "bg-white border border-slate-200 text-slate-800"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* Citations Block */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" /> Source Evidence Citations:
                      </p>
                      <div className="space-y-1.5">
                        {msg.citations.map((cite, idx) => (
                          <Link
                            key={idx}
                            href={`/contracts/${id}/source`}
                            className="block p-2 rounded-lg bg-blue-50/80 hover:bg-blue-100/80 border border-blue-100 text-xs transition-colors group"
                          >
                            <div className="flex items-center justify-between text-blue-700 font-semibold mb-0.5">
                              <span>
                                Page {cite.source_page} · {cite.source_section}
                              </span>
                              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                            <p className="text-slate-600 italic line-clamp-2">
                              "{cite.snippet}"
                            </p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {msg.role === "USER" && (
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))
          )}

          {sending && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 text-xs font-semibold text-slate-500 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500 animate-spin" />
                Searching contract vector chunks & generating grounded answer...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="mt-4 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about this contract..."
            className="flex-1 px-4 py-3 bg-white border border-slate-300 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-semibold rounded-2xl text-sm shadow-md transition-all flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
