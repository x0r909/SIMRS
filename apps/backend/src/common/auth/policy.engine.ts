/**
 * @file policy.engine.ts
 * @path apps/backend/src/common/auth/policy.engine.ts
 * @description Mesin policy ABAC: hospital_scope, department_scope, dll.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Injectable } from "@nestjs/common";

export const ABAC_POLICY_KEY = "abac_policy";

type PolicyContext = {
  subject: {
    sub: string;
    roles: string[];
    hospitalId?: string | null;
    departmentId?: string | null;
  };
  resource: Record<string, unknown>;
  environment: { timestamp: Date; ip?: string };
};

@Injectable()
export class PolicyEngine {
  evaluate(policy: string, ctx: PolicyContext): boolean {
    switch (policy) {
      case "hospital_scope":
        if (ctx.subject.roles.includes("SYSTEM_ADMIN")) return true;
        if (!ctx.resource.hospitalId) return true;
        return ctx.subject.hospitalId === ctx.resource.hospitalId;

      case "department_scope":
        if (ctx.subject.roles.includes("SYSTEM_ADMIN") || ctx.subject.roles.includes("HOSPITAL_ADMIN")) {
          return true;
        }
        if (!ctx.resource.departmentId) return true;
        return ctx.subject.departmentId === ctx.resource.departmentId;

      case "doctor_patient":
        if (ctx.subject.roles.includes("SYSTEM_ADMIN") || ctx.subject.roles.includes("HOSPITAL_ADMIN")) {
          return true;
        }
        if (!ctx.subject.roles.includes("DOCTOR")) return true;
        return ctx.resource.assignedDoctorId === ctx.subject.sub || ctx.resource.doctorUserId === ctx.subject.sub;

      case "self_patient":
        if (!ctx.subject.roles.includes("PATIENT")) return true;
        return ctx.resource.patientUserId === ctx.subject.sub;

      default:
        return true;
    }
  }
}
