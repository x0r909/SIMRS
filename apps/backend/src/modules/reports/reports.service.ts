/**
 * @file reports.service.ts
 * @path apps/backend/src/modules/reports/reports.service.ts
 * @description Service bisnis reports: logika domain & Prisma. Laporan operasional: ringkasan harian order RS.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Injectable } from "@nestjs/common";

import { HospitalOverviewService } from "../health/hospital-overview.service";
import { PrismaService } from "../../shared/prisma/prisma.service";

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(amount);
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hospitalOverview: HospitalOverviewService
  ) {}

  async getDailyReport(hospitalId?: string | null, dateInput?: string) {
    const hid = await this.hospitalOverview.resolveHospitalId(hospitalId);
    const date = dateInput ? new Date(dateInput) : new Date();
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const [visits, appointments, queueCompleted, revenueAgg, visitsByStatus, topDiagnoses] =
      await Promise.all([
        this.prisma.visit.count({
          where: { hospitalId: hid, visitDate: { gte: dayStart, lte: dayEnd } }
        }),
        this.prisma.appointment.count({
          where: { hospitalId: hid, scheduledAt: { gte: dayStart, lte: dayEnd } }
        }),
        this.prisma.queueEntry.count({
          where: {
            hospitalId: hid,
            date: { gte: dayStart, lte: dayEnd },
            status: "DONE"
          }
        }),
        this.prisma.billingInvoice.aggregate({
          _sum: { total: true },
          where: {
            createdAt: { gte: dayStart, lte: dayEnd },
            visit: { hospitalId: hid }
          }
        }),
        this.prisma.visit.groupBy({
          by: ["status"],
          where: { hospitalId: hid, visitDate: { gte: dayStart, lte: dayEnd } },
          _count: { _all: true }
        }),
        this.prisma.visit.findMany({
          where: {
            hospitalId: hid,
            visitDate: { gte: dayStart, lte: dayEnd },
            diagnosis: { not: null }
          },
          select: { diagnosis: true }
        })
      ]);

    const diagnosisCounts = new Map<string, number>();
    for (const row of topDiagnoses) {
      const key = (row.diagnosis ?? "").trim();
      if (!key) continue;
      diagnosisCounts.set(key, (diagnosisCounts.get(key) ?? 0) + 1);
    }

    const topDiagnosisList = [...diagnosisCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([diagnosis, count]) => ({ diagnosis, count }));

    const revenue = revenueAgg._sum.total ?? 0;

    return {
      date: dayStart.toISOString().slice(0, 10),
      hospitalId: hid,
      summary: {
        visits,
        appointments,
        queueCompleted,
        revenue,
        revenueFormatted: formatCurrency(revenue)
      },
      visitsByStatus: visitsByStatus.map((row) => ({
        status: row.status,
        count: row._count._all
      })),
      topDiagnoses: topDiagnosisList,
      generatedAt: new Date().toISOString()
    };
  }
}
