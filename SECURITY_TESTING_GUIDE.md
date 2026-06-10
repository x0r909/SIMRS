# 🧪 SIMPLE SECURITY TESTING GUIDE

**Testing 6 Aspek Keamanan - Langsung ke Praktek**

---

## ⚡ QUICK TESTING STEPS

---

## 📦 Prerequisites

### 1. Setup Environment
```bash
# Terminal 1: Start Backend
cd d:\temp\SIMRS\ bagus
pnpm install
cd apps/backend
pnpm dev

# Terminal 2: Start Frontend
cd d:\temp\SIMRS\ bagus/apps/frontend
pnpm dev

# Terminal 3: Testing Terminal
cd d:\temp\SIMRS\ bagus
```

### 2. Tools yang Diperlukan
- **curl** atau **Postman** - untuk API testing
- **PowerShell** - untuk running test scripts
- **JSON payload examples** - siap di bawah ini

### 3. Test Data
```bash
# Create test users for testing
# Email: test@test.com, Password: Test@12345
# Email: doctor@test.com, Password: Doctor@12345
# Email: patient@test.com, Password: Patient@12345
```

---

## 1. 🔐 AUTHENTICATION SECURITY TESTING

### 1.1 Password Complexity Testing

**Tujuan**: Memastikan password memenuhi requirement minimal

**Test Cases**:

```bash
# Test 1: Password terlalu pendek (< 8 karakter)
curl -X POST http://localhost:4000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "email":"testshort@test.com",
    "password":"Test@12"
  }'
# Expected: ❌ 400 Bad Request - Password must be at least 8 characters

# Test 2: Password tanpa uppercase
curl -X POST http://localhost:4000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "email":"testnouppercase@test.com",
    "password":"test@12345"
  }'
# Expected: ❌ 400 Bad Request - Password must contain uppercase letter

# Test 3: Password tanpa lowercase
curl -X POST http://localhost:4000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "email":"testnolowercase@test.com",
    "password":"TEST@12345"
  }'
# Expected: ❌ 400 Bad Request - Password must contain lowercase letter

# Test 4: Password tanpa angka
curl -X POST http://localhost:4000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "email":"testnumber@test.com",
    "password":"Test@abcde"
  }'
# Expected: ❌ 400 Bad Request - Password must contain number

# Test 5: Password tanpa special character
curl -X POST http://localhost:4000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "email":"testnospecial@test.com",
    "password":"Test12345"
  }'
# Expected: ❌ 400 Bad Request - Password must contain special character

# Test 6: Password valid
curl -X POST http://localhost:4000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "email":"testvalid@test.com",
    "password":"ValidPass@123"
  }'
# Expected: ✅ 201 Created - User registered successfully
```

**Verifikasi Hasil**:
- [ ] Semua test case 1-5 return 400
- [ ] Test case 6 return 201

---

### 1.2 Rate Limiting on Login (Brute Force Protection)

**Tujuan**: Melindungi dari brute force attack

**Test Cases**:

```bash
# Test 1: 6 failed login attempts dalam 60 detik
for ($i=1; $i -le 6; $i++) {
  Write-Host "Attempt #$i"
  $response = curl -X POST http://localhost:4000/auth/login `
    -H 'Content-Type: application/json' `
    -d '{"email":"test@test.com","password":"wrong"}' -s
  Write-Host $response
}
# Expected pada attempt ke-6: ❌ 429 Too Many Requests

# Test 2: Tunggu 1 menit, kemudian coba login lagi
Start-Sleep -Seconds 61
curl -X POST http://localhost:4000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@test.com","password":"Test@12345"}'
# Expected: ✅ 200 OK - Login berhasil (rate limit reset)
```

**Verifikasi Hasil**:
- [ ] Request ke-6 return 429
- [ ] Message: "Too many login attempts, please try again later"
- [ ] Setelah 60 detik, login bisa dilakukan lagi

---

### 1.3 Token Expiration Testing

**Tujuan**: Memastikan token expired dan refresh token berfungsi

