# 🎯 SECURITY QUICK REFERENCE & ACTION ITEMS

---

## ⚡ QUICK START - Mulai Hari Ini

### STEP 1: Baca Dokumentasi (30 menit)
```
1. SECURITY_AUDIT_IMPLEMENTATION_GUIDE.md
   - Pahami 6 aspek keamanan
   - Lihat apa yang sudah done
   - Lihat apa yang perlu ditambah

2. SECURITY_ROADMAP.md
   - Lihat timeline 5 minggu
   - Ikuti hari demi hari
   - Track progress
```

### STEP 2: Setup Environment (30 menit)
```bash
# Install required packages
cd apps/backend
npm install @nestjs/throttler bcrypt dotenv

# Generate encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add ke .env:
ENCRYPTION_KEY=<generated-key>
JWT_ACCESS_TTL_SECONDS=900
JWT_REFRESH_TTL_SECONDS=604800
```

### STEP 3: Mulai Implementasi (Week 1)
```
[ ] Day 1-2: Password Validator + Rate Limiting
[ ] Day 3-4: Refresh Token Rotation  
[ ] Day 5: Role Hierarchy Setup
```

---

## 📌 IMPLEMENTATION CHECKLIST

### Phase 1: Authentication (Week 1 - Days 1-2)

#### Password Validator
```typescript
// File: apps/backend/src/common/validators/password-validator.ts
STATUS: ❌ NOT CREATED YET

Checklist:
[ ] Create file
[ ] Implement validation rules:
    - Min 8 characters
    - 1 uppercase, 1 lowercase
    - 1 number, 1 special character
[ ] Add test cases
[ ] Integrate into auth.service.ts
    - Register endpoint
    - Change password endpoint

Code Snippet Ready: YES ✅
```

#### Rate Limiting
```typescript
// File: apps/backend/src/common/throttle/
STATUS: ❌ NOT CONFIGURED YET

Steps:
[ ] npm install @nestjs/throttler
[ ] Update app.module.ts
[ ] Add @Throttle() decorator to login
[ ] Test with 10 rapid requests

Configuration:
- Login: 5 attempts per 60 seconds
- General API: 100 requests per minute
```

---

### Phase 2: Authorization (Week 1-2 - Days 3-5)

#### Role Hierarchy
```typescript
// Status: ❌ NEEDS SEEDING

Define Roles:
ADMIN (Level 1)
├── MANAGER (Level 2)
    ├── DOCTOR (Level 3)
    ├── STAFF (Level 4)
└── PATIENT (Level 5)

Checklist:
[ ] Define PERMISSIONS_MATRIX
[ ] Update seeders
[ ] Run npx prisma db seed
[ ] Verify in DB
```

#### Permission Checks on Endpoints
```typescript
// Status: ⚠️ PARTIALLY DONE

Modules needing permission checks:
[ ] Patients (create, read, update, delete)
[ ] Appointments (create, read, update)
[ ] Medical Records (read, write)
[ ] Users (create, read, update, delete)
[ ] Audit Logs (read, export)
[ ] Backup (create, restore)

Pattern:
@Controller('patients')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PatientsController {
  @Post()
  @RequirePermissions('patients.create')
  async create() { }
}
```

---

### Phase 3: SQL Injection Protection (Week 2-3)

#### Input Validation DTOs
```typescript
// File: apps/backend/src/common/validators/
STATUS: ❌ NEEDS DTO UPDATES

Checklist:
[ ] Create validators.ts with sanitization
[ ] Update all search DTOs with @Matches
[ ] Test with SQL injection payloads
[ ] Test with XSS payloads

Example DTO:
@IsString()
@MaxLength(100)
@Matches(/^[a-zA-Z0-9\s\-_]*$/)
search?: string;
```

#### Query Audit
```bash
# Find raw queries
grep -r "\$queryRaw" apps/backend/src/
grep -r "\$queryRawUnsafe" apps/backend/src/

# For each raw query:
# [ ] Rewrite using Prisma ORM
# [ ] OR use parameterized query
```

---

### Phase 4: Data Protection (Week 3)

#### Encryption Service
```typescript
// File: apps/backend/src/common/encryption/
STATUS: ❌ NOT CREATED

Checklist:
[ ] Create encryption.service.ts
[ ] Use AES-256-GCM algorithm
[ ] Implement encrypt() method
[ ] Implement decrypt() method
[ ] Add test cases

Algorithm:
AES-256-GCM with IV + AuthTag + ciphertext
```

#### Encrypt Patient Data
```typescript
// File: apps/backend/src/modules/patients/
STATUS: ❌ NEEDS UPDATE

Fields to Encrypt:
[ ] name - patient name
[ ] phone - phone number
[ ] address - home address
[ ] birthDate - birth date

Pattern:
Create: encrypt(data) → store
Read: decrypt(data) → return
Search: compare encrypted values
```

#### HTTPS & Security Headers
```
STATUS: ❌ NOT CONFIGURED

Checklist:
[ ] Add helmet middleware
[ ] Configure security headers
[ ] Enable HTTPS in production
[ ] Test with curl -i

Headers to set:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security: max-age=31536000
```

