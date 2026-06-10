import { api } from './api';

type ApiEnvelope<T> = { success?: boolean; data?: T };

function unwrapEnvelope<T>(payload: ApiEnvelope<T> | T): T {
  if (payload && typeof payload === 'object' && 'data' in payload && payload.data !== undefined) {
    return payload.data as T;
  }
  return payload as T;
}

export interface DatabaseBackup {
  id: string;
  filename: string;
  description?: string;
  size: number;
  status: string;
  backupPath: string;
  completedAt?: string;
  createdAt: string;
  createdBy?: {
    id: string;
    email: string;
    name: string;
  };
}

export interface BackupResponse {
  data: DatabaseBackup[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function createBackup(description?: string) {
  const response = await api.post<ApiEnvelope<DatabaseBackup>>('/backup/create', {
    description
  });
  return unwrapEnvelope(response.data);
}

export async function listBackups(page = 1, limit = 20) {
  const response = await api.get<ApiEnvelope<BackupResponse>>('/backup', {
    params: { page, limit }
  });
  const body = unwrapEnvelope(response.data);
  return {
    data: body?.data ?? [],
    meta: body?.meta ?? { page, limit, total: 0, totalPages: 0 }
  };
}

export async function getBackup(id: string) {
  const response = await api.get<ApiEnvelope<DatabaseBackup>>(`/backup/${id}`);
  return unwrapEnvelope(response.data);
}

export async function restoreBackup(backupId: string) {
  const response = await api.post<ApiEnvelope<{ message: string }>>(
    `/backup/${backupId}/restore`,
    { confirmText: "CONFIRM_RESTORE" }
  );
  return unwrapEnvelope(response.data);
}

export async function downloadBackup(id: string) {
  const response = await api.get(`/backup/${id}/download`, {
    responseType: 'blob'
  });
  return response.data;
}

export async function deleteBackup(id: string) {
  const response = await api.delete<ApiEnvelope<{ message: string }>>(`/backup/${id}`);
  return unwrapEnvelope(response.data);
}

// Helper to download file
export function downloadBackupFile(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
