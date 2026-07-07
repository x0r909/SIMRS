/**
 * @file global-exception.filter.ts
 * @path apps/backend/src/common/http/global-exception.filter.ts
 * @description Filter exception global: format error response konsisten.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { Request, Response } from "express";

function normalizeMessage(payload: unknown, fallback: string): string {
  if (typeof payload === "string") return payload;
  if (Array.isArray(payload)) return payload.join(", ");
  if (payload && typeof payload === "object" && "message" in payload) {
    const value = (payload as { message?: unknown }).message;
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return value.join(", ");
  }
  return fallback;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";
    let code: string | undefined;
    let maintenanceScope: string | undefined;
    let maintenanceEndsAt: string | null | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();
      message = normalizeMessage(response, exception.message);
      if (response && typeof response === "object" && !Array.isArray(response)) {
        const payload = response as Record<string, unknown>;
        if (typeof payload.code === "string") code = payload.code;
        if (typeof payload.scope === "string") maintenanceScope = payload.scope;
        if (payload.endsAt !== undefined) {
          maintenanceEndsAt =
            payload.endsAt === null ? null : String(payload.endsAt);
        }
      }
    } else if (exception instanceof Error && "code" in exception) {
      status = HttpStatus.BAD_REQUEST;
      const code = (exception as any).code;
      if (code === "P2002") message = "Unique constraint failed";
      else if (code === "P2025") message = "Record not found";
      else message = exception.message;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    res.status(status).json({
      success: false,
      error: {
        status,
        message,
        ...(code ? { code } : {}),
        ...(maintenanceScope ? { scope: maintenanceScope } : {}),
        ...(maintenanceEndsAt !== undefined ? { endsAt: maintenanceEndsAt } : {}),
        path: req.url,
        timestamp: new Date().toISOString()
      }
    });
  }
}

