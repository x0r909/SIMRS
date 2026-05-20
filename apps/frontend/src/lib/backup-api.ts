import { api } from './api';

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
  const response = await api.post<{ message: string; data: DatabaseBackup }>('/backup/create', {
    description
  });
  return response.data;
}

export async function listBackups(page = 1, limit = 20) {
  const response = await api.get<BackupResponse>('/backup', {
    params: { page, limit }
  });
  return response.data;
}

export async function getBackup(id: string) {
  const response = await api.get<{ data: DatabaseBackup }>(`/backup/${id}`);
  return response.data;
}

export async function restoreBackup(backupId: string) {
  const response = await api.post<{ message: string }>('/backup/restore', {
    backupId
  });
  return response.data;
}

export async function downloadBackup(id: string) {
  const response = await api.get(`/backup/${id}/download`, {
    responseType: 'blob'
  });
  return response.data;
}

export async function deleteBackup(id: string) {
  const response = await api.delete<{ message: string }>(`/backup/${id}`);
  return response.data;
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
