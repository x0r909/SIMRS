/*
  Warnings:

  - The `action` column on the `AuditLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `entity` column on the `AuditLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `module` to the `AuditLog` table without a constraint

*/
-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'RESET_PASSWORD', 'CHANGE_PASSWORD', 'USER_CREATE', 'USER_UPDATE', 'USER_DELETE', 'ROLE_CHANGE', 'PATIENT_REGISTER', 'PATIENT_CREATE', 'PATIENT_UPDATE', 'PATIENT_DELETE', 'DIAGNOSIS_ADD', 'MEDICAL_RECORD_UPDATE', 'PRESCRIPTION_ADD', 'LAB_RESULT_UPLOAD', 'APPOINTMENT_BOOK', 'APPOINTMENT_RESCHEDULE', 'APPOINTMENT_CANCEL', 'MEDICINE_STOCK_ADD', 'MEDICINE_STOCK_UPDATE', 'MEDICINE_OUT', 'DATABASE_BACKUP', 'DATABASE_RESTORE', 'SYSTEM_ERROR', 'SETTING_UPDATE', 'OTHER');

-- CreateEnum
CREATE TYPE "AuditModule" AS ENUM ('AUTH', 'USER_MANAGEMENT', 'PATIENT', 'APPOINTMENT', 'MEDICAL_RECORD', 'PHARMACY', 'BILLING', 'RADIOLOGY', 'LABORATORY', 'QUEUE', 'SYSTEM', 'OTHER');

-- CreateEnum
CREATE TYPE "AuditStatus" AS ENUM ('SUCCESS', 'FAILED', 'ERROR', 'WARNING');

-- AlterTable
ALTER TABLE "AuditLog" 
DROP COLUMN "action",
DROP COLUMN "entity",
ADD COLUMN "action" "AuditAction" NOT NULL DEFAULT 'OTHER',
ADD COLUMN "entity" TEXT NOT NULL DEFAULT 'Unknown',
ADD COLUMN "module" "AuditModule" NOT NULL DEFAULT 'OTHER',
ADD COLUMN "status" "AuditStatus" NOT NULL DEFAULT 'SUCCESS',
ADD COLUMN "description" TEXT;

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_module_idx" ON "AuditLog"("module");