```bash
# Test 1: Get Access Token
$loginResponse = curl -X POST http://localhost:4000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@test.com","password":"Test@12345"}' -s | ConvertFrom-Json

$accessToken = $loginResponse.accessToken
$refreshToken = $loginResponse.refreshToken

Write-Host "Access Token: $accessToken"
Write-Host "Refresh Token: $refreshToken"

# Test 2: Use valid token (should work)
curl -X GET http://localhost:4000/users/profile \
  -H "Authorization: Bearer $accessToken"
# Expected: ✅ 200 OK

# Test 3: Wait for token to expire (15 minutes default)
# OR modify JWT_ACCESS_EXPIRES in .env to 10 seconds for testing
Write-Host "Waiting for token to expire..."
Start-Sleep -Seconds 15

# Test 4: Use expired token (should fail)
curl -X GET http://localhost:4000/users/profile \
  -H "Authorization: Bearer $accessToken"
# Expected: ❌ 401 Unauthorized - Token expired

# Test 5: Refresh token
$refreshResponse = curl -X POST http://localhost:4000/auth/refresh \
  -H 'Content-Type: application/json' \
  -d "{\"refreshToken\":\"$refreshToken\"}" -s | ConvertFrom-Json

$newAccessToken = $refreshResponse.accessToken
Write-Host "New Access Token: $newAccessToken"

# Test 6: Use new token (should work)
curl -X GET http://localhost:4000/users/profile \
  -H "Authorization: Bearer $newAccessToken"
# Expected: ✅ 200 OK
```

**Verifikasi Hasil**:
- [ ] Valid token bisa akses protected route
- [ ] Expired token return 401
- [ ] Refresh token menghasilkan access token baru
- [ ] New token bisa akses protected route

---

### 1.4 Invalid Token Format Testing

```bash
# Test 1: No token provided
curl -X GET http://localhost:4000/users/profile
# Expected: ❌ 401 Unauthorized

# Test 2: Malformed token
curl -X GET http://localhost:4000/users/profile \
  -H "Authorization: Bearer invalid.token.format"
# Expected: ❌ 401 Unauthorized - Invalid token

# Test 3: Token dari header berbeda format
curl -X GET http://localhost:4000/users/profile \
  -H "Authorization: $accessToken"  # tanpa "Bearer"
# Expected: ❌ 401 Unauthorized

# Test 4: Token altered (change 1 character)
$alteredToken = $accessToken.Substring(0, $accessToken.Length - 2) + "XX"
curl -X GET http://localhost:4000/users/profile \
  -H "Authorization: Bearer $alteredToken"
# Expected: ❌ 401 Unauthorized - Invalid signature
```

**Verifikasi Hasil**:
- [ ] Semua test return 401
- [ ] Error message konsisten dan tidak membocorkan info

---

## 2. 👥 AUTHORIZATION & ROLE MANAGEMENT TESTING

### 2.1 Role-Based Access Control (RBAC) Testing

**Tujuan**: Memastikan user hanya bisa akses resource sesuai role mereka

**Setup**: Pastikan ada minimal 3 user dengan role berbeda:
- `admin@test.com` - ADMIN role
- `doctor@test.com` - DOCTOR role
- `patient@test.com` - PATIENT role

**Test Cases**:

```bash
# ===== LOGIN UNTUK SETIAP ROLE =====

# Admin Login
$adminLogin = curl -X POST http://localhost:4000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@test.com","password":"Admin@12345"}' -s | ConvertFrom-Json
$adminToken = $adminLogin.accessToken

# Doctor Login
$doctorLogin = curl -X POST http://localhost:4000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"doctor@test.com","password":"Doctor@12345"}' -s | ConvertFrom-Json
$doctorToken = $doctorLogin.accessToken

# Patient Login
$patientLogin = curl -X POST http://localhost:4000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"patient@test.com","password":"Patient@12345"}' -s | ConvertFrom-Json
$patientToken = $patientLogin.accessToken

Write-Host "Admin Token: $adminToken"
Write-Host "Doctor Token: $doctorToken"
Write-Host "Patient Token: $patientToken"

# ===== TEST 1: ADMIN ACCESS =====

# Test 1.1: Admin bisa akses admin panel
curl -X GET http://localhost:4000/admin/dashboard \
  -H "Authorization: Bearer $adminToken"
# Expected: ✅ 200 OK

# Test 1.2: Doctor tidak bisa akses admin panel
curl -X GET http://localhost:4000/admin/dashboard \
  -H "Authorization: Bearer $doctorToken"
# Expected: ❌ 403 Forbidden - Insufficient permissions

# Test 1.3: Patient tidak bisa akses admin panel
curl -X GET http://localhost:4000/admin/dashboard \
  -H "Authorization: Bearer $patientToken"
# Expected: ❌ 403 Forbidden - Insufficient permissions

# ===== TEST 2: DOCTOR ACCESS =====

# Test 2.1: Doctor bisa akses patient list
curl -X GET http://localhost:4000/patients \
  -H "Authorization: Bearer $doctorToken"
# Expected: ✅ 200 OK

# Test 2.2: Doctor bisa akses appointment list
curl -X GET http://localhost:4000/appointments \
  -H "Authorization: Bearer $doctorToken"
# Expected: ✅ 200 OK

# Test 2.3: Doctor tidak bisa akses admin settings
curl -X PUT http://localhost:4000/admin/settings \
  -H "Authorization: Bearer $doctorToken" \
  -H 'Content-Type: application/json' \
  -d '{"setting":"value"}'
# Expected: ❌ 403 Forbidden

# ===== TEST 3: PATIENT ACCESS =====

# Test 3.1: Patient bisa akses profile sendiri
curl -X GET http://localhost:4000/users/profile \
  -H "Authorization: Bearer $patientToken"
# Expected: ✅ 200 OK

# Test 3.2: Patient TIDAK bisa akses patient list
curl -X GET http://localhost:4000/patients \
  -H "Authorization: Bearer $patientToken"
# Expected: ❌ 403 Forbidden

# Test 3.3: Patient TIDAK bisa akses user management
curl -X GET http://localhost:4000/users \
  -H "Authorization: Bearer $patientToken"
# Expected: ❌ 403 Forbidden
```

