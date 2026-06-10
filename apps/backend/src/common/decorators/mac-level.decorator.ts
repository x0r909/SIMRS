import { SetMetadata } from "@nestjs/common";
import type { ConfidentialityLevel } from "@prisma/client";

import { MAC_LEVEL_KEY } from "../auth/mac.guard";

export const MacLevel = (level: ConfidentialityLevel) => SetMetadata(MAC_LEVEL_KEY, level);
