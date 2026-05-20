# 🎯 Activity Log / Audit Log - Modern Dashboard Implementation

## 📋 Overview

Fitur Activity Log/Audit Log yang modern dan lengkap untuk sistem rumah sakit SIMRS. Fitur ini mencatat semua aktivitas penting di sistem secara otomatis dengan dashboard admin yang profesional.

## ✨ Features

### ✅ Backend Features
- **Automatic Logging** - Middleware otomatis mencatat setiap request/response
- **Advanced Filtering** - Filter berdasarkan action, module, status, tanggal, user
- **Real-time Search** - Search across user, activity, description
- **Pagination** - Efficient data loading dengan limit & offset
- **Export Options** - Export ke Excel dan PDF
- **Statistics** - Summary stats harian (total activity, login, changes, errors)
- **Data Sanitization** - Sensitive data (password, token) di-redact otomatis

### ✅ Frontend Features  
- **Modern Dashboard** - SaaS-like design yang clean dan profesional
- **Real-time Updates** - Auto-refresh stats setiap 30 detik
- **Color-Coded Badges** - Visual distinction untuk setiap activity
- **Responsive Design** - Sempurna di mobile, tablet, desktop
- **Dark Mode Support** - Tema gelap tersedia
- **Loading States** - Skeleton loaders untuk UX yang smooth
- **Empty States** - Friendly messages ketika tidak ada data

## 📊 Data yang Dicatat

### 🔐 Authentication (AUTH Module)
```
- LOGIN - User berhasil login
- LOGOUT - User logout
- LOGIN_FAILED - Attempt login gagal
- CHANGE_PASSWORD - User ubah password
- RESET_PASSWORD - User reset password
```

### 👥 User Management (USER_MANAGEMENT Module)
```
- USER_CREATE - Admin buat user baru
- USER_UPDATE - Admin edit data user
- USER_DELETE - Admin hapus user
- ROLE_CHANGE - Admin ubah role user
```

### 🏥 Patient (PATIENT Module)
```
- PATIENT_REGISTER - Pasien registrasi di portal
- PATIENT_CREATE - Admin/staff tambah data pasien
- PATIENT_UPDATE - Edit data pasien
- PATIENT_DELETE - Hapus data pasien
```

### 📋 Medical Records (MEDICAL_RECORD Module)
```
- DIAGNOSIS_ADD - Dokter tambah diagnosa
- MEDICAL_RECORD_UPDATE - Update rekam medis
- PRESCRIPTION_ADD - Dokter tambah resep
- LAB_RESULT_UPLOAD - Hasil lab di-upload
```

### 📅 Appointment (APPOINTMENT Module)
```
- APPOINTMENT_BOOK - Jadwal baru di-booking
- APPOINTMENT_RESCHEDULE - Jadwal diubah
- APPOINTMENT_CANCEL - Jadwal dibatalkan
```

### 💊 Pharmacy (PHARMACY Module)
```
- MEDICINE_STOCK_ADD - Tambah stok obat
- MEDICINE_STOCK_UPDATE - Update stok obat
- MEDICINE_OUT - Obat keluar/dispensed
```

### ⚙️ System (SYSTEM Module)
```
- DATABASE_BACKUP - Backup database
- DATABASE_RESTORE - Restore database
- SYSTEM_ERROR - Error sistem terdeteksi
- SETTING_UPDATE - Setting sistem diubah
```

## 🎨 UI Components

### Dashboard Sections

#### 1. **Statistics Cards** (Top)
```
┌─────────────────────────────────────────┐
│ Total Aktivitas │ Total Login │ Perubahan │ Error │
│    Hari Ini     │   Hari Ini  │   Data    │ Sistem│
│      234        │     45      │    67     │   2   │
└─────────────────────────────────────────┘
```

#### 2. **Search & Filters** 
```
┌──────────────────────────────────────────────────────┐
│ 🔍 Cari berdasarkan user, aktivitas, atau deskripsi  │
├──────────────────────────────────────────────────────┤
│ [Aktivitas ▼] [Module ▼] [Status ▼] [📅] [📅] [Excel] [PDF]
└──────────────────────────────────────────────────────┘
```

#### 3. **Activity Table**
```
┌─────────────────────────────────────────────────────────────┐
│ Waktu         │ User       │ Role   │ Module │ Aktivitas │ ... │
├─────────────────────────────────────────────────────────────┤
│ 2 menit lalu  │ Admin User │ Admin  │ User   │ [Buat User] │ ... │
│ 15 menit lalu │ Dr. Andi   │ Doctor │ Patient│ [Edit Pasien]│ ... │
│ 1 jam lalu    │ Staff Rina │ Staff  │ Sistem │ [Error]    │ ... │
└─────────────────────────────────────────────────────────────┘
```

#### 4. **Pagination**
```
Menampilkan 1 hingga 20 dari 245 hasil
[◀ Sebelumnya] [1] [2] [3] [4] [5] [Berikutnya ▶]
```

## 🎯 Badge Colors

| Color  | Meaning | Actions |
|--------|---------|---------|
| 🟢 Green | Success | LOGIN, CREATE, ADD, REGISTER |
| 🔴 Red | Delete/Error | DELETE, FAILED, ERROR |
| 🔵 Blue | Update/Info | UPDATE, RESCHEDULE, LOGOUT |
| 🟡 Yellow | Warning | WARNING, FAILED attempts |

## 🔧 Setup & Installation

### 1. **Database Migration**

```bash
# Update Prisma schema
cd packages/db

# Run migration
npx prisma migrate dev --name add_audit_log_enums

# Or manually sync
npx prisma db push
```

### 2. **Backend Dependencies**

