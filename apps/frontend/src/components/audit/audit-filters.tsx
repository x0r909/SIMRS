'use client';

import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar, Search, Download } from 'lucide-react';
import { AuditAction, AuditModule, AuditStatus } from '@prisma/client';
import { getActionLabel, getModuleLabel } from '@/lib/audit-utils';

interface AuditFiltersProps {
  onSearchChange: (search: string) => void;
  onActionChange: (action?: AuditAction) => void;
  onModuleChange: (module?: AuditModule) => void;
  onStatusChange: (status?: AuditStatus) => void;
  onDateRangeChange: (startDate?: Date, endDate?: Date) => void;
  onExportExcel: () => void;
  onExportPDF: () => void;
  isExporting: boolean;
}

export function AuditFilters({
  onSearchChange,
  onActionChange,
  onModuleChange,
  onStatusChange,
  onDateRangeChange,
  onExportExcel,
  onExportPDF,
  isExporting,
}: AuditFiltersProps) {
  const [search, setSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState<AuditAction>();
  const [selectedModule, setSelectedModule] = useState<AuditModule>();
  const [selectedStatus, setSelectedStatus] = useState<AuditStatus>();
  const [startDate, setStartDate] = useState<string>();
  const [endDate, setEndDate] = useState<string>();

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onSearchChange(value);
  };

  const handleActionChange = (value: string) => {
    const action = value === 'all' ? undefined : (value as AuditAction);
    setSelectedAction(action);
    onActionChange(action);
  };

  const handleModuleChange = (value: string) => {
    const module = value === 'all' ? undefined : (value as AuditModule);
    setSelectedModule(module);
    onModuleChange(module);
  };

  const handleStatusChange = (value: string) => {
    const status = value === 'all' ? undefined : (value as AuditStatus);
    setSelectedStatus(status);
    onStatusChange(status);
  };

  const handleDateRangeChange = (type: 'start' | 'end', value: string) => {
    if (type === 'start') {
      setStartDate(value);
      onDateRangeChange(value ? new Date(value) : undefined, endDate ? new Date(endDate) : undefined);
    } else {
      setEndDate(value);
      onDateRangeChange(startDate ? new Date(startDate) : undefined, value ? new Date(value) : undefined);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Cari berdasarkan user, aktivitas, atau deskripsi..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
        {/* Action filter */}
        <Select value={selectedAction || 'all'} onValueChange={handleActionChange}>
          <SelectTrigger>
            <SelectValue placeholder="Aktivitas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Aktivitas</SelectItem>
            <SelectItem value={AuditAction.LOGIN}>{getActionLabel(AuditAction.LOGIN)}</SelectItem>
            <SelectItem value={AuditAction.LOGOUT}>{getActionLabel(AuditAction.LOGOUT)}</SelectItem>
            <SelectItem value={AuditAction.USER_CREATE}>{getActionLabel(AuditAction.USER_CREATE)}</SelectItem>
            <SelectItem value={AuditAction.USER_UPDATE}>{getActionLabel(AuditAction.USER_UPDATE)}</SelectItem>
            <SelectItem value={AuditAction.USER_DELETE}>{getActionLabel(AuditAction.USER_DELETE)}</SelectItem>
            <SelectItem value={AuditAction.PATIENT_CREATE}>{getActionLabel(AuditAction.PATIENT_CREATE)}</SelectItem>
            <SelectItem value={AuditAction.PATIENT_UPDATE}>{getActionLabel(AuditAction.PATIENT_UPDATE)}</SelectItem>
            <SelectItem value={AuditAction.PATIENT_DELETE}>{getActionLabel(AuditAction.PATIENT_DELETE)}</SelectItem>
            <SelectItem value={AuditAction.APPOINTMENT_BOOK}>{getActionLabel(AuditAction.APPOINTMENT_BOOK)}</SelectItem>
          </SelectContent>
        </Select>

        {/* Module filter */}
        <Select value={selectedModule || 'all'} onValueChange={handleModuleChange}>
          <SelectTrigger>
            <SelectValue placeholder="Module" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Module</SelectItem>
            <SelectItem value={AuditModule.AUTH}>{getModuleLabel(AuditModule.AUTH)}</SelectItem>
            <SelectItem value={AuditModule.USER_MANAGEMENT}>{getModuleLabel(AuditModule.USER_MANAGEMENT)}</SelectItem>
            <SelectItem value={AuditModule.PATIENT}>{getModuleLabel(AuditModule.PATIENT)}</SelectItem>
            <SelectItem value={AuditModule.APPOINTMENT}>{getModuleLabel(AuditModule.APPOINTMENT)}</SelectItem>
            <SelectItem value={AuditModule.MEDICAL_RECORD}>{getModuleLabel(AuditModule.MEDICAL_RECORD)}</SelectItem>
            <SelectItem value={AuditModule.PHARMACY}>{getModuleLabel(AuditModule.PHARMACY)}</SelectItem>
          </SelectContent>
        </Select>

        {/* Status filter */}
        <Select value={selectedStatus || 'all'} onValueChange={handleStatusChange}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value={AuditStatus.SUCCESS}>Berhasil</SelectItem>
            <SelectItem value={AuditStatus.FAILED}>Gagal</SelectItem>
            <SelectItem value={AuditStatus.ERROR}>Error</SelectItem>
            <SelectItem value={AuditStatus.WARNING}>Peringatan</SelectItem>
          </SelectContent>
        </Select>

        {/* Start date */}
        <input
          type="date"
          value={startDate}
          onChange={(e) => handleDateRangeChange('start', e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          placeholder="Dari tanggal"
        />

        {/* End date */}
        <input
          type="date"
          value={endDate}
          onChange={(e) => handleDateRangeChange('end', e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          placeholder="Sampai tanggal"
        />

        {/* Export buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onExportExcel}
            disabled={isExporting}
            className="flex-1"
          >
            <Download className="mr-2 size-4" />
            Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onExportPDF}
            disabled={isExporting}
            className="flex-1"
          >
            <Download className="mr-2 size-4" />
            PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
