import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { PermissionsGuard } from "../../common/auth/permissions.guard";
import { PaginationQueryDto } from "../../common/pagination/pagination";

import { BillingService } from "./billing.service";
import { CreateInvoiceDto } from "./dto/create-invoice.dto";

@ApiTags("billing")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("billing")
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @RequirePermissions("billing.read")
  @Get()
  async list(@Query() query: PaginationQueryDto) {
    const result = await this.billing.list(query);
    return { success: true, data: result.data, meta: result.meta };
  }

  @RequirePermissions("billing.read")
  @Get("me")
  async listMine(@CurrentUser("sub") userId: string, @Query() query: PaginationQueryDto) {
    const result = await this.billing.listMine(userId, query);
    return { success: true, data: result.data, meta: result.meta };
  }

  @RequirePermissions("billing.read")
  @Get(":id")
  get(@Param("id") id: string) {
    return this.billing.get(id);
  }

  @RequirePermissions("billing.write")
  @Post("invoices")
  create(@CurrentUser("sub") actorId: string, @Body() dto: CreateInvoiceDto) {
    return this.billing.create(actorId, dto.visitId, dto.items);
  }

  @RequirePermissions("billing.write")
  @Put("invoices/:id/paid")
  markPaid(@CurrentUser("sub") actorId: string, @Param("id") id: string) {
    return this.billing.markPaid(actorId, id);
  }
}