**Verifikasi Hasil**:
- [ ] Admin: akses admin panel ✅, doctor & patient tidak ✅
- [ ] Doctor: akses patient/appointment ✅, tidak akses admin ✅
- [ ] Patient: akses profile sendiri ✅, tidak akses patient list/admin ✅

---

### 2.2 Permission Hierarchy Testing

**Tujuan**: Memastikan permission inheritance dan hierarchy bekerja

```bash
# Test 1: Admin punya semua permission
curl -X GET http://localhost:4000/admin/permissions \
  -H "Authorization: Bearer $adminToken"
# Expected: ✅ 200 OK - List semua permission

# Test 2: Check permission inheritance
curl -X POST http://localhost:4000/roles/check-permission \
  -H "Authorization: Bearer $adminToken" \
  -H 'Content-Type: application/json' \
  -d '{"roleId":"admin","permission":"user.delete"}'
# Expected: ✅ 200 OK - { "hasPermission": true }

# Test 3: Check permission denial
curl -X POST http://localhost:4000/roles/check-permission \
  -H "Authorization: Bearer $patientToken" \
  -H 'Content-Type: application/json' \
  -d '{"roleId":"patient","permission":"user.delete"}'
# Expected: ✅ 200 OK - { "hasPermission": false }
```

**Verifikasi Hasil**:
- [ ] Admin memiliki semua permission
- [ ] Doctor memiliki subset permission
- [ ] Patient memiliki permission terbatas

---

## 3. 🛡️ SQL INJECTION PROTECTION TESTING

### 3.1 Basic SQL Injection Test

**Tujuan**: Memastikan input tidak bisa mengubah SQL query

**Test Cases**:

```bash
# Test 1: SQL injection pada login email
curl -X POST http://localhost:4000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@test.com\" OR \"1\"=\"1","password":"anything"}'
# Expected: ❌ 400 Bad Request - Invalid email format
# OR ❌ 401 Unauthorized - Email/password mismatch
# NOT: ✅ Login berhasil (jika berhasil = VULNERABLE!)

# Test 2: SQL injection pada user search
curl -X GET "http://localhost:4000/users?search=test%27%20OR%20%271%27=%271" \
  -H "Authorization: Bearer $adminToken"
# Expected: ❌ 400 Bad Request (invalid input)
# NOT: ❌ Return semua users (jika terjadi = VULNERABLE!)

# Test 3: SQL injection pada POST body
curl -X POST http://localhost:4000/patients \
  -H "Authorization: Bearer $doctorToken" \
  -H 'Content-Type: application/json' \
  -d '{
    "name":"Test Patient\"; DROP TABLE patients; --",
    "email":"test@test.com"
  }'
# Expected: ❌ 400 Bad Request (invalid input)
# NOT: ❌ Table deleted (jika terjadi = VULNERABLE!)

# Test 4: Time-based SQL injection detection
# Gunakan parameterized query test
curl -X GET "http://localhost:4000/users?id=1 AND SLEEP(5)" \
  -H "Authorization: Bearer $adminToken"
# Expected: ❌ Response time normal (< 1 detik)
# NOT: ⏱️ Response time 5+ detik (jika terjadi = VULNERABLE!)
```

**Verifikasi Hasil**:
- [ ] SQL keywords dalam input ditolak/di-escape
- [ ] Response time konsisten (tidak ada delay dari SLEEP)
- [ ] Error message tidak menunjukkan struktur database

---

### 3.2 Parameterized Query Testing

