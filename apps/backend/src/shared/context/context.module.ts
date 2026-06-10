import { Global, Module } from "@nestjs/common";

import { HospitalContextService } from "./hospital-context.service";

@Global()
@Module({
  providers: [HospitalContextService],
  exports: [HospitalContextService]
})
export class ContextModule {}
