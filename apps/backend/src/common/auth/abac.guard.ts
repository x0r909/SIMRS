import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { ABAC_POLICY_KEY, PolicyEngine } from "./policy.engine";

@Injectable()
export class AbacGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly policyEngine: PolicyEngine
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const policy = this.reflector.getAllAndOverride<string | undefined>(ABAC_POLICY_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    if (!policy) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resource = request.resource ?? {};

    const allowed = this.policyEngine.evaluate(policy, {
      subject: user,
      resource,
      environment: { timestamp: new Date(), ip: request.ip }
    });

    if (!allowed) throw new ForbiddenException("ABAC policy denied access");
    return true;
  }
}