**Tujuan**: Memastikan semua query menggunakan parameterized queries

```bash
# Test 1: Check query dengan special characters
curl -X GET "http://localhost:4000/patients?name=Test%27s%20Clinic" \
  -H "Authorization: Bearer $doctorToken"
# Expected: ✅ 200 OK - Mengembalikan results (jika ada)
# NOT: ❌ SQL error (jika SQL injection)

# Test 2: Check query dengan backslash
curl -X GET "http://localhost:4000/patients?name=Test%5C" \
  -H "Authorization: Bearer $doctorToken"
# Expected: ✅ 200 OK - Mengembalikan results (jika ada)
# NOT: ❌ SQL error

# Test 3: Check long string injection attempt
$longString = [string]::new('-', 10000) + "' OR '1'='1"
curl -X GET "http://localhost:4000/users?search=$longString" \
  -H "Authorization: Bearer $adminToken"
# Expected: ✅ 200 OK atau error (not SQL execution)
```

**Verifikasi Hasil**:
- [ ] Special characters di-handle dengan benar
- [ ] Tidak ada SQL error messages
- [ ] Query performance normal

---

## 4. 📊 AUDIT TRAIL & MONITORING TESTING

### 4.1 Audit Log Creation Testing

**Tujuan**: Memastikan semua action tercatat dalam audit log

```bash
# Test 1: Login audit trail
Write-Host "Test 1: Login audit trail"
curl -X POST http://localhost:4000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@test.com","password":"Test@12345"}'

# Verify audit log created
curl -X GET "http://localhost:4000/audit-logs?action=LOGIN" \
  -H "Authorization: Bearer $adminToken"
# Expected: ✅ 200 OK - Latest login tercatat

# Test 2: Create user audit trail
Write-Host "Test 2: Create user audit trail"
$newUserResponse = curl -X POST http://localhost:4000/users \
  -H "Authorization: Bearer $adminToken" \
  -H 'Content-Type: application/json' \
  -d '{
    "email":"newuser@test.com",
    "password":"NewUser@123",
    "name":"New User"
  }' -s | ConvertFrom-Json

$userId = $newUserResponse.id

# Verify audit log
curl -X GET "http://localhost:4000/audit-logs?action=CREATE&resource=USER&resourceId=$userId" \
  -H "Authorization: Bearer $adminToken"
# Expected: ✅ 200 OK - User creation tercatat

# Test 3: Update user audit trail
Write-Host "Test 3: Update user audit trail"
curl -X PUT "http://localhost:4000/users/$userId" \
  -H "Authorization: Bearer $adminToken" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Updated User"}'

# Verify audit log
curl -X GET "http://localhost:4000/audit-logs?action=UPDATE&resource=USER&resourceId=$userId" \
  -H "Authorization: Bearer $adminToken"
# Expected: ✅ 200 OK - Update tercatat

# Test 4: Delete user audit trail
Write-Host "Test 4: Delete user audit trail"
curl -X DELETE "http://localhost:4000/users/$userId" \
  -H "Authorization: Bearer $adminToken"

# Verify audit log
curl -X GET "http://localhost:4000/audit-logs?action=DELETE&resource=USER&resourceId=$userId" \
  -H "Authorization: Bearer $adminToken"
# Expected: ✅ 200 OK - Deletion tercatat
```

**Audit Log Structure yang Harus Ada**:
```json
{
  "id": "uuid",
  "userId": "user-who-performed-action",
  "action": "CREATE|UPDATE|DELETE|LOGIN|LOGOUT",
  "resource": "USER|PATIENT|DOCTOR|APPOINTMENT",
  "resourceId": "target-resource-id",
  "changes": {
    "before": {...},
    "after": {...}
  },
  "ipAddress": "192.168.x.x",
  "userAgent": "Mozilla/5.0...",
  "timestamp": "2026-06-08T10:30:00Z"
}
```

**Verifikasi Hasil**:
- [ ] Setiap login tercatat dengan timestamp
- [ ] CREATE action tercatat dengan user ID yang melakukan
- [ ] UPDATE action mencatat perubahan (before/after)
- [ ] DELETE action tercatat
- [ ] IP Address tercatat di setiap action

---

### 4.2 Audit Log Access Control Testing

