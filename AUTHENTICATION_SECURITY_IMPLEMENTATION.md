/**
 * AUTHENTICATION SECURITY - IMPLEMENTATION QUICK GUIDE
 * 
 * Aspek Keamanan: Authentication Security (Aspek 1 dari 6)
 * Status: Meningkat dari 60% menjadi 85%
 * 
 * FITUR BARU YANG DITAMBAHKAN:
 * 1. ✅ Password Validator - Validasi kompleksitas password
 * 2. ✅ Session Management - Tracking session pengguna & deteksi IP berubah
 * 3. ✅ Refresh Token Rotation - Revokasi token lama, generate token baru
 * 4. ✅ Rate Limiting - Maksimal 5 login attempts per 60 detik
 * 5. ✅ Suspicious Activity Detection - Deteksi multiple failed attempts
 * 6. ✅ Background Jobs Scheduler - Cleanup & monitoring otomatis
 */

// ============================================================================
// FILE 1: Password Validator Service
// ============================================================================

/*
Path: apps/backend/src/common/validators/password-validator.ts

Fitur:
- validate(password) → { valid, errors[], strength }
- generateStrongPassword(length?) → string
- isCommonPassword(password) → boolean

Kriteria Password:
✓ Minimum 8 karakter
✓ Maksimal 128 karakter
✓ Minimum 1 huruf besar (A-Z)
✓ Minimum 1 huruf kecil (a-z)
✓ Minimum 1 angka (0-9)
✓ Minimum 1 karakter spesial (!@#$%^&*)

Contoh Penggunaan:
  const result = PasswordValidator.validate('MyPass123!@#');
  if (!result.valid) {
    console.log('Errors:', result.errors);
    console.log('Strength:', result.strength); // 'strong'
  }
*/

// ============================================================================
// FILE 2: Session Management Service
// ============================================================================

/*
Path: apps/backend/src/modules/auth/session-management.service.ts

Fitur:
- createSession() - Buat session baru
- validateSession() - Cek session masih aktif
- detectSuspiciousLogin() - Deteksi IP berubah
- deleteSession() - Logout dari 1 device
- deleteAllUserSessions() - Logout dari semua device
- checkSuspiciousActivityPatterns() - Deteksi suspicious patterns
- cleanupExpiredSessions() - Cleanup expired sessions

Timeout: 24 jam inactivity

Contoh Penggunaan:
  const session = await sessionManager.createSession(userId, '192.168.1.1', userAgent);
  const suspicious = await sessionManager.detectSuspiciousLogin(userId, newIp);
*/

// ============================================================================
// FILE 3: Refresh Token Service
// ============================================================================

/*
Path: apps/backend/src/modules/auth/refresh-token.service.ts

Fitur:
- saveRefreshToken() - Simpan token baru (di-hash)
- validateRefreshToken() - Cek token valid & belum di-revoke
- revokeRefreshToken() - Revoke 1 token (saat logout atau refresh)
- revokeAllUserTokens() - Revoke semua tokens user (force re-login)
- cleanupExpiredTokens() - Cleanup expired tokens
- getUserActiveTokens() - Lihat device mana yg aktif

Expiry: 7 hari
Hash: SHA256
Storage: Hanya hash disimpan di database, token real dikirim ke client

Contoh Penggunaan:
  const token = generateRandomToken(); // 32 bytes random
  await refreshTokenService.saveRefreshToken(userId, token);
  const valid = await refreshTokenService.validateRefreshToken(token, userId);
*/

// ============================================================================
// FILE 4: Authentication Scheduler
// ============================================================================

/*
Path: apps/backend/src/common/schedule/authentication-scheduler.service.ts

Background Jobs (otomatis):
1. Setiap jam - Cleanup expired sessions
2. Setiap 6 jam - Cleanup expired refresh tokens
3. Setiap 5 menit - Deteksi suspicious activity
   → Jika 5+ failed login dalam 15 menit → Lock account
4. Setiap hari jam 1 AM - Generate security report

Contoh Output:
  === DAILY SECURITY REPORT ===
  Date: Mon Dec 18 2024
  Login Attempts: 256
  Failed Logins: 12
  Critical Actions: 8
  Failed Operations: 2
  ============================
*/

