/**
 * @file current-user.decorator.ts
 * @path apps/backend/src/common/auth/current-user.decorator.ts
 * @description Decorator @CurrentUser untuk inject payload JWT.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const CurrentUser = createParamDecorator((field: string | undefined, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();
  const user = req.user;
  if (!field) return user;
  return user?.[field];
});

