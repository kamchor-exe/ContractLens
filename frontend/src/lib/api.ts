import { Contract, Obligation, Deadline, Reminder, ChatMessage, Clause } from "./types";

const API_BASE = "/api";

export async function fetchContracts(): Promise<Contract[]> {
  const res = await fetch(`${API_BASE}/contracts`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch contracts");
  return res.json();
}

export async function fetchContractById(id: string): Promise<Contract> {
  const res = await fetch(`${API_BASE}/contracts/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch contract details");
  return res.json();
}

export async function uploadContract(file: File): Promise<Contract> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/contracts/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to upload contract");
  return res.json();
}

export async function deleteContract(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/contracts/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete contract");
}

export async function fetchObligations(contractId: string): Promise<Obligation[]> {
  const res = await fetch(`${API_BASE}/contracts/${contractId}/obligations`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch obligations");
  return res.json();
}

export async function updateObligationStatus(
  obligationId: string,
  status: "PENDING" | "COMPLETED" | "OVERDUE"
): Promise<Obligation> {
  const res = await fetch(`${API_BASE}/obligations/${obligationId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update obligation status");
  return res.json();
}

export async function fetchDeadlines(contractId: string): Promise<Deadline[]> {
  const res = await fetch(`${API_BASE}/contracts/${contractId}/deadlines`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch deadlines");
  return res.json();
}

export async function fetchGlobalDeadlines(daysAhead: number = 365): Promise<Deadline[]> {
  const res = await fetch(`${API_BASE}/deadlines?days_ahead=${daysAhead}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch global deadlines");
  return res.json();
}

export async function fetchReminders(): Promise<Reminder[]> {
  const res = await fetch(`${API_BASE}/reminders`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch reminders");
  return res.json();
}

export async function acknowledgeReminder(reminderId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/reminders/${reminderId}/acknowledge`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error("Failed to acknowledge reminder");
}

export async function fetchClauses(contractId: string): Promise<Clause[]> {
  const res = await fetch(`${API_BASE}/contracts/${contractId}/clauses`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch clauses");
  return res.json();
}

export async function fetchChatHistory(contractId: string): Promise<ChatMessage[]> {
  const res = await fetch(`${API_BASE}/contracts/${contractId}/chat`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch chat history");
  return res.json();
}

export async function sendChatMessage(contractId: string, content: string): Promise<ChatMessage> {
  const res = await fetch(`${API_BASE}/contracts/${contractId}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error("Failed to send chat message");
  return res.json();
}

export async function fetchChunkDetail(contractId: string, chunkId: string) {
  const res = await fetch(`${API_BASE}/contracts/${contractId}/chunks/${chunkId}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch chunk detail");
  return res.json();
}
