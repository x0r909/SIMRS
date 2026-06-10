import {
  BadRequestException,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { AuditAction, AuditModule, AuditStatus } from "@prisma/client";
import bcrypt from "bcrypt";

import { HospitalContextService } from "../../shared/context/hospital-context.service";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { CaptchaService } from "../captcha/captcha.service";
import { SystemSettingsService } from "../system-settings/system-settings.service";

import {
  assertLoginAudience,
  type LoginAudience
} from "./auth-role.util";
import { MfaService } from "./mfa.service";
import { SessionService } from "./session.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import type { JwtPayload } from "./types";

type RegisterPatientInput = {
  email: string;
  password: string;
  name: string;
  captchaId: string;
  captchaAnswer: string;
  phone?: string;
  address?: string;
  birthDate?: string;
};

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly captcha: CaptchaService,
    private readonly auditLogs: AuditLogsService,
    private readonly sessions: SessionService,
    private readonly mfa: MfaService,
    private readonly hospitalContext: HospitalContextService,
    private readonly systemSettings: SystemSettingsService
  ) {}

  private generateMrn() {
    const stamp = new Date().toISOString().slice(2, 10).replace(/-/g, "");
    const suffix = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    return `MRN-${stamp}-${suffix}`;
  }

  private async buildUserAuthState(userId: string, jti?: string) {
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
      payload: {
        sub: user.id,
        email: user.email,
        roles,
        permissions,
        hospitalId: user.hospitalId,
        departmentId: user.departmentId,
        jti
      } as JwtPayload
    };
  }

  async login(
    email: string,
    password: string,
    meta?: { ip?: string; userAgent?: string },
    audience: LoginAudience = "staff"
  ) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      await this.auditLogs.create({
        action: AuditAction.LOGIN_FAILED,
        module: AuditModule.AUTH,
        entity: "User",
        status: AuditStatus.FAILED,
        description: `Failed login attempt for email: ${email}`,
        metadata: { email, reason: "User not found" }
      });
      throw new UnauthorizedException("Invalid credentials");
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException("Account temporarily locked. Try again later.");
    }

    if (user.status !== "ACTIVE") {
      await this.auditLogs.create({
        action: AuditAction.LOGIN_FAILED,
        module: AuditModule.AUTH,
        entity: "User",
        status: AuditStatus.FAILED,
        description: `Login attempt for disabled user: ${email}`,
        actorId: user.id,
        metadata: { email, reason: "User disabled" }
      });
      throw new UnauthorizedException("User disabled");
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      const attempts = user.failedLoginAttempts + 1;
      const updateData: { failedLoginAttempts: number; lockedUntil?: Date } = { failedLoginAttempts: attempts };
      if (attempts >= MAX_FAILED_ATTEMPTS) {
        updateData.lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
      }
      await this.prisma.user.update({ where: { id: user.id }, data: updateData });

      await this.auditLogs.create({
        action: AuditAction.LOGIN_FAILED,
        module: AuditModule.AUTH,
        entity: "User",
        status: AuditStatus.FAILED,
        description: `Failed login for user: ${email}`,
        actorId: user.id,
        metadata: { email, reason: "Invalid password", attempts }
      });
      throw new UnauthorizedException("Invalid credentials");
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() }
    });

    const jti = this.sessions.generateJti();
    const { payload, roles, permissions, user: authUser } = await this.buildUserAuthState(user.id, jti);

    try {
      assertLoginAudience(roles, audience);
    } catch (error) {
      const patientOnlyViolation =
        error instanceof Error && error.message === "STAFF_LOGIN_REQUIRED";

      await this.auditLogs.create({
        action: AuditAction.LOGIN_FAILED,
        module: AuditModule.AUTH,
        entity: "User",
        status: AuditStatus.FAILED,
        description: `Login rejected (${audience}): ${email}`,
        actorId: user.id,
        metadata: {
          email,
          audience,
          roles,
          reason: patientOnlyViolation
            ? "Patient account used staff login"
            : "Non-patient account used patient login"
        }
      });

      if (patientOnlyViolation) {
        throw new UnauthorizedException(
          "Akun pasien tidak dapat login di portal staff. Gunakan login pasien."
        );
      }
      throw new UnauthorizedException(
        "Akun ini bukan akun pasien. Silakan gunakan login staff."
      );
    }

    await this.systemSettings.assertLoginAllowedDuringMaintenance(roles, audience);

    const accessTtl = Number(this.config.get("JWT_ACCESS_TTL_SECONDS", 900));
    const refreshTtl = Number(this.config.get("JWT_REFRESH_TTL_SECONDS", 604800));

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>("JWT_ACCESS_SECRET"),
      expiresIn: accessTtl
    });

    const refreshToken = this.sessions.generateRefreshToken();
    await this.sessions.createSession(user.id, refreshToken, {
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent
    });

    await this.auditLogs.create({
      action: AuditAction.LOGIN,
      module: AuditModule.AUTH,
      entity: "User",
      status: AuditStatus.SUCCESS,
      description: `User logged in (${audience}): ${email}`,
      actorId: user.id,
      hospitalId: user.hospitalId ?? undefined,
      metadata: { email, name: authUser.name, roles, audience }
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
        permissions,
        hospitalId: authUser.hospitalId,
        departmentId: authUser.departmentId,
        mfaEnabled: authUser.mfaEnabled
      }
    };
  }

  async registerPatient(input: RegisterPatientInput) {
    const registrationAllowed = await this.systemSettings.isPatientRegistrationAllowed();
    if (!registrationAllowed) {
      const publicSettings = await this.systemSettings.getPublicSettings();
      const message =
        publicSettings.maintenanceMessage ||
        "Registrasi pasien sedang ditutup. Silakan hubungi rumah sakit.";
      throw new BadRequestException(message);
    }

    const isCaptchaValid = this.captcha.verifyCaptcha(input.captchaId, input.captchaAnswer);
    if (!isCaptchaValid) {
      throw new BadRequestException("Captcha tidak valid atau sudah kadaluarsa");
    }

    const email = input.email.trim().toLowerCase();
    const name = input.name.trim();
    const phone = input.phone?.trim() || undefined;
    const address = input.address?.trim() || undefined;

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new BadRequestException("Email sudah terdaftar");

    const patientRole = await this.prisma.role.findUnique({
      where: { key: "PATIENT" },
      select: { id: true }
    });
    if (!patientRole) throw new BadRequestException("Patient role is not configured");

    const hospitalId = this.hospitalContext.getDefaultHospitalId();
    const passwordHash = await bcrypt.hash(input.password, 12);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name,
          passwordHash,
          status: "ACTIVE",
          hospitalId
        }
      });

      await tx.userRole.create({ data: { userId: user.id, roleId: patientRole.id } });

      let patientMrn = this.generateMrn();
      let patient = null;

      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          patient = await tx.patient.create({
            data: {
              userId: user.id,
              mrn: patientMrn,
              name,
              phone,
              address,
              birthDate: input.birthDate ? new Date(input.birthDate) : undefined,
              hospitalId
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
          action: AuditAction.PATIENT_REGISTER,
          module: AuditModule.PATIENT,
          entity: "Patient",
          entityId: patient.id,
          status: AuditStatus.SUCCESS,
          hospitalId,
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
    const userId = await this.sessions.validateRefreshToken(refreshToken);
    const jti = this.sessions.generateJti();
    const { payload } = await this.buildUserAuthState(userId, jti);
    const accessTtl = Number(this.config.get("JWT_ACCESS_TTL_SECONDS", 900));

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>("JWT_ACCESS_SECRET"),
      expiresIn: accessTtl
    });

    return { accessToken, refreshToken };
  }

  async logout(accessTokenJti: string | undefined, refreshToken?: string, ttlSeconds = 900) {
    if (accessTokenJti) {
      await this.sessions.blacklistJti(accessTokenJti, ttlSeconds);
    }
    if (refreshToken) {
      await this.sessions.revokeByRefreshToken(refreshToken);
    }
    return { message: "Logged out" };
  }

  async me(userId: string) {
    const { user, roles, permissions } = await this.buildUserAuthState(userId);

    const [hospital, department] = await Promise.all([
      user.hospitalId
        ? this.prisma.hospital.findUnique({
            where: { id: user.hospitalId },
            select: { id: true, code: true, name: true }
          })
        : null,
      user.departmentId
        ? this.prisma.department.findUnique({
            where: { id: user.departmentId },
            select: { id: true, code: true, name: true }
          })
        : null
    ]);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      roles,
      permissions,
      hospitalId: user.hospitalId,
      departmentId: user.departmentId,
      hospital,
      department,
      avatarUrl: user.avatarUrl,
      mfaEnabled: user.mfaEnabled,
      lastLoginAt: user.lastLoginAt
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    if (dto.password) {
      if (!dto.currentPassword) {
        throw new BadRequestException("Password saat ini wajib diisi untuk mengganti password");
      }
      const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
      if (!valid) {
        throw new BadRequestException("Password saat ini tidak sesuai");
      }
    }

    if (dto.email && dto.email.trim().toLowerCase() !== user.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email.trim().toLowerCase() }
      });
      if (existing && existing.id !== userId) {
        throw new BadRequestException("Email sudah digunakan akun lain");
      }
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.email !== undefined ? { email: dto.email.trim().toLowerCase() } : {}),
        ...(dto.password ? { passwordHash: await bcrypt.hash(dto.password, 12) } : {})
      }
    });

    await this.auditLogs.create({
      actorId: userId,
      action: AuditAction.USER_UPDATE,
      module: AuditModule.AUTH,
      entity: "User",
      entityId: userId,
      status: AuditStatus.SUCCESS,
      description: "Profil pengguna diperbarui",
      metadata: {
        fields: [
          ...(dto.name !== undefined ? ["name"] : []),
          ...(dto.email !== undefined ? ["email"] : []),
          ...(dto.password ? ["password"] : [])
        ]
      }
    });

    return this.me(userId);
  }

  async enableMfa(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    const secret = this.mfa.generateSecret();
    await this.prisma.user.update({ where: { id: userId }, data: { mfaSecret: secret } });
    return {
      secret,
      otpAuthUrl: this.mfa.generateOtpAuthUrl(user.email, secret)
    };
  }

  async verifyAndEnableMfa(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.mfaSecret) throw new BadRequestException("MFA not initialized");
    if (!this.mfa.verifyToken(user.mfaSecret, token)) {
      throw new BadRequestException("Invalid MFA token");
    }
    await this.prisma.user.update({ where: { id: userId }, data: { mfaEnabled: true } });
    await this.auditLogs.create({
      actorId: userId,
      action: AuditAction.MFA_ENABLE,
      module: AuditModule.AUTH,
      entity: "User",
      entityId: userId
    });
    return { mfaEnabled: true };
  }

  async verifyMfa(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.mfaSecret || !user.mfaEnabled) throw new BadRequestException("MFA not enabled");
    if (!this.mfa.verifyToken(user.mfaSecret, token)) {
      throw new UnauthorizedException("Invalid MFA token");
    }
    return { verified: true };
  }

  async listSessions(userId: string) {
    return this.sessions.listUserSessions(userId);
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.userSession.findFirst({
      where: { id: sessionId, userId }
    });
    if (!session) throw new BadRequestException("Session not found");
    await this.sessions.revokeSession(session.id, session.refreshToken);
    return { revoked: true };
  }

  async forceLogoutUser(actorId: string, targetUserId: string) {
    await this.sessions.forceLogoutUser(targetUserId);
    await this.auditLogs.create({
      actorId,
      action: AuditAction.FORCE_LOGOUT,
      module: AuditModule.AUTH,
      entity: "User",
      entityId: targetUserId
    });
    return { success: true };
  }
}