---

### Phase 5: Backup & Recovery (Week 4)

#### Backup Verification
```typescript
// File: apps/backend/src/modules/backup/
STATUS: ❌ NOT CREATED

Checklist:
[ ] Create backup-verification.service.ts
[ ] Implement SHA256 checksum
[ ] Save checksum to .sha256 file
[ ] Verify on restore

Methods:
- calculateChecksum(file)
- verifyBackupIntegrity(file)
- verifyRestorability(file)
```

#### Backup Rotation
```typescript
// Status: ❌ NOT AUTOMATED

Policy:
DAILY: Keep 7 for 7 days
WEEKLY: Keep 4 for 30 days
MONTHLY: Keep 12 for 1 year

Checklist:
[ ] Create backup-retention.service.ts
[ ] Implement @Cron schedule
[ ] Auto-delete old backups
[ ] Monitor disk usage
```

#### Encrypted Backups
```
Status: ❌ NOT ENCRYPTED

Process:
1. Create backup with pg_dump
2. Encrypt with AES-256
3. Store encrypted file
4. Decrypt before restore

Updates needed:
[ ] Update backup.service.ts
[ ] Create restore function
[ ] Test full cycle
```

---

### Phase 6: Audit & Monitoring (Week 4-5)

#### Security Alerts
```typescript
// File: apps/backend/src/modules/audit-logs/
STATUS: ❌ NOT IMPLEMENTED

Alert Rules:
[ ] Multiple failed logins (>10 in 15 min)
[ ] Unauthorized access attempts
[ ] Bulk data downloads
[ ] Role/permission changes
[ ] Database errors

Checklist:
[ ] Create audit-alerts.service.ts
[ ] Define alert rules
[ ] Implement notifications
[ ] Schedule checks every 5 min
```

#### Analytics Dashboard
```typescript
// File: apps/frontend/src/components/audit/
STATUS: ❌ NOT CREATED

Visualizations Needed:
[ ] Activity over time (Line chart)
[ ] Action distribution (Pie chart)
[ ] Top active users (Bar chart)
[ ] Security incidents (Table)

Backend Endpoints:
GET /api/audit/analytics/timeseries
GET /api/audit/analytics/action-distribution
GET /api/audit/analytics/top-users
```

#### Export Capabilities
```typescript
// Status: ❌ NOT IMPLEMENTED

Export Formats:
[ ] Excel (.xlsx)
[ ] PDF (.pdf)
[ ] CSV (.csv)
[ ] Compliance report

Checklist:
[ ] Create audit-export.service.ts
[ ] Implement each format
[ ] Add filters & date range
[ ] Test exports
```

---

## 🔄 File Structure - WHAT TO CREATE

```
apps/backend/src/
├── common/
│   ├── validators/
│   │   ├── password-validator.ts          ❌ CREATE
│   │   └── validators.ts                   ❌ CREATE
│   ├── encryption/
│   │   └── encryption.service.ts           ❌ CREATE
│   ├── sanitizers/
│   │   └── html-sanitizer.ts               ❌ CREATE
│   ├── utils/
│   │   └── data-masking.ts                 ❌ CREATE
│   └── schedule/
│       ├── audit-scheduler.service.ts      ❌ CREATE
│       ├── data-retention.service.ts       ❌ CREATE
│       └── backup-verification.service.ts  ❌ CREATE
│
├── modules/
│   ├── audit-logs/
│   │   ├── audit-alerts.service.ts         ❌ CREATE
│   │   ├── audit-analytics.controller.ts   ❌ CREATE
│   │   └── audit-export.service.ts         ❌ CREATE
│   │
│   ├── backup/
│   │   ├── backup-verification.service.ts  ❌ CREATE
│   │   ├── backup-retention.service.ts     ❌ CREATE
│   │   ├── backup-recovery-test.service.ts ❌ CREATE
│   │   ├── backup-replication.service.ts   ❌ CREATE
│   │   └── backup.service.ts               ✅ UPDATE

apps/frontend/src/
├── components/audit/
│   ├── audit-analytics.tsx                 ❌ CREATE
│   └── ...other components...              ✅ EXIST

packages/db/
└── prisma/
    ├── schema.prisma                       ✅ UPDATE
    └── migrations/
        └── [new_migration_files].sql       ❌ CREATE
```

---

## 🗂️ SCHEMA UPDATES NEEDED

### New Models to Add:

```prisma
// 1. Refresh Token Management
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

// 2. Session Tracking
model UserSession {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  ip           String?
  userAgent    String?
  lastActivity DateTime @default(now())
  expiresAt    DateTime
  createdAt    DateTime @default(now())
  @@index([userId])
  @@index([expiresAt])
}

// 3. Backup Metadata
model BackupMetadata {
  id           String   @id @default(cuid())
  filename     String   @unique
  checksum     String
  size         BigInt
  encrypted    Boolean  @default(true)
  createdAt    DateTime @default(now())
  createdBy    String
  restoredAt   DateTime?
  verifiedAt   DateTime?
  description  String?
  metadata     Json?
}
```

