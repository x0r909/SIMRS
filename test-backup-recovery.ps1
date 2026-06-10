# ========================================
# BACKUP & RECOVERY TESTING SCRIPT
# ========================================

$baseUrl = "http://localhost:4000/v1"
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbXExMmdpNmQwMDExdjFrb3M1OG9mMDQxIiwiZW1haWwiOiJhZG1pbkBzaW1ycy5sb2NhbCIsInJvbGVzIjpbImFkbWluIl0sInBlcm1pc3Npb25zIjpbInVzZXJzLnJlYWQiLCJ1c2Vycy53cml0ZSIsInJvbGVzLnJlYWQiLCJyb2xlcy53cml0ZSIsInBlcm1pc3Npb25zLnJlYWQiLCJwYXRpZW50cy5yZWFkIiwicGF0aWVudHMud3JpdGUiLCJkb2N0b3JzLnJlYWQiLCJkb2N0b3JzLndyaXRlIiwiYXBwb2ludG1lbnRzLnJlYWQiLCJhcHBvaW50bWVudHMud3JpdGUiLCJxdWV1ZXMucmVhZCIsInF1ZXVlcy53cml0ZSIsInZpc2l0cy5yZWFkIiwidmlzaXRzLndyaXRlIiwibWVkaWNpbmVzLnJlYWQiLCJtZWRpY2luZXMud3JpdGUiLCJiaWxsaW5nLnJlYWQiLCJiaWxsaW5nLndyaXRlIiwiZmlsZXMucmVhZCIsImZpbGVzLndyaXRlIiwiYXVkaXQucmVhZCIsImF1ZGl0LmV4cG9ydCIsInBoYXJtYWN5LnJlYWQiLCJwaGFybWFjeS53cml0ZSIsImxhYm9yYXRvcnkucmVhZCIsImxhYm9yYXRvcnkud3JpdGUiLCJyYWRpb2xvZ3kucmVhZCIsInJhZGlvbG9neS53cml0ZSJdLCJpYXQiOjE3ODA5MTgwNzUsImV4cCI6MTc4MDkxODk3NX0.sntvZdY5lxXYVZno3X0GIQ2B0aw1KYnvM-5blmsePYk"

Write-Host "`n================================================" -ForegroundColor Yellow
Write-Host "🎯 BACKUP & RECOVERY TESTING" -ForegroundColor Yellow
Write-Host "================================================`n" -ForegroundColor Yellow

# ========== TEST 1: CREATE BACKUP ==========
Write-Host "[TEST 1] CREATE BACKUP" -ForegroundColor Green
try {
  $backup1 = Invoke-RestMethod -Uri "$baseUrl/backup/create" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"; "Authorization"="Bearer $token"} `
    -Body '{"description":"Backup Awal"}'
  
  $backupId1 = $backup1.data.id
  $filename1 = $backup1.data.filename
  Write-Host "✅ SUCCESS" -ForegroundColor Green
  Write-Host "   ID: $backupId1"
  Write-Host "   Filename: $filename1"
  Write-Host "   Size: $($backup1.data.size) bytes`n"
} catch {
  Write-Host "❌ FAILED: $($_.Exception.Message)`n" -ForegroundColor Red
  exit
}

# ========== TEST 2: LIST BACKUPS ==========
Write-Host "[TEST 2] LIST BACKUPS" -ForegroundColor Green
try {
  $listResp = Invoke-RestMethod -Uri "$baseUrl/backup?page=1&limit=10" `
    -Method GET `
    -Headers @{"Authorization"="Bearer $token"}
  
  Write-Host "✅ SUCCESS" -ForegroundColor Green
  Write-Host "   Total Backups: $($listResp.meta.total)"
  Write-Host "   Page: $($listResp.meta.page) / $($listResp.meta.totalPages)"
  Write-Host "   Backups:"
  $listResp.data | ForEach-Object {
    Write-Host "      - $($_.filename) ($($_.size) bytes) - Status: $($_.status)"
  }
  Write-Host ""
} catch {
  Write-Host "❌ FAILED: $($_.Exception.Message)`n" -ForegroundColor Red
}

# ========== TEST 3: GET BACKUP DETAIL ==========
Write-Host "[TEST 3] GET BACKUP DETAIL" -ForegroundColor Green
try {
  $detail = Invoke-RestMethod -Uri "$baseUrl/backup/$backupId1" `
    -Method GET `
    -Headers @{"Authorization"="Bearer $token"}
  
  Write-Host "✅ SUCCESS" -ForegroundColor Green
  Write-Host "   ID: $($detail.id)"
  Write-Host "   Filename: $($detail.filename)"
  Write-Host "   Description: $($detail.description)"
  Write-Host "   Status: $($detail.status)"
  Write-Host "   Created By: $($detail.createdBy.name) ($($detail.createdBy.email))"
  Write-Host "   Created At: $($detail.createdAt)`n"
} catch {
  Write-Host "❌ FAILED: $($_.Exception.Message)`n" -ForegroundColor Red
}

