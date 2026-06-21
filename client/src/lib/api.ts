import type { Agent, Approval, Company, CompanyMode, CompanySnapshot, EventRecord } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/api${path}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  startCompany: (idea: string, budget: number, mode: CompanyMode) =>
    request<{ company: Company; agents: Agent[]; events: EventRecord[] }>('/company/start', {
      method: 'POST',
      body: JSON.stringify({ idea, budget, mode }),
    }),
  getCompany: (companyId: string) => request<CompanySnapshot>(`/company/${companyId}`),
  runDemo: (companyId: string) =>
    request<{ ok: boolean; companyId: string }>('/demo/run', {
      method: 'POST',
      body: JSON.stringify({ companyId }),
    }),
  runPhaseTwoDemo: (companyId: string) =>
    request<{ ok: boolean; companyId: string; pendingApprovalId: string }>('/demo/phase2', {
      method: 'POST',
      body: JSON.stringify({ companyId }),
    }),
  approveRequest: (approvalId: string) =>
    request<{ approval: Approval }>(`/approvals/${approvalId}/approve`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),
  rejectRequest: (approvalId: string) =>
    request<{ approval: Approval }>(`/approvals/${approvalId}/reject`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),
};