```bash
# Test 1: Admin bisa view semua audit logs
curl -X GET http://localhost:4000/audit-logs \
  -H "Authorization: Bearer $adminToken"
# Expected: ✅ 200 OK - List semua audit logs

# Test 2: Doctor bisa view audit logs yang related dgn dia
curl -X GET http://localhost:4000/audit-logs?userId=DOCTOR_ID \
  -H "Authorization: Bearer $doctorToken"
# Expected: ✅ 200 OK (depends on implementation)

# Test 3: Patient TIDAK bisa view audit logs
curl -X GET http://localhost:4000/audit-logs \
  -H "Authorization: Bearer $patientToken"
# Expected: ❌ 403 Forbidden - Insufficient permissions

# Test 4: Admin TIDAK bisa delete audit logs
curl -X DELETE http://localhost:4000/audit-logs/AUDIT_LOG_ID \
  -H "Authorization: Bearer $adminToken"
# Expected: ❌ 403 Forbidden (audit log immutable)
```

**Verifikasi Hasil**:
- [ ] Admin bisa view semua audit logs
- [ ] Non-admin tidak bisa view/delete audit logs
- [ ] Audit logs tidak bisa dihapus (immutable)

---

### 4.3 Suspicious Activity Detection Testing

```bash
# Test 1: Failed login attempts detection
Write-Host "Test 1: Detecting failed login attempts"
for ($i=1; $i -le 6; $i++) {
  curl -s -X POST http://localhost:4000/auth/login \
    -H 'Content-Type: application/json' \
    -d '{"email":"test@test.com","password":"wrong"}' > $null
}

# Check if suspicious activity recorded
curl -X GET "http://localhost:4000/audit-logs?action=FAILED_LOGIN&userId=TEST_USER_ID" \
  -H "Authorization: Bearer $adminToken"
# Expected: ✅ 200 OK - 6 failed login attempts tercatat

# Test 2: Check if account locked after failed attempts
curl -X POST http://localhost:4000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@test.com","password":"Test@12345"}'
# Expected: ❌ 429 Too Many Requests atau ❌ 401 Account locked

# Test 3: Multiple IP address login detection
# Simulate login dari IP berbeda (perlu mock atau proxy)
# Expected: ✅ Alert recorded dalam audit log
```

**Verifikasi Hasil**:
- [ ] Failed login attempts tercatat
- [ ] Account lock setelah N failed attempts
- [ ] IP changes dapat terdeteksi

---

## 5. 🔐 DATA PROTECTION TESTING

### 5.1 Password Encryption Testing

```bash
# Test 1: Verify password tidak stored in plaintext
# Connect ke database
# SELECT passwordHash FROM users WHERE email = 'test@test.com';
# Expected: ✅ passwordHash adalah bcrypt hash (starts with $2a$ atau $2b$)
# NOT: ❌ Plaintext password

Write-Host "Checking password hash in database..."
# Menggunakan Prisma Studio
# npx prisma studio
# Navigate ke Users table
# Expected: Password visible sebagai hash, bukan plaintext

# Test 2: Verify bcrypt salt rounds
# Hash harus contain salt rounds (usually $2a$10$ atau lebih)
# Example hash: $2a$10$n9qo8uLOickgx2ZMRZoMyeAm7wjY73U.4cKxn3LLz.N4qqvjmX9qq
Write-Host "Verify bcrypt strength"
# 10 rounds = 10^10 iterations (strong)
# Minimal 10 rounds recommended

# Test 3: Test password verification
curl -X POST http://localhost:4000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@test.com","password":"Test@12345"}'
# Expected: ✅ 200 OK - Login berhasil dengan password benar

curl -X POST http://localhost:4000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@test.com","password":"WrongPassword"}'
# Expected: ❌ 401 Unauthorized - Password salah
```

**Verifikasi Hasil**:
- [ ] Database tidak ada plaintext password
- [ ] Semua password di-hash dengan bcrypt
- [ ] Hash format $2a$10$ atau lebih (minimal 10 rounds)

---

### 5.2 Sensitive Data Masking

```bash
# Test 1: Password field tidak di-return di API response
$loginResponse = curl -X POST http://localhost:4000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@test.com","password":"Test@12345"}' -s | ConvertFrom-Json

Write-Host "Login Response:"
Write-Host $loginResponse | ConvertTo-Json

# Expected: Response hanya berisi:
# - accessToken
# - refreshToken
# - user.id, user.email, user.name, user.role
# NOT: password atau passwordHash

# Test 2: User profile endpoint
curl -X GET http://localhost:4000/users/profile \
  -H "Authorization: Bearer $adminToken" -s | ConvertFrom-Json | ConvertTo-Json
# Expected: Tidak ada password atau passwordHash field

# Test 3: User list endpoint
curl -X GET http://localhost:4000/users \
  -H "Authorization: Bearer $adminToken" -s | ConvertFrom-Json | ConvertTo-Json
# Expected: Users list tidak menampilkan password field

# Test 4: Patient medical data protection
curl -X GET http://localhost:4000/patients \
  -H "Authorization: Bearer $doctorToken"
# Expected: Medical data hanya visible untuk authorized doctor
```

