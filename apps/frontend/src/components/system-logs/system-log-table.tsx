"use client";


/**
 * @file system-log-table.tsx
 * @path apps/frontend/src/components/system-logs/system-log-table.tsx
 * @description Tabel system log dengan filter.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Fragment, useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import type { SystemLogEntry } from "@/lib/system-logs-api";

function levelVariant(level: string): "danger" | "warning" | "default" | "outline" {
  if (level === "ERROR") return "danger";
  if (level === "WARN") return "warning";
  if (level === "INFO") return "default";
  return "outline";
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  return {
    absolute: format(date, "dd MMM yyyy, HH:mm:ss", { locale: idLocale }),
    relative: format(date, "HH:mm:ss")
  };
}

function DetailItem({ label, value }: { label: string; value?: string | number | boolean | null }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-all font-mono text-xs">{String(value)}</dd>
    </div>
  );
}

function LogDetailPanel({ log }: { log: SystemLogEntry }) {
  const meta = log.metadata ?? {};
  const roles =
    log.actor?.roles?.map((r) => r.role.name).join(", ") ||
    (Array.isArray(meta.userRoles) ? meta.userRoles.join(", ") : undefined);
  const query =
    meta.query && Object.keys(meta.query).length > 0 ? JSON.stringify(meta.query) : undefined;
  const params =
    meta.params && Object.keys(meta.params).length > 0 ? JSON.stringify(meta.params) : undefined;

  return (
    <div className="grid gap-3 rounded-md border bg-muted/30 p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <DetailItem label="Request ID" value={log.requestId} />
      <DetailItem label="Trace ID" value={log.traceId} />
      <DetailItem label="IP Address" value={log.ipAddress} />
      <DetailItem label="User ID" value={log.userId} />
      <DetailItem label="Email" value={log.actor?.email ?? meta.userEmail} />
      <DetailItem label="Nama" value={log.actor?.name} />
      <DetailItem label="Role" value={roles} />
      <DetailItem label="Terautentikasi" value={meta.authenticated ? "Ya" : "Tidak"} />
      <DetailItem label="Method" value={meta.method} />
      <DetailItem label="Path" value={meta.path} />
      <DetailItem label="URL Lengkap" value={meta.originalUrl} />
      <DetailItem label="Host" value={meta.host} />
      <DetailItem label="Protocol" value={meta.protocol} />
      <DetailItem label="HTTP Status" value={log.statusCode} />
      <DetailItem label="Durasi (ms)" value={log.duration} />
      <DetailItem label="Service" value={log.service} />
      <DetailItem label="Context" value={log.context} />
      <DetailItem label="User-Agent" value={meta.userAgent} />
      <DetailItem label="Referer" value={meta.referer} />
      <DetailItem label="Query Params" value={query} />
      <DetailItem label="Route Params" value={params} />
      <DetailItem label="Pesan Error" value={meta.error} />
      <DetailItem label="Pesan Log" value={log.message} />
    </div>
  );
}

export function SystemLogTable({ logs }: { logs: SystemLogEntry[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-8" />
            <TableHead className="min-w-[160px]">Timestamp</TableHead>
            <TableHead>Level</TableHead>
            <TableHead className="min-w-[120px]">IP Address</TableHead>
            <TableHead className="min-w-[160px]">Pengguna</TableHead>
            <TableHead className="min-w-[200px]">Akses (Method + URL)</TableHead>
            <TableHead>HTTP</TableHead>
            <TableHead>Durasi</TableHead>
            <TableHead className="min-w-[120px]">Request ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => {
            const ts = formatTimestamp(log.createdAt);
            const expanded = expandedId === log.id;
            const access =
              log.context ||
              (log.metadata?.method && log.metadata?.originalUrl
                ? `${log.metadata.method} ${log.metadata.originalUrl}`
                : log.message);

            return (
              <Fragment key={log.id}>
                <TableRow
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => setExpandedId(expanded ? null : log.id)}
                >
                  <TableCell className="px-2">
                    {expanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="font-medium">{ts.absolute}</div>
                    <div className="text-muted-foreground">{ts.relative}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={levelVariant(log.level)}>{log.level}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{log.ipAddress || "—"}</TableCell>
                  <TableCell className="text-xs">
                    <div className="font-medium">{log.actor?.name || "Anonim"}</div>
                    <div className="text-muted-foreground">
                      {log.actor?.email || log.metadata?.userEmail || "—"}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs font-mono text-xs">
                    <div className="truncate" title={access}>
                      {access}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    {log.statusCode != null ? (
                      <span
                        className={
                          log.statusCode >= 400
                            ? "font-semibold text-red-600"
                            : "text-foreground"
                        }
                      >
                        {log.statusCode}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {log.duration != null ? `${log.duration}ms` : "—"}
                  </TableCell>
                  <TableCell className="max-w-[100px] truncate font-mono text-[10px] text-muted-foreground">
                    {log.requestId || "—"}
                  </TableCell>
                </TableRow>
                {expanded && (
                  <TableRow>
                    <TableCell colSpan={9} className="bg-muted/20 p-3">
                      <p className="mb-2 text-xs font-semibold text-muted-foreground">
                        Detail lengkap — klik baris untuk menutup
                      </p>
                      <LogDetailPanel log={log} />
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
