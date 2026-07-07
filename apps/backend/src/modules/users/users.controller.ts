/**
 * @file users.controller.ts
 * @path apps/backend/src/modules/users/users.controller.ts
 * @description Controller REST API users: endpoint HTTP. Manajemen pengguna staff: CRUD user, assignment role & departemen.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { PermissionsGuard } from "../../common/auth/permissions.guard";

import type { JwtPayload } from "../auth/types";

import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersService } from "./users.service";

@ApiTags("users")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @RequirePermissions("users.read")
  @Get()
  list(@CurrentUser() actor: JwtPayload) {
    return this.users.list(actor);
  }

  @RequirePermissions("users.read")
  @Get("assignable-roles")
  assignableRoles() {
    return this.users.listAssignableRoles();
  }

  @RequirePermissions("users.read")
  @Get(":id")
  get(@Param("id") id: string) {
    return this.users.get(id);
  }

  @RequirePermissions("users.write")
  @Post()
  create(@CurrentUser() actor: JwtPayload, @Body() dto: CreateUserDto) {
    return this.users.create(actor.sub, dto, actor);
  }

  @RequirePermissions("users.write")
  @Put(":id")
  update(@CurrentUser() actor: JwtPayload, @Param("id") id: string, @Body() dto: UpdateUserDto) {
    return this.users.update(actor.sub, id, dto, actor);
  }

  @RequirePermissions("users.write")
  @Delete(":id")
  remove(@CurrentUser() actor: JwtPayload, @Param("id") id: string) {
    return this.users.remove(actor.sub, id, actor);
  }
}

