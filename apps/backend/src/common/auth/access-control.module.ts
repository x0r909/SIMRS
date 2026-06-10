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