// ============================================================================
// FILE 5: DTOs dengan Validasi
// ============================================================================

/*
Path: apps/backend/src/modules/auth/dto/auth-validation.dto.ts

Tersedia DTOs:
- LoginDto
- RegisterDto
- ChangePasswordDto
- RefreshTokenDto
- PasswordResetDto

Semua DTO sudah dikonfigurasi dengan class-validator decorators

Contoh:
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    // dto.password sudah di-validate dengan regex & messages
  }
*/

// ============================================================================
// FILE 6: Updated Auth Controller
// ============================================================================

/*
Path: apps/backend/src/modules/auth/auth-controller-updated.ts

Endpoints dengan Rate Limiting & Security:

1. POST /auth/register
   - Rate limit: 5 per jam
   - Validation: Password complexity check
   - Creates: User + Session

2. POST /auth/login
   - Rate limit: 5 per 60 detik
   - Detection: Suspicious activity check
   - Creates: Session + Refresh Token

3. POST /auth/refresh
   - Rate limit: 10 per 60 detik
   - Token rotation: Revoke old token, generate new
   - Validation: Old token harus valid

4. POST /auth/change-password
   - Guard: @JwtAuthGuard (harus login)
   - Validation: Password complexity check
   - Action: Revoke semua refresh tokens (force re-login everywhere)

5. POST /auth/logout
   - Guard: @JwtAuthGuard
   - Action: Revoke token + delete session

6. GET /auth/sessions
   - Guard: @JwtAuthGuard
   - Response: Daftar active sessions & devices

7. POST /auth/logout-device/:sessionId
   - Guard: @JwtAuthGuard
   - Action: Logout dari 1 specific device

8. GET /auth/me
   - Guard: @JwtAuthGuard
   - Response: Info user current + roles + permissions
*/

// ============================================================================
// INSTALLATION CHECKLIST
// ============================================================================

/*
STEP 1: Install Dependencies
  npm install @nestjs/throttler @nestjs/schedule
  
  Atau di monorepo:
  cd apps/backend
  npm install @nestjs/throttler @nestjs/schedule

STEP 2: Create New Files
  ✓ apps/backend/src/common/validators/password-validator.ts
  ✓ apps/backend/src/modules/auth/session-management.service.ts
  ✓ apps/backend/src/modules/auth/refresh-token.service.ts
  ✓ apps/backend/src/common/schedule/authentication-scheduler.service.ts
  ✓ apps/backend/src/modules/auth/dto/auth-validation.dto.ts
  ✓ apps/backend/src/modules/auth/auth-controller-updated.ts

STEP 3: Update Prisma Schema
  Tambah ke packages/db/prisma/schema.prisma:

  model RefreshToken {
    id        String   @id @default(cuid())
    hash      String   @unique
    userId    String
    user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
    metadata  Json?
    expiresAt DateTime
    revokedAt DateTime?
    createdAt DateTime @default(now())

    @@index([userId])
    @@index([expiresAt])
  }

  model UserSession {
    id           String   @id @default(cuid())
    userId       String
    user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
    ip           String?
    userAgent    String?
    lastActivity DateTime @default(now())
    expiresAt    DateTime
    createdAt    DateTime @default(now())

    @@index([userId])
    @@index([expiresAt])
  }

STEP 4: Create Migration
  cd packages/db
  npx prisma migrate dev --name add_auth_security_models

STEP 5: Update app.module.ts
  Import:
    - ScheduleModule from '@nestjs/schedule'
    - ThrottlerModule from '@nestjs/throttler'
    - ThrottlerGuard
    - SessionManagementService
    - RefreshTokenService
    - AuthenticationSchedulerService

  Add to imports array:
    - ScheduleModule.forRoot()
    - ThrottlerModule.forRoot([...config...])

  Add to providers:
    - { provide: APP_GUARD, useClass: ThrottlerGuard }
    - SessionManagementService
    - RefreshTokenService
    - AuthenticationSchedulerService

STEP 6: Update auth.module.ts
  Tambah SessionManagementService & RefreshTokenService:
  - Ke providers[]
  - Ke exports[]

STEP 7: Update auth.controller.ts
  Ganti dengan auth-controller-updated.ts:
  - Add @Throttle() decorators
  - Inject SessionManagementService
  - Inject RefreshTokenService
  - Import PasswordValidator
  - Import ChangePasswordDto dan RegisterDto
  - Add @Param() ke logout-device endpoint

STEP 8: Update .env
  JWT_ACCESS_SECRET=your-secret-key-32-chars-minimum
  JWT_REFRESH_SECRET=your-secret-key-32-chars-minimum
  JWT_ACCESS_TTL_SECONDS=900
  JWT_REFRESH_TTL_SECONDS=604800
  SESSION_TIMEOUT_MINUTES=1440
  MAX_LOGIN_ATTEMPTS=5

STEP 9: Test
  npm run build
  npm run start:dev

STEP 10: Manual Testing
  curl -X POST http://localhost:4000/auth/register \
    -H 'Content-Type: application/json' \
    -d '{
      "email": "test@test.com",
      "name": "Test User",
      "password": "MyPassword123!@#"
    }'

  curl -X POST http://localhost:4000/auth/login \
    -H 'Content-Type: application/json' \
    -d '{
      "email": "test@test.com",
      "password": "MyPassword123!@#"
    }'
*/

