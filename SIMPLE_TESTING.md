# 🧪 SIMPLE SECURITY TESTING

Testing 6 aspek keamanan: Copy-paste langsung di PowerShell terminal

---

## ✅ SETUP DULU

Backend running?
```bash
curl http://localhost:4000/health
```

Kalau return 200, lanjut testing!

---

## 1️⃣ AUTHENTICATION - Password & Login

```powershell
# TEST 1: Password terlalu pendek (harus FAIL = 400)
curl -X POST http://localhost:4000/auth/register `
  -H 'Content-Type: application/json' `
  -d '{"email":"test1@test.com","password":"Test@12"}'

# TEST 2: Password valid (harus PASS = 201)
curl -X POST http://localhost:4000/auth/register `
  -H 'Content-Type: application/json' `
  -d '{"email":"test2@test.com","password":"Test@12345"}'

# TEST 3: Login dengan password benar
curl -X POST http://localhost:4000/auth/login `
  -H 'Content-Type: application/json' `
  -d '{"email":"admin@test.com","password":"Admin@12345"}'
# Expected: 200 OK dengan token

# TEST 4: Rate limiting - 6 attempt (harus 429)
for ($i=1; $i -le 6; $i++) {
  curl -s -X POST http://localhost:4000/auth/login `
    -H 'Content-Type: application/json' `
    -d '{"email":"test@test.com","password":"WRONG"}'
  Write-Host "Attempt $i"
}
```

---

## 2️⃣ AUTHORIZATION - Role Access

```powershell
# Get tokens
$admin = (curl -s -X POST http://localhost:4000/auth/login `
  -H 'Content-Type: application/json' `
  -d '{"email":"admin@test.com","password":"Admin@12345"}' | ConvertFrom-Json).accessToken

$patient = (curl -s -X POST http://localhost:4000/auth/login `
  -H 'Content-Type: application/json' `
  -d '{"email":"patient@test.com","password":"Patient@12345"}' | ConvertFrom-Json).accessToken

# TEST 1: Admin access admin panel (harus 200)
curl -X GET http://localhost:4000/admin/dashboard `
  -H "Authorization: Bearer $admin"

# TEST 2: Patient access admin panel (harus 403)
curl -X GET http://localhost:4000/admin/dashboard `
  -H "Authorization: Bearer $patient"

# TEST 3: Patient view profile (harus 200)
curl -X GET http://localhost:4000/users/profile `
  -H "Authorization: Bearer $patient"
```

---

## 3️⃣ SQL INJECTION - Input Validation

```powershell
# TEST 1: SQL injection (harus 400, bukan 200)
curl -X GET "http://localhost:4000/users?search=test' OR '1'='1" `
  -H "Authorization: Bearer $admin"

# TEST 2: Drop table (harus error, bukan executed)
curl -X GET "http://localhost:4000/users?search=1'; DROP TABLE users; --" `
  -H "Authorization: Bearer $admin"

# TEST 3: Response time normal
$start = Get-Date
curl -s -X GET "http://localhost:4000/users?search=test AND SLEEP(5)" `
  -H "Authorization: Bearer $admin" > $null
$duration = ((Get-Date) - $start).TotalSeconds
Write-Host "Response time: $([Math]::Round($duration, 2))s (should be < 1s)"
```

---

## 4️⃣ AUDIT TRAIL - Logging

```powershell
# TEST 1: View audit logs (harus 200)
curl -X GET "http://localhost:4000/audit-logs?limit=10" `
  -H "Authorization: Bearer $admin" | ConvertFrom-Json | ConvertTo-Json

# TEST 2: Patient cannot view logs (harus 403)
curl -X GET "http://localhost:4000/audit-logs" `
  -H "Authorization: Bearer $patient"

# TEST 3: Check if login was logged
curl -X GET "http://localhost:4000/audit-logs?action=LOGIN&limit=1" `
  -H "Authorization: Bearer $admin"
```

---

## 5️⃣ DATA PROTECTION - Masking

```powershell
# TEST 1: Check profile response - NO password field
$profile = curl -s -X GET http://localhost:4000/users/profile `
  -H "Authorization: Bearer $admin" | ConvertFrom-Json

Write-Host "Profile response:"
$profile | ConvertTo-Json

# Should have: id, email, name, role
# Should NOT have: password, passwordHash
```

---

## 6️⃣ BACKUP - Admin Only

```powershell
# TEST 1: Admin can list backups
curl -X GET "http://localhost:4000/backup/list" `
  -H "Authorization: Bearer $admin"

# TEST 2: Patient cannot list backups (harus 403)
curl -X GET "http://localhost:4000/backup/list" `
  -H "Authorization: Bearer $patient"
```

---

## 📊 SUCCESS CRITERIA

### ✅ PASSING (Expected Results)
- Auth: Password validated ✅, Rate limit works ✅
- Authz: Admin access works ✅, Patient denied ✅
- SQL: Injection blocked ✅, Response time normal ✅
- Audit: Logs recorded ✅, Patient cannot view ✅
- Data: No password in response ✅
- Backup: Admin only ✅

### 🎯 SCORE
- 6/6 = 🟢 PRODUCTION READY
- 4-5/6 = 🟠 MOSTLY READY
- <4/6 = 🔴 NEEDS WORK

---

**Done testing? Good! Move to next steps.** 🚀
