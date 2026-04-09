import { randomUUID } from "crypto";

import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PaginationQueryDto, toSkipTake } from "../../common/pagination/pagination";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";

import { InvoiceItemDto } from "./dto/create-invoice.dto";

function makeNumber() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rand = randomUUID().slice(0, 8).toUpperCase();
  return `INV-${y}${m}${day}-${rand}`;
}

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogsService
  ) {}

  private async ensurePatientProfile(userId: string) {
    const patient = await this.prisma.patient.findUnique({ where: { id: userId }, select: { id: true } });
    if (!patient) throw new NotFoundException("Patient profile not found");
  }

  async list(query: PaginationQueryDto) {
    const { skip, take, page, limit } = toSkipTake(query.page, query.limit);
    const where: Prisma.BillingInvoiceWhereInput | undefined = query.q
      ? {
          OR: [
            { number: { contains: query.q, mode: "insensitive" as const } },
            { visit: { patient: { name: { contains: query.q, mode: "insensitive" as const } } } },
            { visit: { patient: { mrn: { contains: query.q, mode: "insensitive" as const } } } },
            { visit: { doctor: { name: { contains: query.q, mode: "insensitive" as const } } } }
          ]
        }
      : undefined;

    const [total, data] = await Promise.all([
      this.prisma.billingInvoice.count({ where }),
      this.prisma.billingInvoice.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          visit: {
            select: {
              id: true,
              startedAt: true,
              patient: { select: { id: true, mrn: true, name: true } },
              doctor: { select: { id: true, code: true, name: true } }
            }
          },
          items: true
        }
      })
    ]);
    return { data, meta: { page, limit, total } };
  }

  async listMine(userId: string, query: PaginationQueryDto) {
    await this.ensurePatientProfile(userId);
    const { skip, take, page, limit } = toSkipTake(query.page, query.limit);
    const where: Prisma.BillingInvoiceWhereInput = query.q
      ? {
          visit: { patientId: userId },
          OR: [
            { number: { contains: query.q, mode: "insensitive" as const } },
            { visit: { doctor: { name: { contains: query.q, mode: "insensitive" as const } } } }
          ]
        }
      : { visit: { patientId: userId } };

    const [total, data] = await Promise.all([
      this.prisma.billingInvoice.count({ where }),
      this.prisma.billingInvoice.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          visit: {
            select: {
              id: true,
              startedAt: true,
              patient: { select: { id: true, mrn: true, name: true } },
              doctor: { select: { id: true, code: true, name: true } }
            }
          },
          items: true
        }
      })
    ]);
    return { data, meta: { page, limit, total } };
  }

  async get(id: string) {
    const inv = await this.prisma.billingInvoice.findUnique({
      where: { id },
      include: {
        visit: {
          include: {
            patient: { select: { id: true, mrn: true, name: true } },
            doctor: { select: { id: true, code: true, name: true } }
          }
        },
        items: true
      }
    });
    if (!inv) throw new NotFoundException("Invoice not found");
    return inv;
  }

  async create(actorId: string | undefined, visitId: string, items?: InvoiceItemDto[]) {
    const visit = await this.prisma.visit.findUnique({ where: { id: visitId } });
    if (!visit) throw new NotFoundException("Visit not found");

    const existing = await this.prisma.billingInvoice.findUnique({ where: { visitId } });
    if (existing) throw new BadRequestException("Invoice already exists for this visit");

    const prepared = (items ?? []).map((i) => ({
      name: i.name,
      qty: i.qty,
      price: i.price,
      subtotal: i.qty * i.price
    }));
    const total = prepared.reduce((sum, i) => sum + i.subtotal, 0);

    const invoice = await this.prisma.billingInvoice.create({
      data: {
        visitId,
        number: makeNumber(),
        status: "UNPAID",
        total,
        items: prepared.length ? { create: prepared } : undefined
      },
      include: { items: true }
    });

    await this.audit.create({
      actorId,
      action: "create",
      entity: "BillingInvoice",
      entityId: invoice.id,
      metadata: { number: invoice.number, total: invoice.total }
    });
    return this.get(invoice.id);
  }

  async markPaid(actorId: string | undefined, id: string) {
    const invoice = await this.get(id);
    if (invoice.status === "PAID") return invoice;
    await this.prisma.billingInvoice.update({ where: { id }, data: { status: "PAID" } });
    await this.audit.create({ actorId, action: "paid", entity: "BillingInvoice", entityId: id });
    return this.get(id);
  }
}

