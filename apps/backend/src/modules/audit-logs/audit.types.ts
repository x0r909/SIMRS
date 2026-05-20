import { AuditAction, AuditModule, AuditStatus } from '@prisma/client';

export interface CreateAuditLogDTO {
  action: AuditAction;
  module: AuditModule;
  entity: string;
  entityId?: string;
  description?: string;
  metadata?: Record<string, any>;
  status?: AuditStatus;
  ip?: string;
  userAgent?: string;
  actorId?: string;
}

export interface AuditLogResponse {
  id: string;
  action: AuditAction;
  module: AuditModule;
  status: AuditStatus;
  entity: string;
  entityId?: string;
  description?: string;
  createdAt: Date;
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

export interface AuditLogFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  action?: AuditAction;
  module?: AuditModule;
  status?: AuditStatus;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  sortBy?: 'createdAt' | 'action';
  sortOrder?: 'asc' | 'desc';
}

export interface AuditLogStatsResponse {
  totalActivityToday: number;
  totalLogin: number;
  totalDataChanges: number;
  totalErrors: number;
}

export interface PaginatedAuditLogsResponse {
  data: AuditLogResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
