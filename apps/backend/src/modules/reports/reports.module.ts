import { Module } from "@nestjs/common";

import { HealthModule } from "../health/health.module";

import { ReportsController } from "./reports.controller";
import { ReportsService } from "./reports.service";

@Module({
  imports: [HealthModule],
  controllers: [ReportsController],
  providers: [ReportsService]
})
export class ReportsModule {}
