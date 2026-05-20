'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Activity, LogIn, Pencil, AlertCircle } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'green' | 'blue' | 'purple' | 'red';
}

const colorClasses = {
  green: 'bg-green-50 text-green-700',
  blue: 'bg-blue-50 text-blue-700',
  purple: 'bg-purple-50 text-purple-700',
  red: 'bg-red-50 text-red-700',
};

const iconBgClasses = {
  green: 'bg-green-100',
  blue: 'bg-blue-100',
  purple: 'bg-purple-100',
  red: 'bg-red-100',
};

export function AuditStatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{value.toLocaleString('id-ID')}</p>
          </div>
          <div className={`rounded-lg p-3 ${iconBgClasses[color]}`}>
            <div className={colorClasses[color]}>{icon}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AuditStatsSection({ stats }: any) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      <AuditStatCard
        title="Total Aktivitas Hari Ini"
        value={stats?.totalActivityToday || 0}
        icon={<Activity className="size-6" />}
        color="blue"
      />
      <AuditStatCard
        title="Total Login"
        value={stats?.totalLogin || 0}
        icon={<LogIn className="size-6" />}
        color="green"
      />
      <AuditStatCard
        title="Perubahan Data"
        value={stats?.totalDataChanges || 0}
        icon={<Pencil className="size-6" />}
        color="purple"
      />
      <AuditStatCard
        title="Error Sistem"
        value={stats?.totalErrors || 0}
        icon={<AlertCircle className="size-6" />}
        color="red"
      />
    </div>
  );
}