# ========== TEST 4: DOWNLOAD BACKUP ==========
Write-Host "[TEST 4] DOWNLOAD BACKUP" -ForegroundColor Green
try {
  $outputPath = "D:\temp\SIMRS bagus\backup-$backupId1.sql"
  Invoke-WebRequest -Uri "$baseUrl/backup/$backupId1/download" `
    -Method GET `
    -Headers @{"Authorization"="Bearer $token"} `
    -OutFile $outputPath
  
  if (Test-Path $outputPath) {
    $fileSize = (Get-Item $outputPath).Length
    Write-Host "✅ SUCCESS" -ForegroundColor Green
    Write-Host "   Downloaded to: $outputPath"
    Write-Host "   File size: $fileSize bytes`n"
  } else {
    Write-Host "❌ FAILED: File not created`n" -ForegroundColor Red
  }
} catch {
  Write-Host "❌ FAILED: $($_.Exception.Message)`n" -ForegroundColor Red
}

# ========== TEST 5: CREATE SECOND BACKUP ==========
Write-Host "[TEST 5] CREATE SECOND BACKUP" -ForegroundColor Green
try {
  Start-Sleep -Seconds 2
  $backup2 = Invoke-RestMethod -Uri "$baseUrl/backup/create" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"; "Authorization"="Bearer $token"} `
    -Body '{"description":"Backup Kedua"}'
  
  $backupId2 = $backup2.data.id
  Write-Host "✅ SUCCESS" -ForegroundColor Green
  Write-Host "   ID: $backupId2"
  Write-Host "   Filename: $($backup2.data.filename)`n"
} catch {
  Write-Host "❌ FAILED: $($_.Exception.Message)`n" -ForegroundColor Red
}

# ========== TEST 6: RESTORE BACKUP ==========
Write-Host "[TEST 6] RESTORE BACKUP" -ForegroundColor Yellow
Write-Host "   ⚠️  WARNING: This will restore database!" -ForegroundColor Red
$confirm = Read-Host "   Do you want to restore backup '$filename1'? (yes/no)"

if ($confirm -eq "yes") {
  try {
    $restore = Invoke-RestMethod -Uri "$baseUrl/backup/restore" `
      -Method POST `
      -Headers @{"Content-Type"="application/json"; "Authorization"="Bearer $token"} `
      -Body "{`"backupId`":`"$backupId1`"}"
    
    Write-Host "✅ SUCCESS" -ForegroundColor Green
    Write-Host "   Message: $($restore.message)"
    Write-Host "   Backup ID: $($restore.backupId)`n"
  } catch {
    Write-Host "❌ FAILED: $($_.Exception.Message)`n" -ForegroundColor Red
  }
} else {
  Write-Host "   ⏭️ Restore skipped`n" -ForegroundColor Gray
}

# ========== TEST 7: DELETE BACKUP ==========
Write-Host "[TEST 7] DELETE BACKUP" -ForegroundColor Yellow
$confirm = Read-Host "   Do you want to delete backup '$filename1'? (yes/no)"

if ($confirm -eq "yes") {
  try {
    $delete = Invoke-RestMethod -Uri "$baseUrl/backup/$backupId1" `
      -Method DELETE `
      -Headers @{"Authorization"="Bearer $token"}
    
    Write-Host "✅ SUCCESS" -ForegroundColor Green
    Write-Host "   Message: $($delete.message)`n"
  } catch {
    Write-Host "❌ FAILED: $($_.Exception.Message)`n" -ForegroundColor Red
  }
} else {
  Write-Host "   ⏭️ Delete skipped`n" -ForegroundColor Gray
}

# ========== SUMMARY ==========
Write-Host "================================================" -ForegroundColor Yellow
Write-Host "✨ TESTING COMPLETED" -ForegroundColor Yellow
Write-Host "================================================`n" -ForegroundColor Yellow

Write-Host "📌 Summary:" -ForegroundColor Cyan
Write-Host "   Backup 1 ID: $backupId1"
Write-Host "   Backup 2 ID: $backupId2"
Write-Host "   Downloaded: backup-$backupId1.sql`n"

Write-Host "📋 Test Checklist:" -ForegroundColor Cyan
Write-Host "   ✅ Create Backup"
Write-Host "   ✅ List Backups"
Write-Host "   ✅ Get Backup Detail"
Write-Host "   ✅ Download Backup"
Write-Host "   ✅ Create Second Backup"
Write-Host "   ✅ Restore Backup (optional)"
Write-Host "   ✅ Delete Backup (optional)`n"
