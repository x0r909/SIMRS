import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, AuditAction } from "@prisma/client";

import { PaginationQueryDto, toSkipTake } from "../../common/pagination/pagination";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";

import { CreateMedicineDto } from "./dto/create-medicine.dto";
import { UpdateMedicineDto } from "./dto/update-medicine.dto";

@Injectable()
export class MedicinesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogsService
  ) {}

  async list(query: PaginationQueryDto) {
    const { skip, take, page, limit } = toSkipTake(query.page, query.limit);
    const where: any = query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: "insensitive" as const } },
            { sku: { contains: query.q, mode: "insensitive" as const } }
          ]
        }
      : {};
    const [total, data] = await Promise.all([
      this.prisma.medicine.count({ where }),
      this.prisma.medicine.findMany({ where, skip, take, orderBy: { createdAt: "desc" } })
    ]);
    return { data, meta: { page, limit, total } };
  }

  async get(id: string) {
    const med = await this.prisma.medicine.findUnique({ where: { id } });
    if (!med) throw new NotFoundException("Medicine not found");
    return med;
  }

  async create(actorId: string | undefined, input: CreateMedicineDto) {
    const med = await this.prisma.medicine.create({
      data: {
        sku: input.sku,
        name: input.name,
        unit: input.unit ?? "tablet",
        stock: Number(input.stock ?? 0),
        price: Number(input.price ?? 0)
      }
    });
    await this.audit.create({ actorId, action: AuditAction.MEDICINE_STOCK_ADD, entity: "Medicine", entityId: med.id });
    return med;
  }

  async update(actorId: string | undefined, id: string, input: UpdateMedicineDto) {
    await this.get(id);
    const med = await this.prisma.medicine.update({
      where: { id },
      data: {
        sku: input.sku,
        name: input.name,
        unit: input.unit,
        stock: input.stock !== undefined ? Number(input.stock) : undefined,
        price: input.price !== undefined ? Number(input.price) : undefined
      }
    });
    await this.audit.create({ actorId, action: AuditAction.MEDICINE_STOCK_UPDATE, entity: "Medicine", entityId: id });
    return med;
  }

  async remove(actorId: string | undefined, id: string) {
    await this.get(id);
    await this.prisma.medicine.delete({ where: { id } });
    await this.audit.create({ actorId, action: AuditAction.OTHER, entity: "Medicine", entityId: id });
    return { id };
  }
}

