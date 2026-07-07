/**
 * @file mac-level.decorator.ts
 * @path apps/backend/src/common/decorators/mac-level.decorator.ts
 * @description Decorator NestJS custom untuk metadata handler.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { SetMetadata } from "@nestjs/common";
import type { ConfidentialityLevel } from "@prisma/client";

import { MAC_LEVEL_KEY } from "../auth/mac.guard";

export const MacLevel = (level: ConfidentialityLevel) => SetMetadata(MAC_LEVEL_KEY, level);
