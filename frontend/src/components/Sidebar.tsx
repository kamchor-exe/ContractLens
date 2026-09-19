"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Bell,
  Scale,
  PlusCircle,
} from "lucide-react";
import { fetchContracts } from "@/lib/api";
import type { Contract } from "@/lib/types";

export function Sidebar() {
  const pathname = usePathname();
  const [contracts, setContracts] = useState<Contract[]>([]);

  useEffect(() => {
    async function loadNavContracts() {
      try {
        const list = await fetchContracts();
        setContracts(list);
      } catch (e) {
        // quiet fallback
      }
    }
    loadNavContracts();
    // Refresh contracts list when pathname changes (e.g. after upload)
  }, [pathname]);

  return (
    <aside className="w-64 flex flex-col bg-slate-900 text-slate-200 shrink-0 border-r border-slate-800">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-md">
          <Scale className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-bold text-white text-lg tracking-tight block">
            ContractLens
          </span>
          <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">
            AI Document Intelligence
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Main Menu
          </p>
          <Link
            href="/"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              pathname === "/"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-400 hover:bg-slate-800/80 hover:text-white"
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            Dashboard
          </Link>
        </div>

        {/* Dynamic Contracts List */}
        <div>
          <div className="flex items-center justify-between px-3 mb-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Contracts ({contracts.length})
            </p>
            <Link
              href="/"
              title="Upload new contract"
              className="text-slate-400 hover:text-blue-400 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
            </Link>
          </div>

          {contracts.length === 0 ? (
            <p className="text-xs text-slate-500 px-3 py-2 italic">
              No contracts uploaded yet
            </p>
          ) : (
            <div className="space-y-1">
              {contracts.map((c) => {
                const active = pathname.includes(c.id);
                return (
                  <Link
                    key={c.id}
                    href={`/contracts/${c.id}`}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      active
                        ? "bg-blue-600/20 text-blue-300 border border-blue-500/30 font-semibold"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                    <span className="truncate">{c.title}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800">
        <div className="px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
            DU
          </div>
          <div>
            <p className="text-xs text-white font-semibold">Demo User</p>
            <p className="text-[10px] text-slate-400">demo@contractlens.ai</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