**Verifikasi Hasil**:
- [ ] Password TIDAK di-return dalam API responses
- [ ] Sensitive fields (SSN, phone, address) masked atau restricted
- [ ] Only authorized users dapat view sensitive data

---

### 5.3 Data in Transit Protection (HTTPS/TLS)

```bash
# Test 1: Force HTTPS
# Konfigurasi di main.ts atau nginx

# Test 2: Check if app accepts HTTP
curl -X GET http://localhost:4000/users/profile
# Expected: ❌ Connection refused atau ❌ Redirect to HTTPS
# Untuk development, HTTP mungkin masih diallow

# Test 3: Check SSL/TLS certificate (production)
# openssl s_client -connect yourdomain.com:443
# Expected: Valid certificate issued for domain

# Test 4: Check security headers
curl -I http://localhost:4000/users/profile \
  -H "Authorization: Bearer $adminToken"
# Expected response headers harus include:
# - Strict-Transport-Security: max-age=31536000
# - X-Content-Type-Options: nosniff
# - X-Frame-Options: DENY
# - Content-Security-Policy: appropriate policy
```

**Verifikasi Hasil**:
- [ ] HTTPS enforce (bisa konfigurasi di production)
- [ ] Valid SSL certificate (untuk production)
- [ ] Security headers presence

---

## 6. 💾 BACKUP & RECOVERY TESTING

### 6.1 Backup Creation Testing

```bash
# Test 1: Manual backup creation
curl -X POST http://localhost:4000/backup/create \
  -H "Authorization: Bearer $adminToken" \
  -H 'Content-Type: application/json' \
  -d '{
    "type":"full",
    "compression":"gzip",
    "encryption":true
  }'
# Expected: ✅ 200 OK - Backup created
# Response:
# {
#   "id": "backup-uuid",
#   "status": "completed",
#   "timestamp": "2026-06-08T10:30:00Z",
#   "size": "125MB",
#   "location": "/backups/backup-uuid.tar.gz"
# }

# Test 2: Verify backup file exists
# Check direktori backup
Get-ChildItem -Path "d:\temp\SIMRS bagus\apps\backend\backups" -Recurse
# Expected: File backup ada dengan format: YYYY-MM-DD_HH-MM-SS.tar.gz

# Test 3: List all backups
curl -X GET http://localhost:4000/backup/list \
  -H "Authorization: Bearer $adminToken"
# Expected: ✅ 200 OK - List semua backups
# Response:
# [
#   {
#     "id": "backup-1",
#     "timestamp": "2026-06-08T10:00:00Z",
#     "size": "125MB",
#     "status": "completed"
#   },
#   ...
# ]
```

**Verifikasi Hasil**:
- [ ] Backup created successfully
- [ ] Backup file ada di storage
- [ ] Backup list endpoint berfungsi
- [ ] Backup size reasonable

---

### 6.2 Backup Integrity Testing

```bash
# Test 1: Verify backup integrity
curl -X POST http://localhost:4000/backup/verify \
  -H "Authorization: Bearer $adminToken" \
  -H 'Content-Type: application/json' \
  -d '{"backupId":"backup-uuid"}'
# Expected: ✅ 200 OK
# Response:
# {
#   "status": "verified",
#   "checksumValid": true,
#   "corruptedFiles": 0
# }

# Test 2: Restore dari backup
# PERHATIAN: Hanya lakukan testing di database testing, JANGAN production!
curl -X POST http://localhost:4000/backup/restore \
  -H "Authorization: Bearer $adminToken" \
  -H 'Content-Type: application/json' \
  -d '{
    "backupId":"backup-uuid",
    "targetDatabase":"testing_restore"
  }'
# Expected: ✅ 200 OK - Restore started
# Response:
# {
#   "restoreId": "restore-uuid",
#   "status": "in_progress",
#   "estimatedTime": "5 minutes"
# }

# Test 3: Monitor restore progress
curl -X GET http://localhost:4000/backup/restore-status/restore-uuid \
  -H "Authorization: Bearer $adminToken"
# Expected: Progress update setiap 5-10 detik
```

**Verifikasi Hasil**:
- [ ] Backup integrity verified
- [ ] Checksum match
- [ ] Restore process dapat dimulai
- [ ] Restore progress dapat dimonitor

---

### 6.3 Recovery Testing