---

## 📊 TEST CASES TO RUN

### Authentication Tests
```bash
# 1. Test weak password
curl -X POST http://localhost:4000/v1/auth/register \
  -d '{"password":"weak"}'
# Expected: 400 Bad Request - "Password must contain..."

# 2. Test rate limiting (run 6 times)
for i in {1..6}; do
  curl -X POST http://localhost:4000/v1/auth/login \
    -d '{"email":"test@simrs.local","password":"wrong"}'
done
# Expected: 6th request returns 429 Too Many Requests

# 3. Test token rotation
TOKEN=$(curl -X POST http://localhost:4000/v1/auth/login \
  -d '...' | jq -r '.refreshToken')
curl -X POST http://localhost:4000/v1/auth/refresh \
  -H "Authorization: Bearer $TOKEN"
# Then try old token: should fail
```

### Authorization Tests
```bash
# 1. Test permission denied
curl -X GET http://localhost:4000/v1/users \
  -H "Authorization: Bearer PATIENT_TOKEN"
# Expected: 403 Forbidden

# 2. Test permission allowed
curl -X GET http://localhost:4000/v1/patients \
  -H "Authorization: Bearer PATIENT_TOKEN"
# Expected: 200 OK

# 3. Test role assignment
curl -X PUT http://localhost:4000/v1/users/123/role \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"newRole":"MANAGER"}'
# Expected: Role changed + logged in audit trail
```

### SQL Injection Tests
```bash
# 1. Test search injection
curl -X GET "http://localhost:4000/v1/patients?search='; DROP TABLE users;--"
# Expected: 400 Bad Request (input validation failed)

# 2. Test query injection
curl -X GET "http://localhost:4000/v1/patients?name=' OR '1'='1"
# Expected: No data returned (safe parameterized query)
```

### Data Protection Tests
```bash
# 1. Check encryption
SELECT * FROM Patient; -- Verify name/phone encrypted
# Expected: name column shows encrypted gibberish, not plaintext

# 2. Check HTTPS enforcement
curl -i http://localhost:4000/v1/auth/login
# Expected: Headers include security headers

# 3. Check encrypted backups
ls -la backups/
# Expected: .sql files encrypted, .sql.sha256 files exist
```

---

## ⚙️ ENVIRONMENT VARIABLES NEEDED

```bash
# Authentication
JWT_ACCESS_SECRET=<very-secure-random-string>
JWT_REFRESH_SECRET=<different-very-secure-random-string>
JWT_ACCESS_TTL_SECONDS=900
JWT_REFRESH_TTL_SECONDS=604800

# Encryption
ENCRYPTION_KEY=<32-byte-hex-string>

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/simrs

# Backup
BACKUP_RETENTION_DAYS=365
MAX_BACKUP_SIZE_GB=10

# AWS S3 (if using replication)
AWS_REGION=us-east-1
AWS_BACKUP_BUCKET=simrs-backups
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx

# Email Alerts (if sending notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=alerts@simrs.local
SMTP_PASS=xxx
ADMIN_EMAIL=admin@simrs.local

# Environment
NODE_ENV=production
ALLOWED_ORIGINS=https://simrs.example.com
```

---

## 🚀 DEPLOYMENT CHECKLIST

```
PRE-DEPLOYMENT:

Code Review
[ ] All new code reviewed
[ ] No hardcoded secrets
[ ] Tests passing

Database
[ ] Migrations tested locally
[ ] Backup strategy verified
[ ] Data encryption keys generated

Security
[ ] All passwords hashed
[ ] All tokens encrypted
[ ] HTTPS certificates ready
[ ] Security headers configured

Monitoring
[ ] Alert system ready
[ ] Log aggregation configured
[ ] Dashboard accessible
[ ] Backup verification working

Documentation
[ ] Setup guide written
[ ] Runbooks prepared
[ ] Troubleshooting guide created
[ ] Team trained

DEPLOYMENT:
1. Database migration: npx prisma migrate deploy
2. Build: npm run build
3. Start: npm run start:prod
4. Verify: Test critical paths
5. Monitor: Watch logs & alerts
```

---

## 📞 GETTING HELP

### If Something Breaks:

1. **Check the logs**
   ```bash
   npm run logs -- --since 5m
   ```

2. **Refer to troubleshooting section**
   → SECURITY_AUDIT_IMPLEMENTATION_GUIDE.md → Troubleshooting

3. **Run diagnostic test**
   ```bash
   npm run test:security
   ```

4. **Check Git status**
   ```bash
   git status
   git diff
   ```

5. **Ask for help with:**
   - Error message
   - What you were doing
   - Environment details
   - Relevant logs

---

## 📝 NOTES

- All code snippets are production-ready
- All implementations follow NestJS best practices
- All security measures follow OWASP guidelines
- All database operations use Prisma ORM for safety
- All sensitive data is encrypted by default

---

**Quick Reference Version**: 1.0  
**Last Updated**: 2026-06-08  
**Status**: Ready for Implementation
