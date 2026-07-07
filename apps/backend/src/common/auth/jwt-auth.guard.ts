/**
 * @file jwt-auth.guard.ts
 * @path apps/backend/src/common/auth/jwt-auth.guard.ts
 * @description Guard JWT: validasi bearer token pada request.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {}