```bash
# Test 1: Verify restored data
# Setelah restore selesai, verify data
curl -X GET http://localhost:4000/patients?database=testing_restore \
  -H "Authorization: Bearer $adminToken"
# Expected: ✅ 200 OK - Data matches pre-backup state

# Test 2: Check data consistency
# Verify primary keys, foreign keys, constraints
# Query:
# SELECT COUNT(*) FROM patients;
# SELECT COUNT(*) FROM appointments;
# Expected: Counts match backup state

# Test 3: Automated backup schedule
# Test if scheduled backups run automatically
# Check backup schedule:
curl -X GET http://localhost:4000/backup/schedule \
  -H "Authorization: Bearer $adminToken"
# Expected: ✅ 200 OK
# Response:
# {
#   "dailyBackup": {
#     "enabled": true,
#     "time": "02:00", // 2 AM
#     "retention": "30 days"
#   },
#   "weeklyBackup": {
#     "enabled": true,
#     "day": "sunday",
#     "time": "03:00"
#   }
# }

# Wait 24 hours atau simulate ke next backup time
# Then verify backup created automatically
```

**Verifikasi Hasil**:
- [ ] Backup restore successfully
- [ ] Data consistency maintained
- [ ] Automated backup schedule working
- [ ] Retention policy respected

---

### 6.4 Backup Access Control Testing

```bash
# Test 1: Only admin dapat access backup endpoints
curl -X GET http://localhost:4000/backup/list \
  -H "Authorization: Bearer $doctorToken"
# Expected: ❌ 403 Forbidden - Insufficient permissions

curl -X GET http://localhost:4000/backup/list \
  -H "Authorization: Bearer $patientToken"
# Expected: ❌ 403 Forbidden

# Test 2: Backup restore requires explicit permission
curl -X POST http://localhost:4000/backup/restore \
  -H "Authorization: Bearer $adminToken" \
  -H 'Content-Type: application/json' \
  -d '{"backupId":"backup-uuid","targetDatabase":"production"}'
# Expected: Might return warning atau require additional confirmation
```

**Verifikasi Hasil**:
- [ ] Only ADMIN role dapat access backup endpoints
- [ ] Doctor & Patient cannot list/restore backups
- [ ] Restore to production requires explicit confirmation

---

## 📊 TEST AUTOMATION SCRIPTS

### PowerShell Testing Suite

Buat file: `security-tests.ps1`

```powershell
# Security Testing Suite untuk SIMRS

# ===== CONFIGURATION =====
$apiBase = "http://localhost:4000"
$adminEmail = "admin@test.com"
$adminPassword = "Admin@12345"

# ===== HELPER FUNCTIONS =====

function Test-Authentication {
    Write-Host "`n=== TESTING AUTHENTICATION ===" -ForegroundColor Green
    
    # Get tokens
    $loginResponse = curl -X POST "$apiBase/auth/login" `
        -H 'Content-Type: application/json' `
        -d "{`"email`":`"$adminEmail`",`"password`":`"$adminPassword`"}" -s | ConvertFrom-Json
    
    $accessToken = $loginResponse.accessToken
    
    # Test 1: Rate limiting
    Write-Host "`n[TEST] Rate Limiting..." -ForegroundColor Yellow
    for ($i=1; $i -le 6; $i++) {
        $response = curl -s -X POST "$apiBase/auth/login" `
            -H 'Content-Type: application/json' `
            -d '{"email":"test@test.com","password":"wrong"}'
        
        if ($response -match "429") {
            Write-Host "✅ Rate limiting triggered on attempt $i" -ForegroundColor Green
            break
        }
    }
    
    # Test 2: Token validation
    Write-Host "`n[TEST] Token Validation..." -ForegroundColor Yellow
    $response = curl -s -X GET "$apiBase/users/profile" `
        -H "Authorization: Bearer $accessToken"
    
    if ($response -notmatch "error" -and $response -notmatch "401") {
        Write-Host "✅ Valid token accepted" -ForegroundColor Green
    } else {
        Write-Host "❌ Valid token rejected" -ForegroundColor Red
    }
}

function Test-Authorization {
    Write-Host "`n=== TESTING AUTHORIZATION ===" -ForegroundColor Green
    
    # Get patient token
    $patientLogin = curl -s -X POST "$apiBase/auth/login" `
        -H 'Content-Type: application/json' `
        -d '{"email":"patient@test.com","password":"Patient@12345"}' | ConvertFrom-Json
    
    $patientToken = $patientLogin.accessToken
    
    # Test: Patient cannot access admin panel
    Write-Host "`n[TEST] RBAC - Patient access admin..." -ForegroundColor Yellow
    $response = curl -s -X GET "$apiBase/admin/dashboard" `
        -H "Authorization: Bearer $patientToken"
    
    if ($response -match "403") {
        Write-Host "✅ Patient blocked from admin panel" -ForegroundColor Green
    } else {
        Write-Host "❌ Patient can access admin panel (SECURITY ISSUE!)" -ForegroundColor Red
    }
}

function Test-AuditLog {
    Write-Host "`n=== TESTING AUDIT LOGS ===" -ForegroundColor Green
    
    # Get admin token
    $adminLogin = curl -s -X POST "$apiBase/auth/login" `
        -H 'Content-Type: application/json' `
        -d "{`"email`":`"$adminEmail`",`"password`":`"$adminPassword`"}" | ConvertFrom-Json
    
    $adminToken = $adminLogin.accessToken
    
    # Test: Audit log created for login
    Write-Host "`n[TEST] Audit log on login..." -ForegroundColor Yellow
    $response = curl -s -X GET "$apiBase/audit-logs?action=LOGIN&limit=1" `
        -H "Authorization: Bearer $adminToken" | ConvertFrom-Json
    
    if ($response.Count -gt 0 -or $response.id) {
        Write-Host "✅ Login recorded in audit log" -ForegroundColor Green
    } else {
        Write-Host "⚠️ No recent login in audit log" -ForegroundColor Yellow
    }
}

# ===== RUN ALL TESTS =====

Write-Host "Starting Security Testing Suite" -ForegroundColor Cyan
Write-Host "Target: $apiBase`n" -ForegroundColor Cyan

