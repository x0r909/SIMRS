import { Controller, Get, Query, Sse, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { map, Observable } from "rxjs";

import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { PermissionsGuard } from "../../common/auth/permissions.guard";

import { ListSystemLogsQueryDto } from "./dto/list-system-logs-query.dto";
import { SystemLogsService } from "./system-logs.service";

@ApiTags("system-logs")
@Controller("system-logs")
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions("system-logs.read")
export class SystemLogsController {
  constructor(private readonly systemLogs: SystemLogsService) {}

  @Get()
  list(@Query() query: ListSystemLogsQueryDto) {
    return this.systemLogs.list(query);
  }

  @Get("stats")
  stats() {
    return this.systemLogs.stats();
  }

  @Sse("stream")
  stream(): Observable<MessageEvent> {
    return this.systemLogs.stream().pipe(
      map((log) => ({ data: log }) as MessageEvent)
    );
  }
}
