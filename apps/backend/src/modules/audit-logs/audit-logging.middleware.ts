/**
 * @file audit-logging.middleware.ts
 * @path apps/backend/src/modules/audit-logs/audit-logging.middleware.ts
 * @description Kode backend modul audit-logs.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import {
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuditService } from './audit.service';
import { AuditModule, AuditAction, AuditStatus } from '@prisma/client';

// Type assertion for user object in request
type RequestWithUser = Request & {
  user?: {
    id: string;
    email: string;
    name: string;
  };
};

@Injectable()
export class AuditLoggingMiddleware implements NestMiddleware {
  constructor(private readonly auditService: AuditService) {}

  use(req: RequestWithUser, res: Response, next: NextFunction) {
    const self = this;
    console.log(`[MIDDLEWARE] Request: ${req.method} ${req.path}`);

    // Override json method - most NestJS endpoints use res.json()
    const originalJson = res.json.bind(res);
    res.json = function (data: any) {
      const statusCode = res.statusCode;
      console.log(`[MIDDLEWARE] JSON called for ${req.method} ${req.path}, status: ${statusCode}`);
      
      // Check if should log
      if (req.method !== 'GET' && !req.path.includes('/audit-logs')) {
        console.log(`[MIDDLEWARE] Should log activity for ${req.method} ${req.path}`);
        self.logActivity(req, statusCode, data);
      }

      return originalJson(data);
    };

    // Also override send for compatibility
    const originalSend = res.send.bind(res);
    res.send = function (data: any) {
      const statusCode = res.statusCode;
      
      // Check if should log
      if (req.method !== 'GET' && !req.path.includes('/audit-logs')) {
        self.logActivity(req, statusCode, data);
      }

      return originalSend(data);
    };

    next();
  }

  private logActivity(req: RequestWithUser, statusCode: number, responseData: any) {
    try {
      // For login endpoint, extract userId dari response token atau email dari body
      let userId = req.user?.id;
      
      // Try to extract email from request body for login/register
      if (!userId && req.path.includes('/auth')) {
        const email = (req.body as any)?.email;
        if (email) {
          // We'll use email as identifier, but better to get actual user ID
          userId = email;
        }
      }

      const ip = this.getClientIp(req);
      const userAgent = req.get('user-agent');

      const { module, action, entity, entityId, description } =
        this.parseRoute(req.path, req.method);

      const status =
        statusCode >= 400 ? AuditStatus.ERROR : AuditStatus.SUCCESS;

      console.log(`[AUDIT] ${req.method} ${req.path} - ${action} - User: ${userId}`);

      // Log to audit service without blocking the response
      this.auditService.createLog({
        action,
        module,
        entity,
        entityId,
        description,
        status,
        ip,
        userAgent,
        actorId: userId,
        metadata: {
          method: req.method,
          path: req.path,
          statusCode,
          query: req.query,
          body: this.sanitizeBody(req.body),
        },
      });
    } catch (error) {
      console.error('Error in audit logging middleware:', error);
      // Don't throw - middleware should not break the main request
    }
  }

  private parseRoute(
    path: string,
    method: string,
  ): {
    module: AuditModule;
    action: AuditAction;
    entity: string;
    entityId?: string;
    description?: string;
  } {
    // Auth routes
    if (path.includes('/auth/login')) {
      return {
        module: AuditModule.AUTH,
        action: AuditAction.LOGIN,
        entity: 'User',
        description: 'User login',
      };
    }
    if (path.includes('/auth/register-patient')) {
      return {
        module: AuditModule.AUTH,
        action: AuditAction.PATIENT_CREATE,
        entity: 'Patient',
        description: 'Patient registered',
      };
    }
    if (path.includes('/auth/logout')) {
      return {
        module: AuditModule.AUTH,
        action: AuditAction.LOGOUT,
        entity: 'User',
        description: 'User logout',
      };
    }
    if (path.includes('/auth/change-password')) {
      return {
        module: AuditModule.AUTH,
        action: AuditAction.CHANGE_PASSWORD,
        entity: 'User',
        description: 'User changed password',
      };
    }

    // User management
    if (path.includes('/users')) {
      if (method === 'POST') {
        return {
          module: AuditModule.USER_MANAGEMENT,
          action: AuditAction.USER_CREATE,
          entity: 'User',
          description: 'User created',
        };
      }
      if (method === 'PUT' || method === 'PATCH') {
        const userId = this.extractId(path);
        return {
          module: AuditModule.USER_MANAGEMENT,
          action: AuditAction.USER_UPDATE,
          entity: 'User',
          entityId: userId,
          description: 'User updated',
        };
      }
      if (method === 'DELETE') {
        const userId = this.extractId(path);
        return {
          module: AuditModule.USER_MANAGEMENT,
          action: AuditAction.USER_DELETE,
          entity: 'User',
          entityId: userId,
          description: 'User deleted',
        };
      }
    }

    // Patient management
    if (path.includes('/patients')) {
      if (method === 'POST') {
        return {
          module: AuditModule.PATIENT,
          action: AuditAction.PATIENT_CREATE,
          entity: 'Patient',
          description: 'Patient created',
        };
      }
      if (method === 'PUT' || method === 'PATCH') {
        const patientId = this.extractId(path);
        return {
          module: AuditModule.PATIENT,
          action: AuditAction.PATIENT_UPDATE,
          entity: 'Patient',
          entityId: patientId,
          description: 'Patient updated',
        };
      }
      if (method === 'DELETE') {
        const patientId = this.extractId(path);
        return {
          module: AuditModule.PATIENT,
          action: AuditAction.PATIENT_DELETE,
          entity: 'Patient',
          entityId: patientId,
          description: 'Patient deleted',
        };
      }
    }

    // Appointments
    if (path.includes('/appointments')) {
      if (method === 'POST') {
        return {
          module: AuditModule.APPOINTMENT,
          action: AuditAction.APPOINTMENT_BOOK,
          entity: 'Appointment',
          description: 'Appointment booked',
        };
      }
      if (method === 'PUT' || method === 'PATCH') {
        const appointmentId = this.extractId(path);
        return {
          module: AuditModule.APPOINTMENT,
          action: AuditAction.APPOINTMENT_RESCHEDULE,
          entity: 'Appointment',
          entityId: appointmentId,
          description: 'Appointment rescheduled',
        };
      }
      if (path.includes('/cancel')) {
        const appointmentId = this.extractId(path);
        return {
          module: AuditModule.APPOINTMENT,
          action: AuditAction.APPOINTMENT_CANCEL,
          entity: 'Appointment',
          entityId: appointmentId,
          description: 'Appointment cancelled',
        };
      }
    }

    // Medical Records
    if (path.includes('/visits') || path.includes('/medical-records')) {
      if (method === 'POST' && path.includes('/diagnosis')) {
        return {
          module: AuditModule.MEDICAL_RECORD,
          action: AuditAction.DIAGNOSIS_ADD,
          entity: 'Diagnosis',
          description: 'Diagnosis added',
        };
      }
      if (method === 'PUT' || method === 'PATCH') {
        return {
          module: AuditModule.MEDICAL_RECORD,
          action: AuditAction.MEDICAL_RECORD_UPDATE,
          entity: 'MedicalRecord',
          description: 'Medical record updated',
        };
      }
    }

    // Pharmacy
    if (path.includes('/medicines')) {
      if (method === 'POST') {
        return {
          module: AuditModule.PHARMACY,
          action: AuditAction.MEDICINE_STOCK_ADD,
          entity: 'Medicine',
          description: 'Medicine stock added',
        };
      }
      if (method === 'PUT' || method === 'PATCH') {
        return {
          module: AuditModule.PHARMACY,
          action: AuditAction.MEDICINE_STOCK_UPDATE,
          entity: 'Medicine',
          description: 'Medicine stock updated',
        };
      }
    }

    // Default
    return {
      module: AuditModule.OTHER,
      action: AuditAction.OTHER,
      entity: path.split('/')[1] || 'Unknown',
      description: `${method} request to ${path}`,
    };
  }

  private extractId(path: string): string | undefined {
    const parts = path.split('/');
    return parts[parts.length - 1]?.match(/^[a-z0-9]+$/i)
      ? parts[parts.length - 1]
      : undefined;
  }

  private sanitizeBody(body: any): any {
    if (!body) return undefined;

    const sanitized = { ...body };
    const sensitiveFields = [
      'password',
      'passwordHash',
      'token',
      'refreshToken',
      'creditCard',
      'ssn',
    ];

    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    });

    return sanitized;
  }

  private getClientIp(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }
}