```bash
# Install required packages
cd apps/backend

npm install exceljs pdfkit
npm install --save-dev @types/pdfkit
```

### 3. **Frontend Dependencies**

```bash
# date-fns usually already installed
cd apps/frontend

npm install date-fns
```

### 4. **Seed Data**

```bash
# Run seeder dari root project
npx prisma db seed

# Ini akan generate 40 audit log entries dummy
```

## 📡 API Endpoints

### GET `/v1/audit-logs`
Fetch activity logs dengan filtering

**Query Parameters:**
```
- page: number (default: 1)
- limit: number (default: 20)
- search: string (cari user/activity/description)
- action: AuditAction (filter by action)
- module: AuditModule (filter by module)
- status: AuditStatus (SUCCESS|FAILED|ERROR|WARNING)
- userId: string (filter by user)
- startDate: ISO date string
- endDate: ISO date string
- sortOrder: 'asc' | 'desc' (default: desc)
```

**Response:**
```json
{
  "data": [
    {
      "id": "cuid",
      "action": "LOGIN",
      "module": "AUTH",
      "status": "SUCCESS",
      "entity": "User",
      "entityId": "user-id",
      "description": "User login",
      "createdAt": "2024-05-13T10:30:00Z",
      "actor": {
        "id": "admin-id",
        "name": "Admin User",
        "email": "admin@simrs.local",
        "roles": [{"role": {"name": "Admin", "key": "admin"}}]
      },
      "ip": "192.168.1.1"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 245,
    "totalPages": 13
  }
}
```

### GET `/v1/audit-logs/stats`
Get daily statistics

**Response:**
```json
{
  "totalActivityToday": 234,
  "totalLogin": 45,
  "totalDataChanges": 67,
  "totalErrors": 2
}
```

### GET `/v1/audit-logs/export/excel`
Download Excel file

**Response:** Binary file (xlsx)

### GET `/v1/audit-logs/export/pdf`
Download PDF file

**Response:** Binary file (pdf)

## 🔐 Permissions Required

- `audit.read` - View activity logs (Admin only)
- `audit.export` - Export logs (Admin only)

## 📂 File Structure

```
Backend:
apps/backend/src/modules/audit-logs/
├── audit.types.ts                 # Type definitions
├── audit.service.ts               # Business logic & queries
├── audit-logs.controller.ts        # API endpoints
├── audit-logging.middleware.ts     # Auto logging middleware
├── audit-logs.module.ts            # NestJS module

Frontend:
apps/frontend/src/
├── lib/
│   ├── audit-api.ts               # API client
│   └── audit-utils.ts             # Utility functions
├── components/audit/
│   ├── stat-card.tsx              # Statistics cards
│   ├── audit-table.tsx            # Main table
│   ├── audit-filters.tsx          # Filter controls
│   ├── audit-pagination.tsx       # Pagination
│   └── audit-skeleton.tsx         # Loading states
└── app/(app)/admin/activity-log/
    └── page.tsx                   # Dashboard page

Database:
packages/db/
├── prisma/
│   ├── schema.prisma              # Updated with AuditLog enums
│   ├── seed.ts                    # Updated seeder
│   └── seeders/
│       └── audit-logs.seeder.ts   # Audit log seeder
```

## 🚀 Deployment Steps

### 1. Database
```bash
# In packages/db folder
npx prisma migrate deploy
```

### 2. Backend Build
```bash
# Install dependencies
npm install

# Run seed (optional, for test data)
npx prisma db seed

# Start backend
npm run start:prod
```

### 3. Frontend Build
```bash
# Install dependencies
npm install

# Build
npm run build

# Start frontend
npm run start
```

## 🧪 Testing

### Test Login & Activity Log
1. Open http://localhost:3000/login
2. Login dengan credentials
3. Go to `/admin/activity-log`
4. Anda akan melihat "LOGIN" activity yang tercatat

### Test Filtering
1. Filter by action: "Login"
2. Filter by module: "Auth"
3. Filter by status: "Success"
4. Search: cek user yang di-filter

### Test Export
1. Click "Excel" - File akan di-download
2. Click "PDF" - File akan di-download

## 📊 Performance Considerations

- **Indexing**: Kolom createdAt, actorId, action, module sudah di-index
- **Pagination**: Default 20 per page, maksimal 1000
- **Query Optimization**: Parallel queries untuk stats
- **Data Cleanup**: Automated cleanup script untuk old logs (optional, belum diimplementasikan)

## 🔒 Security

- ✅ JWT authentication required
- ✅ Permission-based access control
- ✅ Sensitive data sanitization (password, token, credit card, dll)
- ✅ IP tracking & user agent logging
- ✅ SQL injection prevention (Prisma ORM)

## 📝 Notes

1. **Automatic Logging**: Semua POST/PUT/PATCH/DELETE request otomatis tercatat
2. **Real-time Stats**: Dashboard stats di-refresh setiap 30 detik
3. **User Info**: Captured dari JWT token yang ada di middleware
4. **Extensible**: Mudah untuk menambah action, module, atau status baru

## 🎓 Example Usage

### Add Custom Activity Log
```typescript
// In any service
constructor(private auditService: AuditService) {}

async createPatient(dto: CreatePatientDto) {
  const patient = await this.prisma.patient.create({ data: dto });
  
  // Log manually
  await this.auditService.createLog({
    action: AuditAction.PATIENT_CREATE,
    module: AuditModule.PATIENT,
    entity: 'Patient',
    entityId: patient.id,
    description: `Created patient: ${patient.name}`,
    actorId: currentUserId,
  });
  
  return patient;
}
```

## 📞 Support

Untuk pertanyaan atau issues, hubungi team development.

---

**Last Updated**: May 13, 2026  
**Version**: 1.0.0
