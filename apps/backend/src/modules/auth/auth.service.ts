import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcrypt";

import { PrismaService } from "../../shared/prisma/prisma.service";

import type { JwtPayload } from "./types";

type RegisterPatientInput = {
  email: string;
  password: string;
  name: string;
  phone?: string;
  address?: string;
  birthDate?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService
  ) {}

  private generateMrn() {
    const stamp = new Date().toISOString().slice(2, 10).replace(/-/g, "");
    const suffix = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    return `MRN${stamp}${suffix}`;
  }

  private async buildUserAuthState(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: { permissions: { include: { permission: true } } }
            }
          }
        }
      }
    });
    if (!user) throw new UnauthorizedException("Invalid token");
    if (user.status !== "ACTIVE") throw new UnauthorizedException("User disabled");

    const roles = user.roles.map((r) => r.role.key);
    const permissions = Array.from(
      new Set(user.roles.flatMap((r) => r.role.permissions.map((rp) => rp.permission.key)))
    );

    return {
      user,
      roles,
      permissions,
      payload: { sub: user.id, email: user.email, roles, permissions } as JwtPayload
    };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException("Invalid credentials");
    if (user.status !== "ACTIVE") throw new UnauthorizedException("User disabled");

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Invalid credentials");

    const { payload, roles, permissions, user: authUser } = await this.buildUserAuthState(user.id);
    const accessTtl = Number(this.config.get("JWT_ACCESS_TTL_SECONDS", 900));
    const refreshTtl = Number(this.config.get("JWT_REFRESH_TTL_SECONDS", 604800));

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>("JWT_ACCESS_SECRET"),
      expiresIn: accessTtl
    });
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>("JWT_REFRESH_SECRET"),
      expiresIn: refreshTtl
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: authUser.id,
        email: authUser.email,
        name: authUser.name,
        status: authUser.status,
        roles,
        permissions
      }
    };
  }

  async registerPatient(input: RegisterPatientInput) {
    const existingUser = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existingUser) throw new BadRequestException("Email already registered");

    const patientRole = await this.prisma.role.findUnique({
      where: { key: "patient" },
      select: { id: true }
    });
    if (!patientRole) throw new BadRequestException("Patient role is not configured");

    const passwordHash = await bcrypt.hash(input.password, 12);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: input.email,
          name: input.name,
          passwordHash,
          status: "ACTIVE"
        }
      });

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: patientRole.id
        }
      });

      let patientMrn = this.generateMrn();
      let patient = null as Awaited<ReturnType<typeof tx.patient.create>> | null;

      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          patient = await tx.patient.create({
            data: {
              id: user.id,
              mrn: patientMrn,
              name: input.name,
              phone: input.phone,
              address: input.address,
              birthDate: input.birthDate ? new Date(input.birthDate) : undefined
            }
          });
          break;
        } catch {
          patientMrn = this.generateMrn();
        }
      }

      if (!patient) throw new BadRequestException("Failed to generate patient MRN");

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "register",
          entity: "Patient",
          entityId: patient.id,
          metadata: { email: user.email, mrn: patient.mrn }
        }
      });

      return { user, patient };
    });

    return {
      message: "Registrasi berhasil. Silakan login untuk melanjutkan.",
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        status: result.user.status
      },
      patient: {
        id: result.patient.id,
        mrn: result.patient.mrn,
        name: result.patient.name,
        phone: result.patient.phone,
        address: result.patient.address,
        birthDate: result.patient.birthDate,
        createdAt: result.patient.createdAt
      }
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = (await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.getOrThrow<string>("JWT_REFRESH_SECRET")
      })) as JwtPayload;

      const { payload: nextPayload } = await this.buildUserAuthState(payload.sub);
      const accessTtl = Number(this.config.get("JWT_ACCESS_TTL_SECONDS", 900));
      const refreshTtl = Number(this.config.get("JWT_REFRESH_TTL_SECONDS", 604800));

      const accessToken = await this.jwt.signAsync(nextPayload, {
        secret: this.config.getOrThrow<string>("JWT_ACCESS_SECRET"),
        expiresIn: accessTtl
      });
      const nextRefreshToken = await this.jwt.signAsync(nextPayload, {
        secret: this.config.getOrThrow<string>("JWT_REFRESH_SECRET"),
        expiresIn: refreshTtl
      });

      return { accessToken, refreshToken: nextRefreshToken };
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  async me(userId: string) {
    const { user, roles, permissions } = await this.buildUserAuthState(userId);
    return { id: user.id, email: user.email, name: user.name, status: user.status, roles, permissions };
  }
}