Test-Authentication
Test-Authorization
Test-AuditLog

Write-Host "`n=== TESTING COMPLETED ===" -ForegroundColor Green
```

**Jalankan script**:
```bash
cd d:\temp\SIMRS\ bagus
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
.\security-tests.ps1
```

---

## ✅ SECURITY TESTING CHECKLIST

### Phase 1: Authentication (Hours 1-2)
- [ ] Password complexity validation
  - [ ] Minimum 8 characters
  - [ ] Uppercase letter required
  - [ ] Lowercase letter required
  - [ ] Number required
  - [ ] Special character required
- [ ] Rate limiting on login (6 attempts per minute)
- [ ] Account lockout mechanism
- [ ] Token expiration (15 minutes)
- [ ] Token refresh mechanism
- [ ] Invalid token rejection

### Phase 2: Authorization (Hours 2-3)
- [ ] Admin role access to admin panel
- [ ] Doctor role cannot access admin panel
- [ ] Patient role limited access
- [ ] Permission hierarchy working
- [ ] Role-based resource filtering

### Phase 3: SQL Injection (Hours 3-4)
- [ ] SQL keywords rejected
- [ ] Parameterized queries used
- [ ] No SQL errors in response
- [ ] Time-based injection blocked

### Phase 4: Audit Trail (Hours 4-5)
- [ ] Login events logged
- [ ] CREATE events logged with metadata
- [ ] UPDATE events log changes (before/after)
- [ ] DELETE events logged
- [ ] Audit logs immutable (cannot delete)
- [ ] IP Address logged

### Phase 5: Data Protection (Hours 5-6)
- [ ] Passwords hashed with bcrypt
- [ ] Password field not in API responses
- [ ] Sensitive data masked in responses
- [ ] HTTPS configured (or plan for production)

### Phase 6: Backup & Recovery (Hours 6-7)
- [ ] Backup creation works
- [ ] Backup file exists in storage
- [ ] Backup list endpoint working
- [ ] Backup integrity verification works
- [ ] Restore from backup works
- [ ] Only admin can access backup endpoints
- [ ] Automated backup schedule configured

### Overall Security Score
- 6/6 phases complete = 🟢 PRODUCTION READY
- 5/6 phases complete = 🟠 ALMOST READY (fix remaining)
- 4/6 phases complete = 🟡 NEEDS WORK
- <4/6 phases complete = 🔴 NOT READY FOR PRODUCTION

---

## 🔗 REFERENCES

**Useful Links**:
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [NestJS Security Best Practices](https://docs.nestjs.com/security)
- [HIPAA Compliance for Healthcare Systems](https://www.hhs.gov/hipaa)

**Tools**:
- **Postman**: https://www.postman.com/
- **Burp Suite**: https://portswigger.net/burp
- **OWASP ZAP**: https://www.zaproxy.org/

---

**Last Updated**: 2026-06-08
**Status**: 🟢 COMPLETE & READY FOR TESTING

