# 🚀 QUICK START - Security Testing

## 📋 Prerequisites

Pastikan backend sudah berjalan:

```bash
cd d:\temp\SIMRS\ bagus\apps\backend
pnpm dev
```

Backend harus running di `http://localhost:4000`

---

## ⚡ Quick Run

### Option 1: Run Automated Testing Script

```bash
# Terminal PowerShell
cd d:\temp\SIMRS\ bagus

# Run all tests
.\security-tests.ps1

# Run specific test type
.\security-tests.ps1 -TestType auth      # Authentication only
.\security-tests.ps1 -TestType authz     # Authorization only
.\security-tests.ps1 -TestType sql       # SQL Injection only
.\security-tests.ps1 -TestType audit     # Audit Trail only
.\security-tests.ps1 -TestType data      # Data Protection only
.\security-tests.ps1 -TestType backup    # Backup & Recovery only
```

### Option 2: Manual Testing dengan curl

#### 1️⃣ Authentication Testing (5 menit)

```bash
# Test 1: Valid Login
curl -X POST http://localhost:4000/auth/login `
  -H 'Content-Type: application/json' `
  -d '{"email":"admin@test.com","password":"Admin@12345"}'
# Expected: 200 OK dengan accessToken

# Test 2: Invalid Password
curl -X POST http://localhost:4000/auth/login `
  -H 'Content-Type: application/json' `
  -d '{"email":"admin@test.com","password":"WrongPassword"}'
# Expected: 401 Unauthorized

# Test 3: Rate Limiting (6 failed attempts)
for ($i=1; $i -le 6; $i++) {
  Write-Host "Attempt $i..."
  curl -s -X POST http://localhost:4000/auth/login `
    -H 'Content-Type: application/json' `
    -d '{"email":"test@test.com","password":"wrong"}'
}
# Attempt 6 Expected: 429 Too Many Requests
```

#### 2️⃣ Authorization Testing (5 menit)

```bash
# Get tokens
$admin = (curl -s -X POST http://localhost:4000/auth/login `
  -H 'Content-Type: application/json' `
  -d '{"email":"admin@test.com","password":"Admin@12345"}' | ConvertFrom-Json).accessToken

$patient = (curl -s -X POST http://localhost:4000/auth/login `
  -H 'Content-Type: application/json' `
  -d '{"email":"patient@test.com","password":"Patient@12345"}' | ConvertFrom-Json).accessToken

# Test 1: Admin can access admin panel
curl -X GET http://localhost:4000/admin/dashboard `
  -H "Authorization: Bearer $admin"
# Expected: 200 OK

# Test 2: Patient cannot access admin panel
curl -X GET http://localhost:4000/admin/dashboard `
  -H "Authorization: Bearer $patient"
