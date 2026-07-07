/**
 * @file abac-policy.decorator.ts
 * @path apps/backend/src/common/decorators/abac-policy.decorator.ts
 * @description Decorator NestJS custom untuk metadata handler.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { SetMetadata } from "@nestjs/common";

import { ABAC_POLICY_KEY } from "../auth/policy.engine";

export const AbacPolicy = (policy: string) => SetMetadata(ABAC_POLICY_KEY, policy);
