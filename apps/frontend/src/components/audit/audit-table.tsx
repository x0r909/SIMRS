'use client';


/**
 * @file audit-table.tsx
 * @path apps/frontend/src/components/audit/audit-table.tsx
 * @description Komponen UI audit log: audit-table.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { AuditLogRecord } from '@/lib/audit-api';
import { getActionLabel, getActionColor, getStatusLabel, getStatusColor, getModuleLabel } from '@/lib/audit-utils';

interface AuditLogTableProps {
  logs: AuditLogRecord[];
  isLoading: boolean;
}

export function AuditLogTable({ logs, isLoading }: AuditLogTableProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-200" />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow className="border-b border-gray-200">
            <TableHead className="font-semibold text-gray-700">Waktu</TableHead>
            <TableHead className="font-semibold text-gray-700">User</TableHead>
            <TableHead className="font-semibold text-gray-700">Role</TableHead>
            <TableHead className="font-semibold text-gray-700">Module</TableHead>
            <TableHead className="font-semibold text-gray-700">Aktivitas</TableHead>
            <TableHead className="font-semibold text-gray-700">Deskripsi</TableHead>
            <TableHead className="font-semibold text-gray-700">Status</TableHead>
            <TableHead className="font-semibold text-gray-700">IP Address</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <TableCell className="text-sm text-gray-600">
                {formatDistanceToNow(new Date(log.createdAt), {
                  addSuffix: true,
                  locale: id,
                })}
                <div className="text-xs text-gray-500">
                  {new Date(log.createdAt).toLocaleString('id-ID')}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm font-medium text-gray-900">{log.actor?.name || '-'}</div>
                <div className="text-xs text-gray-500">{log.actor?.email || '-'}</div>
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {log.actor?.roles[0]?.role.name || '-'}
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {getModuleLabel(log.module)}
              </TableCell>
              <TableCell>
                <Badge className={`${getActionColor(log.action)}`}>
                  {getActionLabel(log.action)}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                {log.description || '-'}
              </TableCell>
              <TableCell>
                <Badge className={`${getStatusColor(log.status)}`}>
                  {getStatusLabel(log.status)}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-gray-600 font-mono">
                {log.ip || '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
