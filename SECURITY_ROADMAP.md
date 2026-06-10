# 🚀 ROADMAP IMPLEMENTASI - AUDIT TRAIL & SECURITY

**Timeline: 4-5 Minggu | Effort: 20-28 Jam Development**

---

## 📅 MINGGU 1: Foundation (Authentication & Authorization)

### Hari 1-2: Password Validator & Rate Limiting
```
Duration: 4-5 jam
Status: IN PROGRESS

Tasks:
[ ] Buat password-validator.ts dengan rules
    - Min 8 karakter
    - 1 uppercase, 1 lowercase
    - 1 number, 1 special char
    
[ ] Install @nestjs/throttler
    npm install @nestjs/throttler
    
[ ] Konfigurasi throttle di app.module.ts
    - Login: 5 attempts per 60 seconds
    - API: 100 requests per minute
    
[ ] Add @Throttle() ke login endpoint

[ ] Test:
    - Try login 6 times quickly → should block
    - Try weak password → should reject
```

**Deliverable**: Login protection working

---

### Hari 3-4: Refresh Token Rotation
```
Duration: 4-5 jam
Status: TODO

Tasks:
[ ] Add RefreshToken model ke Prisma schema:

    model RefreshToken {
      id        String   @id @default(cuid())
      hash      String   @unique
      userId    String
      user      User     @relation(fields: [userId], references: [id])
      expiresAt DateTime
      revokedAt DateTime?
      createdAt DateTime @default(now())
      @@index([userId])
    }

[ ] Create migration:
    npx prisma migrate dev --name add_refresh_token_model

[ ] Implement token rotation logic
    - Save token hash on login
    - Validate & revoke on refresh
    - Generate new token pair

[ ] Test:
    - Get tokens on login
    - Use refresh token → get new pair
    - Try old refresh token → should fail
```

**Deliverable**: Secure token rotation working

---

### Hari 5: Role Hierarchy & Permissions
```
Duration: 3-4 jam
Status: TODO

Tasks:
[ ] Define role hierarchy:
    ROLE_HIERARCHY = {
      ADMIN: 1, MANAGER: 2, DOCTOR: 3, STAFF: 4, PATIENT: 5
    }

[ ] Create PERMISSIONS_MATRIX dengan detail permissions per role

[ ] Update seeder untuk seed roles & permissions

[ ] Run: npx prisma db seed

[ ] Verify di database:
    SELECT * FROM Role;
    SELECT * FROM Permission;
    SELECT * FROM RolePermission;

[ ] Test:
    - Login as different roles
    - Check permissions in token
```

**Deliverable**: Complete role/permission seeding

---

## 📅 MINGGU 2: Authorization Enforcement

### Hari 6-7: Add Permission Checks ke Endpoints
```
Duration: 5-6 jam
Status: TODO

Tasks:
[ ] Audit semua controller files:
    - apps/backend/src/modules/*/[module].controller.ts

[ ] Add @RequirePermissions() ke setiap endpoint:

    @Controller('patients')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    export class PatientsController {
      @Post()
      @RequirePermissions('patients.create')
      async create(@Body() dto: CreatePatientDto) {}

      @Get()
      @RequirePermissions('patients.read')
      async getAll() {}
    }

[ ] List semua modules & permissions:
    - patients: create, read, update, delete
    - appointments: create, read, update, cancel
    - medical_records: read, write
    - users: create, read, update, delete
    - audit: read, export
    - backup: create, restore

[ ] Test dengan Postman/curl:
    - Call endpoint tanpa permission → 403 Forbidden
    - Call dengan permission → 200 OK
```

**Deliverable**: All endpoints protected with permissions

---

### Hari 8-9: Prevent Self-Escalation & Least Privilege
```
Duration: 4-5 jam
Status: TODO

Tasks:
[ ] Update users.service.ts updateUserRole() method:
    - Check user tidak edit dirinya sendiri
    - Check tidak assign role lebih tinggi
    - Log semua role changes
    
[ ] Add validation:
    - Hanya ADMIN yang bisa manage roles
    - Manager hanya bisa manage staff bawahnya
    
[ ] Create comprehensive audit logging:
    await this.auditLogs.create({
      action: AuditAction.ROLE_CHANGE,
      description: `Role changed from ${old} to ${new}`,
      actorId, entityId, metadata
    })

[ ] Test:
    - Try change own role → should fail
    - Try assign higher role → should fail
    - Admin assign role → should succeed & log
```

