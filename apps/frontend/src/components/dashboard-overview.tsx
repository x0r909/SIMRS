"use client";


/**
 * @file dashboard-overview.tsx
 * @path apps/frontend/src/components/dashboard-overview.tsx
 * @description Kartu ringkasan statistik dashboard.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Loader2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type DashboardStat = {
  label: string;
  value: string | number;
  description?: string;
  status?: "ok" | "warn" | "error" | "neutral";
};

const STATUS_STYLES: Record<NonNullable<DashboardStat["status"]>, string> = {
  ok: "text-emerald-600",
  warn: "text-amber-600",
  error: "text-red-600",
  neutral: "text-foreground"
};

export function DashboardOverview({
  title,
  description,
  stats,
  isLoading = false,
  footer
}: {
  title: string;
  description: string;
  stats: DashboardStat[];
  isLoading?: boolean;
  footer?: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardDescription className="animate-pulse bg-muted h-4 w-24 rounded" />
                  <div className="animate-pulse bg-muted mt-2 h-8 w-20 rounded" />
                </CardHeader>
                <CardContent>
                  <div className="animate-pulse bg-muted h-3 w-full rounded" />
                </CardContent>
              </Card>
            ))
          : stats.map((stat) => (
              <Card key={stat.label}>
                <CardHeader className="pb-2">
                  <CardDescription>{stat.label}</CardDescription>
                  <CardTitle
                    className={cn(
                      "text-3xl",
                      stat.status ? STATUS_STYLES[stat.status] : undefined
                    )}
                  >
                    {stat.value}
                  </CardTitle>
                </CardHeader>
                {stat.description ? (
                  <CardContent>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  </CardContent>
                ) : null}
              </Card>
            ))}
      </div>
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Memuat data monitoring...
        </div>
      ) : footer ? (
        <p className="text-xs text-muted-foreground">{footer}</p>
      ) : null}
    </div>
  );
}
