/**
 * @file hospital-overview.service.ts
 * @path apps/backend/src/modules/health/hospital-overview.service.ts
 * @description Service bisnis health: logika domain & Prisma. Health check: status Postgres, Redis, MinIO, metrik sistem.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../../shared/prisma/prisma.service";

import type { OverviewStat } from "./system-overview.service";

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfToday(): Date {
  const d = new Date();
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
export class HospitalOverviewService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveHospitalId(hospitalId?: string | null): Promise<string> {
    if (hospitalId) return hospitalId;
    const hospital = await this.prisma.hospital.findFirst({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "asc" }
    });
    if (!hospital) throw new NotFoundException("Rumah sakit belum dikonfigurasi");
    return hospital.id;
  }

  async getOverview(hospitalId?: string | null): Promise<{
    stats: OverviewStat[];
    hospitalName: string;
    generatedAt: string;
  }> {
    const hid = await this.resolveHospitalId(hospitalId);
    const hospital = await this.prisma.hospital.findUnique({ where: { id: hid } });
    if (!hospital) throw new NotFoundException("Rumah sakit tidak ditemukan");

    const todayStart = startOfToday();
    const todayEnd = endOfToday();

    const [visitsToday, activeQueue, revenueAgg, activeDoctors, appointmentsToday] =
      await Promise.all([
        this.prisma.visit.count({
          where: { hospitalId: hid, visitDate: { gte: todayStart, lte: todayEnd } }
        }),
        this.prisma.queueEntry.count({
          where: {
            hospitalId: hid,
            date: { gte: todayStart, lte: todayEnd },
            status: { in: ["WAITING", "CALLED"] }
          }
        }),
        this.prisma.billingInvoice.aggregate({
          _sum: { total: true },
          where: {
            createdAt: { gte: todayStart, lte: todayEnd },
            visit: { hospitalId: hid }
          }
        }),
        this.prisma.user.count({
          where: {
            hospitalId: hid,
            status: "ACTIVE",
            roles: { some: { role: { key: "DOCTOR" } } }
          }
        }),
        this.prisma.appointment.count({
          where: {
            hospitalId: hid,
            scheduledAt: { gte: todayStart, lte: todayEnd }
          }
        })
      ]);

    const revenue = revenueAgg._sum.total ?? 0;

    const stats: OverviewStat[] = [
      {
        label: "Kunjungan Hari Ini",
        value: String(visitsToday),
        description: `${appointmentsToday} janji temu terjadwal`,
        status: "ok"
      },
      {
        label: "Antrian Aktif",
        value: String(activeQueue),
        description: "Pasien menunggu atau dipanggil",
        status: activeQueue > 20 ? "warn" : "ok"
      },
      {
        label: "Pendapatan Hari Ini",
        value: formatCurrency(revenue),
        description: "Total tagihan dibuat hari ini",
        status: "neutral"
      },
      {
        label: "Dokter Aktif",
        value: String(activeDoctors),
        description: "Akun dokter aktif di rumah sakit",
        status: "ok"
      }
    ];

    return {
      stats,
      hospitalName: hospital.name,
      generatedAt: new Date().toISOString()
    };
  }
}