**Deliverable**: Privilege escalation prevented

---

## 📅 MINGGU 2-3: SQL Injection & Input Validation

### Hari 10-11: Input Validation DTOs
```
Duration: 3-4 jam
Status: TODO

Tasks:
[ ] Create validators.ts dengan fungsi sanitasi

[ ] Update DTOs dengan @Matches decorator:

    export class SearchPatientDto {
      @IsOptional()
      @IsString()
      @MaxLength(100)
      @Matches(/^[a-zA-Z0-9\s\-_]*$/)
      search?: string;
    }

[ ] Apply ke semua search/filter endpoints

[ ] Test:
    - Normal search → works
    - SQL injection attempt → rejected
    - XSS attempt → rejected
```

**Deliverable**: Input validation on all endpoints

---

### Hari 12: Audit Raw Queries & Rewrite
```
Duration: 4-5 jam
Status: TODO

Tasks:
[ ] Search untuk $queryRaw, $queryRawUnsafe:
    grep -r "queryRaw" apps/backend/src/

[ ] Untuk setiap raw query:
    [ ] Check apakah user input
    [ ] Rewrite pakai Prisma methods
    [ ] Jika harus raw, gunakan parameterized:
        
        // ✅ SAFE
        const result = await prisma.$queryRaw`
          SELECT * FROM User WHERE email = ${email}
        `

[ ] Add query logging ke PrismaService:
    - Log semua queries di dev
    - Alert untuk slow queries (>1s)

[ ] Test:
    - Run test suite
    - Verify no SQL injection possible
```

**Deliverable**: All raw queries secured

---

## 📅 MINGGU 3: Data Protection

### Hari 13-14: Encryption Service
```
Duration: 4-5 jam
Status: TODO

Tasks:
[ ] Create encryption.service.ts dengan AES-256-GCM

[ ] Generate encryption key:
    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

[ ] Add ke .env:
    ENCRYPTION_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

[ ] Implement encrypt/decrypt methods:
    - Use IV + AuthTag + encrypted data
    - Handle encoding properly

[ ] Test encrypt/decrypt:
    - Encrypt data → store → decrypt → compare
    - Different data should produce different ciphertext
```

**Deliverable**: Encryption working correctly

---

### Hari 15-16: Encrypt Sensitive Patient Data
```
Duration: 4-5 jam
Status: TODO

Tasks:
[ ] Add encryptedName, encryptedPhone ke schema

[ ] Update PatientsService:
    - Encrypt on create
    - Decrypt on read
    - Decrypt on update

[ ] Test:
    - Create patient → verify DB encrypted
    - Get patient → verify data decrypted
    - Search → should work on encrypted data

[ ] Create data-masking.ts untuk dev/test:
    maskPatient() → mask sensitive fields
    maskPhone() → XX-XXXX-1234
    maskEmail() → a****@example.com
```

**Deliverable**: Patient data encrypted in database

---

### Hari 17: HTTPS & Security Headers
```
Duration: 2-3 jam
Status: TODO

Tasks:
[ ] Update main.ts:
    - Add helmet middleware
    - Add security headers
    - Enforce HTTPS in prod

[ ] Test headers dengan curl -i:
    X-Content-Type-Options: nosniff
    X-Frame-Options: DENY
    X-XSS-Protection: 1; mode=block
    Strict-Transport-Security: max-age=31536000

[ ] Test HTTPS redirect:
    - Setup SSL certificate locally
    - Verify redirect working
```

**Deliverable**: HTTPS & security headers enforced

---

## 📅 MINGGU 4: Backup & Recovery

### Hari 18-19: Backup Verification & Rotation
```
Duration: 4-5 jam
Status: TODO

Tasks:
[ ] Create backup-verification.service.ts:
    - Calculate SHA256 checksum
    - Verify file integrity
    - Check restorability

[ ] Create backup-retention.service.ts:
    - DAILY: Keep 7 for 7 days
    - WEEKLY: Keep 4 for 30 days
    - MONTHLY: Keep 12 for 1 year
    - Auto-cleanup old backups

[ ] Register services & scheduled jobs:
    @Cron('0 3 * * *') - rotate daily
    @Cron('0 4 * * 0') - verify weekly

[ ] Test:
    - Create backup → checksum saved
    - Old backups auto-deleted
    - Verify can restore
```

