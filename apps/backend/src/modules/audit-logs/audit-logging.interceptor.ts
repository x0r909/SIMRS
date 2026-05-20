import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { AuditService } from './audit.service';
import { AuditModule, AuditAction, AuditStatus } from '@prisma/client';

type RequestWithUser = Request & {
  user?: {
    id: string;
    email: string;
    name: string;
  };
};

@Injectable()
export class AuditLoggingInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const res = context.switchToHttp().getResponse<Response>();

    const { method, path, user, body } = req;

    console.log(`[AUDIT INTERCEPTOR] Request: ${method} ${path}`);

    return next.handle().pipe(
      tap(
        (data) => {
          const statusCode = res.statusCode;
          console.log(
            `[AUDIT INTERCEPTOR] Response: ${method} ${path} - Status: ${statusCode}`,
          );

          // Only log non-GET requests, excluding audit-logs endpoints
          if (method !== 'GET' && !path.includes('/audit-logs')) {
            this.logActivity(req, statusCode, data);
          }
        },
        (error) => {
          const statusCode = error?.status || 500;
          console.log(
            `[AUDIT INTERCEPTOR] Error: ${method} ${path} - Status: ${statusCode}`,
          );

          // Log error activities
          if (method !== 'GET' && !path.includes('/audit-logs')) {
            this.logActivity(req, statusCode, null, error);
          }
        },
      ),
    );
  }

  private logActivity(
    req: RequestWithUser,
    statusCode: number,
    responseData: any,
    error?: any,
  ) {
    try {
      // Only set userId if user is authenticated (from JWT token)
      const userId = req.user?.id;

      const ip = this.getClientIp(req);
      const userAgent = req.get('user-agent');

      const { module, action, entity, entityId, description } =
        this.parseRoute(req.path, req.method);

      const status =
        statusCode >= 400 ? AuditStatus.ERROR : AuditStatus.SUCCESS;

      console.log(
        `[AUDIT INTERCEPTOR] Logging activity: ${action} - User: ${userId || 'anonymous'} - Status: ${status}`,
      );

      // Log to audit service
      this.auditService.createLog({
        action,
        module,
        entity,
        entityId,
        description,
        status,
        ip,
        userAgent,
        actorId: userId, // Will be undefined if not authenticated
        metadata: {
          method: req.method,
          path: req.path,
          statusCode,
          query: req.query,
          body: this.sanitizeBody(req.body),
          error: error?.message,
        },
      });
    } catch (err) {
      console.error('Error in audit logging interceptor:', err);
    }
  }

  private getClientIp(req: Request): string {
    return (
      ((req.headers['x-forwarded-for'] as string)?.split(',')[0]) ||
      req.socket.remoteAddress ||
      req.ip ||
      'unknown'
    );
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
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
    sensitiveFields.forEach((field) => {
      if (field in sanitized) {
        sanitized[field] = '***REDACTED***';
      }
    });
    return sanitized;
  }
}
