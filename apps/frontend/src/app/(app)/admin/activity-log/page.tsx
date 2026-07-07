'use client';


/**
 * @file page.tsx
 * @path apps/frontend/src/app/(app)/admin/activity-log/page.tsx
 * @description Legacy: log aktivitas audit.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { auditApi, AuditLogRecord } from '@/lib/audit-api';
import { AuditAction, AuditModule, AuditStatus } from '@prisma/client';
import { AuditStatsSection } from '@/components/audit/stat-card';
import { AuditFilters } from '@/components/audit/audit-filters';
import { AuditLogTable } from '@/components/audit/audit-table';
import { AuditPagination } from '@/components/audit/audit-pagination';
import { AuditTableSkeleton, EmptyAuditState } from '@/components/audit/audit-skeleton';

export default function ActivityLogPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState<AuditAction>();
  const [selectedModule, setSelectedModule] = useState<AuditModule>();
  const [selectedStatus, setSelectedStatus] = useState<AuditStatus>();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isExporting, setIsExporting] = useState(false);

  // Fetch audit logs
  const { data: logsData, isLoading: isLoadingLogs } = useQuery({
    queryKey: [
      'audit-logs',
      page,
      search,
      selectedAction,
      selectedModule,
      selectedStatus,
      startDate,
      endDate,
    ],
    queryFn: () =>
      auditApi.getLogs(
        page,
        20,
        search,
        selectedAction,
        selectedModule,
        selectedStatus,
        undefined,
        startDate,
        endDate,
      ),
  });

  // Fetch audit stats
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['audit-stats'],
    queryFn: () => auditApi.getStats(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    queryClient.invalidateQueries({ queryKey: ['audit-stats'] });
    toast.success('Data diperbarui');
  }, [queryClient]);

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      await auditApi.exportExcel(
        selectedAction,
        selectedModule,
        selectedStatus,
        startDate,
        endDate,
      );
      toast.success('File Excel berhasil diunduh');
    } catch (error) {
      toast.error('Gagal mengunduh file Excel');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      await auditApi.exportPDF(
        selectedAction,
        selectedModule,
        selectedStatus,
        startDate,
        endDate,
      );
      toast.success('File PDF berhasil diunduh');
    } catch (error) {
      toast.error('Gagal mengunduh file PDF');
    } finally {
      setIsExporting(false);
    }
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, selectedAction, selectedModule, selectedStatus, startDate, endDate]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Activity Log</h1>
          <p className="mt-1 text-gray-600">
            Pantau semua aktivitas penting di sistem rumah sakit
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isLoadingLogs || isLoadingStats}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className="size-4" />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      {isLoadingStats ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-20" />
            </Card>
          ))}
        </div>
      ) : (
        <AuditStatsSection stats={statsData} />
      )}

      {/* Filters Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="border-b border-gray-200 pb-4">
          <CardTitle className="text-lg">Filter & Pencarian</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <AuditFilters
            onSearchChange={setSearch}
            onActionChange={setSelectedAction}
            onModuleChange={setSelectedModule}
            onStatusChange={setSelectedStatus}
            onDateRangeChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }}
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
            isExporting={isExporting}
          />
        </CardContent>
      </Card>

      {/* Logs Table Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="border-b border-gray-200 pb-4">
          <CardTitle className="text-lg">Activity Logs</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoadingLogs ? (
            <div className="p-6">
              <AuditTableSkeleton />
            </div>
          ) : logsData?.data && logsData.data.length > 0 ? (
            <>
              <AuditLogTable logs={logsData.data} isLoading={false} />
              <AuditPagination
                page={page}
                totalPages={logsData.pagination.totalPages}
                total={logsData.pagination.total}
                limit={logsData.pagination.limit}
                onPageChange={setPage}
              />
            </>
          ) : (
            <div className="p-6">
              <EmptyAuditState />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
