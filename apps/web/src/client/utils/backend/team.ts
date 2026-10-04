import { apiRequest } from './api';
import type { RoleKey } from '../../types/org';

const memberPath = (email: string) => `/workspace/members/${encodeURIComponent(email)}`;

export async function grantAccess(email: string, role: RoleKey, branchId: string | null) {
  return apiRequest<{ invited: boolean; inviteToken?: string }>(`/workspace/invites/${encodeURIComponent(email)}`, {
    method: 'POST',
    body: JSON.stringify({ role, branchId })
  });
}

export async function updateAccess(email: string, role: RoleKey, branchId: string | null, active: boolean) {
  return apiRequest<{ active: boolean; inviteToken?: string }>(memberPath(email), {
    method: 'PUT',
    body: JSON.stringify({ role, branchId, active })
  });
}

export async function revokeAccess(email: string) {
  await apiRequest(memberPath(email), { method: 'DELETE' });
}
