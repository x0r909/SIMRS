import { SetMetadata } from "@nestjs/common";

import { ABAC_POLICY_KEY } from "../auth/policy.engine";

export const AbacPolicy = (policy: string) => SetMetadata(ABAC_POLICY_KEY, policy);
