-- CreateTable
CREATE TABLE "LaboratoryOrder" (
    "id" TEXT NOT NULL,
    "testType" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'MENUNGGU',
    "orderedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "visitId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,

    CONSTRAINT "LaboratoryOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LaboratoryResult" (
    "id" TEXT NOT NULL,
    "parameter" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "unit" TEXT,
    "normalRange" TEXT,
    "notes" TEXT,
    "resultedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "orderId" TEXT NOT NULL,

    CONSTRAINT "LaboratoryResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RadiologyOrder" (
    "id" TEXT NOT NULL,
    "examType" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'MENUNGGU',
    "orderedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "visitId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,

    CONSTRAINT "RadiologyOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RadiologyResult" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "impression" TEXT,
    "filePath" TEXT,
    "resultedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "orderId" TEXT NOT NULL,

    CONSTRAINT "RadiologyResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LaboratoryOrder_visitId_idx" ON "LaboratoryOrder"("visitId");

-- CreateIndex
CREATE INDEX "LaboratoryOrder_doctorId_idx" ON "LaboratoryOrder"("doctorId");

-- CreateIndex
CREATE INDEX "LaboratoryOrder_status_idx" ON "LaboratoryOrder"("status");

-- CreateIndex
CREATE INDEX "LaboratoryResult_orderId_idx" ON "LaboratoryResult"("orderId");

-- CreateIndex
CREATE INDEX "RadiologyOrder_visitId_idx" ON "RadiologyOrder"("visitId");

-- CreateIndex
CREATE INDEX "RadiologyOrder_doctorId_idx" ON "RadiologyOrder"("doctorId");

-- CreateIndex
CREATE INDEX "RadiologyOrder_status_idx" ON "RadiologyOrder"("status");

-- CreateIndex
CREATE INDEX "RadiologyResult_orderId_idx" ON "RadiologyResult"("orderId");

-- AddForeignKey
ALTER TABLE "LaboratoryOrder" ADD CONSTRAINT "LaboratoryOrder_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LaboratoryOrder" ADD CONSTRAINT "LaboratoryOrder_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LaboratoryResult" ADD CONSTRAINT "LaboratoryResult_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "LaboratoryOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RadiologyOrder" ADD CONSTRAINT "RadiologyOrder_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RadiologyOrder" ADD CONSTRAINT "RadiologyOrder_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RadiologyResult" ADD CONSTRAINT "RadiologyResult_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "RadiologyOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
