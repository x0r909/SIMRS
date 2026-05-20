import { api } from './api';
import { AuditAction, AuditModule, AuditStatus } from '@prisma/client';

export interface AuditLogRecord {
  id: string;
  action: AuditAction;
  module: AuditModule;
  status: AuditStatus;
  entity: string;
  entityId?: string;
  description?: string;
  createdAt: string;
  actor?: {
    id: string;
    name: string;
    email: string;
    roles: Array<{
      role: {
        name: string;
        key: string;
      };
    }>;
  };
  ip?: string;
}

export interface AuditStatsResponse {
  totalActivityToday: number;
  totalLogin: number;
  totalDataChanges: number;
  totalErrors: number;
}

export interface AuditLogsResponse {
  data: AuditLogRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const auditApi = {
  getLogs: async (
    page: number = 1,
    limit: number = 20,
    search?: string,
    action?: AuditAction,
    module?: AuditModule,
    status?: AuditStatus,
    userId?: string,
    startDate?: Date,
    endDate?: Date,
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Promise<AuditLogsResponse> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    params.append('sortOrder', sortOrder);

    if (search) params.append('search', search);
    if (action) params.append('action', action);
    if (module) params.append('module', module);
    if (status) params.append('status', status);
    if (userId) params.append('userId', userId);
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());

    const response = await api.get(`/audit-logs?${params.toString()}`);
    // The response.data is wrapped by ResponseInterceptor as { success, data: {...actual data...} }
    // So response.data.data contains the actual pagination/logs data
    return response.data.data || response.data;
  },

  getStats: async (): Promise<AuditStatsResponse> => {
    const response = await api.get('/audit-logs/stats');
    return response.data.data;
  },

  exportExcel: async (
    action?: AuditAction,
    module?: AuditModule,
    status?: AuditStatus,
    startDate?: Date,
    endDate?: Date,
  ) => {
    const params = new URLSearchParams();

    if (action) params.append('action', action);
    if (module) params.append('module', module);
    if (status) params.append('status', status);
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());

    const response = await api.get(`/audit-logs/export/excel?${params.toString()}`, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'audit-logs.xlsx');
    document.body.appendChild(link);
    link.click();
    link.parentElement?.removeChild(link);
  },

  exportPDF: async (
    action?: AuditAction,
    module?: AuditModule,
    status?: AuditStatus,
    startDate?: Date,
    endDate?: Date,
  ) => {
    const params = new URLSearchParams();

    if (action) params.append('action', action);
    if (module) params.append('module', module);
    if (status) params.append('status', status);
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());

    const response = await api.get(`/audit-logs/export/pdf?${params.toString()}`, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'audit-logs.pdf');
    document.body.appendChild(link);
    link.click();
    link.parentElement?.removeChild(link);
  },
};