# Expected: 403 Forbidden
```

#### 3️⃣ SQL Injection Testing (5 menit)

```bash
# Get admin token
$adminToken = (curl -s -X POST http://localhost:4000/auth/login `
  -H 'Content-Type: application/json' `
  -d '{"email":"admin@test.com","password":"Admin@12345"}' | ConvertFrom-Json).accessToken

# Test 1: Simple SQL injection
curl -X GET "http://localhost:4000/users?search=test' OR '1'='1" `
  -H "Authorization: Bearer $adminToken"
# Expected: 400 Bad Request (not successful query)

# Test 2: Drop table injection
curl -X GET "http://localhost:4000/users?search=1'; DROP TABLE users; --" `
  -H "Authorization: Bearer $adminToken"
# Expected: 400 Bad Request (protected)
```

#### 4️⃣ Audit Trail Testing (5 menit)

```bash
# Get admin token
$adminToken = (curl -s -X POST http://localhost:4000/auth/login `
  -H 'Content-Type: application/json' `
  -d '{"email":"admin@test.com","password":"Admin@12345"}' | ConvertFrom-Json).accessToken

# Test 1: View audit logs
curl -X GET "http://localhost:4000/audit-logs?limit=10" `
  -H "Authorization: Bearer $adminToken"
# Expected: 200 OK dengan list audit logs

# Test 2: Recent login should be in audit log
curl -X GET "http://localhost:4000/audit-logs?action=LOGIN&limit=1" `
  -H "Authorization: Bearer $adminToken"
# Expected: 200 OK dengan latest login entry
```

#### 5️⃣ Data Protection Testing (5 menit)

```bash
# Get admin token
$adminToken = (curl -s -X POST http://localhost:4000/auth/login `
  -H 'Content-Type: application/json' `
  -d '{"email":"admin@test.com","password":"Admin@12345"}' | ConvertFrom-Json).accessToken

# Test 1: Check profile response
$profile = curl -s -X GET "http://localhost:4000/users/profile" `
  -H "Authorization: Bearer $adminToken" | ConvertFrom-Json

Write-Host "Profile Response:"
$profile | ConvertTo-Json

# Expected: No "password" or "passwordHash" fields
# Should only have: id, email, name, role, etc.
```

#### 6️⃣ Backup Testing (5 menit)

```bash
# Get admin token
$adminToken = (curl -s -X POST http://localhost:4000/auth/login `
  -H 'Content-Type: application/json' `
  -d '{"email":"admin@test.com","password":"Admin@12345"}' | ConvertFrom-Json).accessToken

# Test 1: List backups
curl -X GET "http://localhost:4000/backup/list" `
  -H "Authorization: Bearer $adminToken"
# Expected: 200 OK dengan list backups (jika endpoint exists)

# Test 2: Patient cannot access backup
$patientToken = (curl -s -X POST http://localhost:4000/auth/login `
  -H 'Content-Type: application/json' `
  -d '{"email":"patient@test.com","password":"Patient@12345"}' | ConvertFrom-Json).accessToken

curl -X GET "http://localhost:4000/backup/list" `
  -H "Authorization: Bearer $patientToken"
# Expected: 403 Forbidden
```

---

## 📊 Testing Timeline

| Aspek | Durasi | Tool |
|-------|--------|------|
| **Authentication** | 5 min | curl + PowerShell |
| **Authorization** | 5 min | curl + PowerShell |
| **SQL Injection** | 5 min | curl + PowerShell |
| **Audit Trail** | 5 min | curl + PowerShell |
| **Data Protection** | 5 min | curl + PowerShell |
| **Backup & Recovery** | 5 min | curl + PowerShell |
| **TOTAL** | 30 min | Automated Script |

---

## ✅ Success Criteria

### 🟢 PRODUCTION READY (Score: 90-100%)
- ✅ All authentication tests pass
- ✅ RBAC properly enforced
- ✅ SQL injection blocked
- ✅ All actions audited
- ✅ Sensitive data protected
- ✅ Backups functional

### 🟠 ALMOST READY (Score: 70-89%)
- ✅ 5/6 security aspects working
- ⚠️ Minor issues found
- 📋 Action items to fix before production

### 🟡 NEEDS WORK (Score: 50-69%)
- ⚠️ 3-4 security aspects incomplete
- 📋 Multiple high-priority fixes needed

### 🔴 NOT READY (Score: <50%)
- ❌ Major security gaps
- 🚫 Not safe for production

---

## 🐛 Troubleshooting

### Backend tidak running
```bash
cd d:\temp\SIMRS\ bagus\apps\backend
npm install
npm run dev
```

### Connection refused di curl
```bash
# Cek port 4000 sudah listening
netstat -ano | findstr :4000

# Atau gunakan direct API test
$response = Invoke-RestMethod -Uri "http://localhost:4000/health"
```

### Authentication test failed
```bash
# Pastikan test user sudah ada
# Email: admin@test.com, Password: Admin@12345
# Email: doctor@test.com, Password: Doctor@12345
# Email: patient@test.com, Password: Patient@12345

# Atau daftarkan user baru:
curl -X POST http://localhost:4000/auth/register `
  -H 'Content-Type: application/json' `
  -d '{
    "email":"newadmin@test.com",
    "password":"Admin@12345",
    "name":"New Admin"
  }'
```

### PowerShell execution policy error
```bash
# Allow script execution (current session only)
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process

# Then run script
.\security-tests.ps1
```

---

## 📝 Detailed Testing Guide

Untuk langkah-langkah testing yang lebih lengkap, buka:
👉 [SECURITY_TESTING_GUIDE.md](./SECURITY_TESTING_GUIDE.md)

---

## 🎯 Next Steps

1. **Run automated tests** → `.\security-tests.ps1`
2. **Review results** → Check success rate
3. **Fix issues** → Address any failed tests
4. **Re-test** → Run tests again
5. **Document findings** → Create security report

---

## 📞 Support

Untuk bantuan lebih lanjut:
- Baca [SECURITY_TESTING_GUIDE.md](./SECURITY_TESTING_GUIDE.md) untuk detail lengkap
- Buka file [SECURITY_AUDIT_IMPLEMENTATION_GUIDE.md](./SECURITY_AUDIT_IMPLEMENTATION_GUIDE.md) untuk konteks keamanan

---

**Last Updated**: 2026-06-08