**Deliverable**: Backup rotation & verification working

---

### Hari 20-21: Encrypted Backups & Replication
```
Duration: 4-5 jam
Status: TODO

Tasks:
[ ] Update backup.service.ts:
    - Encrypt backup file
    - Store encrypted
    - Decrypt on restore

[ ] Setup AWS S3 (Optional):
    - Create S3 bucket
    - Setup IAM credentials
    
[ ] Create backup-replication.service.ts:
    - Sync to S3 hourly
    - Use GLACIER for cost
    - List & restore from S3

[ ] Test:
    - Create backup → encrypted
    - Restore from backup → works
    - Verify S3 sync (if enabled)
```

**Deliverable**: Encrypted backups with optional replication

---

### Hari 22: Recovery Testing (RTO/RPO)
```
Duration: 3-4 jam
Status: TODO

Tasks:
[ ] Create backup-recovery-test.service.ts:
    - Test database restore
    - Verify data integrity
    - Measure recovery performance
    - Compare against RTO/RPO targets

[ ] Define metrics:
    RTO (Recovery Time Objective): 2 hours
    RPO (Recovery Point Objective): 24 hours

[ ] Schedule quarterly tests:
    @Cron('0 5 1 */3 *')

[ ] Create test report template

[ ] Run first test & verify
```

**Deliverable**: RTO/RPO testing automated

---

## 📅 MINGGU 4-5: Audit & Monitoring Enhancements

### Hari 23-24: Advanced Audit Alerts
```
Duration: 4-5 jam
Status: TODO

Tasks:
[ ] Create audit-alerts.service.ts dengan rules:
    - Multiple failed logins (>10 in 15 min)
    - Unauthorized access attempts
    - Bulk data downloads
    - System errors

[ ] Implement alert actions:
    - Log alert
    - Send email to admins
    - Trigger incident if critical

[ ] Create audit-scheduler.service.ts:
    @Cron('*/5 * * * *') - check alerts
    @Cron('0 * * * *') - cleanup sessions
    @Cron('0 2 * * *') - archive logs
    @Cron('0 3 * * *') - backup daily

[ ] Test:
    - Trigger failed login alert
    - Trigger unauthorized access alert
    - Verify notification sent
```

**Deliverable**: Real-time security alerts

---

### Hari 25-26: Analytics Dashboard & Export
```
Duration: 4-5 jam
Status: TODO

Tasks:
[ ] Create audit-analytics.tsx:
    - Activity over time (line chart)
    - Action distribution (pie chart)
    - Top active users (bar chart)
    - Security incidents (table)

[ ] Create audit-export.service.ts:
    - Export to Excel dengan styling
    - Export to PDF
    - Export compliance report

[ ] Add endpoints:
    GET /api/audit/analytics/timeseries
    GET /api/audit/analytics/action-distribution
    GET /api/audit/analytics/top-users
    GET /api/audit-logs/export?format=excel|pdf

[ ] Test:
    - View analytics dashboard
    - Export Excel
    - Export PDF
```

**Deliverable**: Analytics & export capabilities

---

### Hari 27-28: Documentation & Testing
```
Duration: 4-5 jam
Status: TODO

Tasks:
[ ] Create comprehensive test cases:
    - Authentication tests
    - Authorization tests
    - SQL injection tests
    - Encryption tests
    - Backup/restore tests

[ ] Run full security test:
    npm run test

[ ] Test dengan security tools:
    - OWASP ZAP scanning
    - SQL injection testing
    - XSS testing
    - CORS testing

[ ] Create deployment guide:
    - Environment variables
    - Database migrations
    - Backup procedures
    - Monitoring setup

[ ] Create runbooks untuk:
    - Incident response
    - Emergency recovery
    - Security incident handling
```

**Deliverable**: Full test coverage & documentation

---

## 📋 Pre-Deployment Checklist

