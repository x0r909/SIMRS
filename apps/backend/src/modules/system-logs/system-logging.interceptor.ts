import { randomUUID } from "node:crypto";

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor
} from "@nestjs/common";
import { LogLevel } from "@prisma/client";
import { Request, Response } from "express";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

import type { JwtPayload } from "../auth/types";

import { SystemLogsService } from "./system-logs.service";

type RequestWithUser = Request & { user?: JwtPayload; requestId?: string };

@Injectable()
export class SystemLoggingInterceptor implements NestInterceptor {
  private readonly skipPaths = ["/system-logs", "/health", "/metrics", "/docs"];

  constructor(private readonly systemLogs: SystemLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const res = context.switchToHttp().getResponse<Response>();
    const path = req.path ?? req.url;
    const started = Date.now();
    const requestId = randomUUID();
    req.requestId = requestId;
    res.setHeader("X-Request-Id", requestId);

    if (this.shouldSkip(path)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: () => {
          void this.writeLog(req, res.statusCode, Date.now() - started, requestId);
        },
        error: (error: { status?: number; message?: string }) => {
          const status = error?.status ?? 500;
          void this.writeLog(req, status, Date.now() - started, requestId, error?.message);
        }
      })
    );
  }

  private shouldSkip(path: string): boolean {
    return this.skipPaths.some((segment) => path.includes(segment));
  }

  private writeLog(
    req: RequestWithUser,
    statusCode: number,
    duration: number,
    requestId: string,
    errorMessage?: string
  ) {
    const level =
      statusCode >= 500 ? LogLevel.ERROR : statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    const user = req.user;
    const resource = `${req.method} ${req.originalUrl || req.path}`;

    void this.systemLogs
      .create({
        level,
        service: "api",
        context: resource,
        message: errorMessage ?? `${resource} → HTTP ${statusCode} (${duration}ms)`,
        requestId,
        metadata: {
          method: req.method,
          path: req.path,
          originalUrl: req.originalUrl,
          query: req.query,
          params: req.params,
          userAgent: req.get("user-agent"),
          referer: req.get("referer"),
          host: req.get("host"),
          protocol: req.protocol,
          userEmail: user?.email,
          userRoles: user?.roles,
          authenticated: Boolean(user?.sub),
          error: errorMessage
        },
        userId: user?.sub,
        ipAddress: this.getClientIp(req),
        duration,
        statusCode
      })
      .catch(() => undefined);
  }

  private getClientIp(req: Request): string {
    return (
      (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      req.ip ||
      "unknown"
    );
  }
}
