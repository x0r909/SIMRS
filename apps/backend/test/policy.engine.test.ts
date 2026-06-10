/**
 * Run with: npx tsx test/policy.engine.test.ts
 */
import assert from "node:assert/strict";

import { PolicyEngine } from "../src/common/auth/policy.engine";

const engine = new PolicyEngine();

assert.equal(
  engine.evaluate("hospital_scope", {
    subject: { sub: "1", roles: ["SYSTEM_ADMIN"], hospitalId: "h1" },
    resource: { hospitalId: "h2" },
    environment: { timestamp: new Date() }
  }),
  true
);

assert.equal(
  engine.evaluate("hospital_scope", {
    subject: { sub: "1", roles: ["RECEPTIONIST"], hospitalId: "h1" },
    resource: { hospitalId: "h2" },
    environment: { timestamp: new Date() }
  }),
  false
);

console.log("policy.engine tests passed");
