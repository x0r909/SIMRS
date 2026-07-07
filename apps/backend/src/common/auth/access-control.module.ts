/**
 * @file access-control.module.ts
 * @path apps/backend/src/common/auth/access-control.module.ts
 * @description Modul global access control: policy engine & guards.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Global, Module } from "@nestjs/common";

import { AbacGuard } from "./abac.guard";
import { MacGuard } from "./mac.guard";
import { PolicyEngine } from "./policy.engine";

@Global()
@Module({
  providers: [PolicyEngine, AbacGuard, MacGuard],
  exports: [PolicyEngine, AbacGuard, MacGuard]
})
export class AccessControlModule {}
