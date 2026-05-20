# 📋 Activity Log Implementation - Setup Checklist

## ✅ Pre-Deployment Checklist

### Backend Setup
- [ ] Install dependencies: `npm install exceljs pdfkit --save`
- [ ] Check `apps/backend/src/app.module.ts` - middleware registered
- [ ] Check `apps/backend/src/modules/audit-logs/` folder - all files created
- [ ] Verify Prisma schema updated with enums
- [ ] Migration file exists in `packages/db/prisma/migrations/20260513_add_audit_log_enums/`

### Frontend Setup
- [ ] Install dependencies: `npm install date-fns`
- [ ] Check `apps/frontend/src/lib/audit-api.ts` - API client created
- [ ] Check `apps/frontend/src/lib/audit-utils.ts` - Utils created
- [ ] Check `apps/frontend/src/components/audit/` - all components created
- [ ] Check `apps/frontend/src/app/(app)/admin/activity-log/page.tsx` - page created

### Database
- [ ] Run migration: `npx prisma migrate deploy`
- [ ] Seed data: `npx prisma db seed` (optional, untuk test data)

## 🚀 Deployment Steps

### 1. Backend Migration
```bash
cd packages/db
npx prisma migrate dev --name add_audit_log_enums
# Atau jika sudah di staging/production:
# npx prisma migrate deploy
```

### 2. Backend Install & Build
```bash
cd apps/backend

# Install deps
npm install exceljs pdfkit
npm install --save-dev @types/pdfkit

# Build
npm run build

# Start
npm run start:prod
```

### 3. Frontend Install & Build
```bash
cd apps/frontend

# Install deps
npm install date-fns

# Build
npm run build

# Start (production)
npm run start
```

### 4. Seed Data (Optional - untuk testing)
```bash
# Dari root atau packages/db
npx prisma db seed
```

## 🧪 Testing After Deployment

### Manual Testing Checklist
- [ ] Login ke aplikasi
- [ ] Navigate ke `/admin/activity-log`
- [ ] Page loading dengan stats visible
- [ ] Table menampilkan log entries
- [ ] Search box berfungsi (ketik user name)
- [ ] Filter dropdown berfungsi
- [ ] Date range picker berfungsi
- [ ] Export Excel button download file
- [ ] Export PDF button download file
- [ ] Pagination working
- [ ] Color badges tampil dengan benar

### Automated Testing (Optional)
```bash
# Jalankan unit tests
npm run test

# E2E testing
npm run test:e2e
```

## 📊 Verification

### Check Backend
```bash
# Cek apakah middleware teregistrasi
curl -X POST http://localhost:4000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@simrs.local","password":"Admin123!"}'

# Cek apakah log tercatat
curl -X GET http://localhost:4000/v1/audit-logs \
  -H "Authorization: Bearer YOUR_TOKEN"

# Cek stats
curl -X GET http://localhost:4000/v1/audit-logs/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Check Frontend
```bash
# Verify page loaded
curl http://localhost:3000/admin/activity-log

# Check console for errors
# Open browser dev tools - Console tab
```

## 🔐 Security Checklist

- [ ] JWT auth active untuk `/v1/audit-logs` endpoints
- [ ] Permission checks active (`audit.read`, `audit.export`)
- [ ] Sensitive data sanitized (password, token tidak di-log)
- [ ] CORS properly configured
- [ ] HTTPS enabled (production)
- [ ] Rate limiting implemented (optional)

## 🎯 Performance Checklist

- [ ] Database indexes created (audit log table)
- [ ] Query optimization: Prisma select fields
- [ ] Pagination default 20 per page
- [ ] Caching: Stats refresh 30 seconds
- [ ] Load testing: 1000+ concurrent users
- [ ] Memory usage: < 500MB for audit log queries

## 📝 Documentation Checklist

- [ ] `AUDIT_LOG_GUIDE.md` - Complete documentation
- [ ] `IMPLEMENTATION_SUMMARY.md` - Quick summary
- [ ] API endpoint documentation in code
- [ ] Component props documentation
- [ ] TypeScript interfaces documented

## 🔧 Troubleshooting

### Backend Issues

**Middleware not logging:**
- Check if `AuditLoggingMiddleware` registered in `AppModule`
- Check logs for errors
- Verify `AuditService` injected properly

**Export not working:**
- Check if `exceljs` dan `pdfkit` installed
- Check file permissions for temp files
- Check memory for large exports

### Frontend Issues

**Page not loading:**
- Check `/admin/activity-log` route exists
- Check permission `audit.read` assigned to user
- Check browser console for errors

**Filters not working:**
- Check API endpoint responding correctly
- Check query parameters sent to backend
- Verify `date-fns` installed

**Export failing:**
- Check browser download settings
- Check network tab for failed requests
- Check backend error logs

## 📞 Support Contacts

For issues:
1. Check error logs: `npm run logs`
2. Check database: `npx prisma studio`
3. Contact development team

## ✨ Quick Reference

### Key Files
- Backend: `apps/backend/src/modules/audit-logs/`
- Frontend: `apps/frontend/src/components/audit/`
- Database: `packages/db/prisma/`

### Key Endpoints
- `GET /v1/audit-logs` - Fetch logs
- `GET /v1/audit-logs/stats` - Get stats
- `GET /v1/audit-logs/export/excel` - Export Excel
- `GET /v1/audit-logs/export/pdf` - Export PDF

### Key Utilities
- `getActionLabel()` - Convert action to text
- `getStatusColor()` - Get badge color
- `getModuleLabel()` - Get module name
- `auditApi.getLogs()` - Fetch from frontend

## 🎉 Success Indicators

✅ All signs that deployment was successful:
- [ ] `/admin/activity-log` page loads without errors
- [ ] Login attempt appears in activity log within 5 seconds
- [ ] Stats update in real-time
- [ ] Filters work correctly
- [ ] Export buttons download files
- [ ] Search returns correct results
- [ ] Pagination navigates correctly

---

**Setup Time**: ~15 minutes  
**Testing Time**: ~10 minutes  
**Total**: ~25 minutes  

**Status**: 🟢 Ready for deployment