```
BEFORE GOING TO STAGING:

AUTHENTICATION
[ ] Password validator working
[ ] Rate limiting working
[ ] Token rotation working
[ ] Suspicious activity detection working

AUTHORIZATION
[ ] All endpoints have @RequirePermissions
[ ] Role hierarchy enforced
[ ] Self-escalation prevented
[ ] Permission changes logged

SQL INJECTION PROTECTION
[ ] No raw queries with user input
[ ] All DTOs have validation
[ ] Input sanitization working
[ ] Query logging enabled

AUDIT TRAIL
[ ] All actions logged
[ ] Audit dashboard accessible
[ ] Export functionality working
[ ] Real-time alerts working

DATA PROTECTION
[ ] Sensitive data encrypted
[ ] HTTPS enforced
[ ] Security headers set
[ ] Data masking working in dev

BACKUP & RECOVERY
[ ] Daily backups working
[ ] Backup verification working
[ ] Restore tested
[ ] RTO/RPO metrics verified

MONITORING
[ ] Alert system working
[ ] Scheduled jobs running
[ ] Dashboard accessible
[ ] Logs persisted

DOCUMENTATION
[ ] Setup guide complete
[ ] API documentation updated
[ ] Troubleshooting guide created
[ ] Runbooks prepared
```

---

## 🔧 Quick Start Commands

```bash
# Clone repository
git clone <repo>
cd apps/backend

# 1. Password Validator
cp docs/password-validator.ts src/common/validators/

# 2. Install throttler
npm install @nestjs/throttler

# 3. Add Prisma models & migrate
npx prisma migrate dev --name add_security_features

# 4. Seed roles & permissions
npx prisma db seed

# 5. Install dependencies
npm install exceljs pdfkit xss

# 6. Run tests
npm run test

# 7. Start development
npm run start:dev

# 8. Check audit logs
curl http://localhost:4000/v1/audit-logs
```

---

## 📊 Implementation Progress Tracker

| Week | Phase | Status | Deliverables |
|------|-------|--------|--------------|
| 1 | Auth Foundation | 📋 PLANNED | Password validator, Rate limiting, Token rotation, Role hierarchy |
| 2 | Authorization | 📋 PLANNED | Permission enforcement, Self-escalation prevention |
| 2-3 | SQL Protection | 📋 PLANNED | Input validation, Query rewrite, Query logging |
| 3 | Data Protection | 📋 PLANNED | Encryption, Masking, HTTPS, Security headers |
| 4 | Backup & Recovery | 📋 PLANNED | Verification, Rotation, Encryption, RTO/RPO testing |
| 4-5 | Monitoring | 📋 PLANNED | Alerts, Scheduler, Analytics, Export |
| 5 | Testing & Docs | 📋 PLANNED | Test suite, Security scanning, Documentation |

---

## 🎯 Success Criteria

### Authentication Security
- [x] ✅ Password hashing dengan bcrypt
- [x] ✅ JWT tokens dengan expiry
- [ ] ⏳ Rate limiting pada login
- [ ] ⏳ Suspicious activity detection
- [ ] ⏳ Session tracking

### Authorization & Roles
- [x] ✅ Role-based access control
- [ ] ⏳ Clear role hierarchy
- [ ] ⏳ Permission checks on all endpoints
- [ ] ⏳ Prevent self-escalation

### SQL Injection Protection
- [ ] ⏳ All user input validated
- [ ] ⏳ Parameterized queries
- [ ] ⏳ Query logging & monitoring

### Audit Trail
- [x] ✅ Comprehensive audit logging
- [x] ✅ Modern audit dashboard
- [ ] ⏳ Real-time alerts
- [ ] ⏳ Advanced analytics

### Data Protection
- [ ] ⏳ Sensitive data encrypted
- [ ] ⏳ HTTPS enforced
- [ ] ⏳ Security headers
- [ ] ⏳ Data masking for dev/test

### Backup & Recovery
- [x] ✅ Daily database backups
- [ ] ⏳ Backup verification
- [ ] ⏳ Encrypted backups
- [ ] ⏳ RTO/RPO testing
- [ ] ⏳ Cross-region replication

---

## 📞 Support & Questions

Untuk setiap phase, referensikan ke **SECURITY_AUDIT_IMPLEMENTATION_GUIDE.md** untuk:
- Detail implementation
- Code snippets ready-to-use
- Testing procedures
- Troubleshooting tips

---

**Timeline**: 4-5 Minggu  
**Total Effort**: 20-28 Jam  
**Status**: Ready for Implementation  
**Last Updated**: 2026-06-08
