-- CreateTable DatabaseBackup
CREATE TABLE "DatabaseBackup" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "description" TEXT,
    "size" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "backupPath" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "DatabaseBackup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DatabaseBackup_filename_key" ON "DatabaseBackup"("filename");

-- CreateIndex
CREATE INDEX "DatabaseBackup_createdAt_idx" ON "DatabaseBackup"("createdAt");

-- CreateIndex
CREATE INDEX "DatabaseBackup_status_idx" ON "DatabaseBackup"("status");

-- AddForeignKey
ALTER TABLE "DatabaseBackup" ADD CONSTRAINT "DatabaseBackup_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