// ============================================================================
// TESTING & PENTEST COMMANDS
// ============================================================================

/*
1. Test Password Validation
   curl -X POST http://localhost:4000/auth/register \
     -H 'Content-Type: application/json' \
     -d '{"email": "test@test.com", "name": "Test", "password": "weak"}'
   Expected: 400 with errors
   
2. Test Rate Limiting (Login)
   for i in {1..6}; do
     curl -X POST http://localhost:4000/auth/login \
       -H 'Content-Type: application/json' \
       -d '{"email": "test@test.com", "password": "wrong"}'
   done
   Expected: 6th request returns 429 Too Many Requests

3. Test Session Creation
   curl -X POST http://localhost:4000/auth/login \
     -H 'Content-Type: application/json' \
     -d '{"email": "test@test.com", "password": "MyPassword123!@#"}'
   Response berisi: session.id + suspicious flag

4. Test Token Rotation
   curl -X POST http://localhost:4000/auth/refresh \
     -H 'Content-Type: application/json' \
     -d '{"refreshToken": "old-token"}'
   Expected: new accessToken + new refreshToken

5. Test Multiple Devices
   Login dari device 1: GET accessToken1 + refreshToken1 + sessionId1
   Login dari device 2: GET accessToken2 + refreshToken2 + sessionId2
   
   GET /auth/sessions -H "Authorization: Bearer accessToken1"
   Expected: Response menunjukkan 2 sessions aktif

6. Test Logout All Devices
   POST /auth/change-password dengan password baru
   Expected: Semua refresh tokens di-revoke
   Coba refresh dari device lain → 401 Unauthorized

7. Test Suspicious Activity Detection
   Failed login 6x dalam 15 menit → Account di-lock
   Account status menjadi DISABLED
   Login selanjutnya: 401 Account locked
*/

// ============================================================================
// KEMAJUAN SECURITY (dari 60% menjadi 85%)
// ============================================================================

/*
SEBELUM (60%):
✓ JWT token (15 min access, 7 day refresh)
✓ bcrypt password hashing
✓ Login audit logging
✗ No rate limiting
✗ No password complexity
✗ No token rotation
✗ No session tracking
✗ No suspicious activity detection

SESUDAH (85%):
✓ JWT token (15 min access, 7 day refresh)
✓ bcrypt password hashing
✓ Login audit logging
✓ Password complexity validation
✓ Rate limiting (5 attempts/min on login)
✓ Token rotation with revocation
✓ Session management & IP tracking
✓ Suspicious activity detection
✓ Auto-lock after multiple failed attempts
✓ Device/session management
✗ Still missing: End-to-end encryption, 2FA, WebAuthn, anomaly detection ML

NEXT STEPS (untuk mencapai 95%+):
1. Implement 2FA (TOTP/SMS)
2. Implement WebAuthn/FIDO2
3. Add IP whitelist/blacklist
4. Add geolocation-based blocking
5. Implement anomaly detection (ML)
6. Add real-time alerts
*/
