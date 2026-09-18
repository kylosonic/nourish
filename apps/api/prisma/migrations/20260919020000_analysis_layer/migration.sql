-- S2 analysis layer (ADR-0007). Anonymous by construction: no user identity is
-- stored, `userId` is a nullable S3 reservation, and no imagery is persisted.

-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('Completed', 'Failed');

-- CreateEnum
CREATE TYPE "AnalysisInputKind" AS ENUM ('Photo', 'Text');

-- CreateEnum
CREATE TYPE "ConfidenceState" AS ENUM ('High', 'Medium', 'Low');

-- CreateEnum
CREATE TYPE "MatchKind" AS ENUM ('exact', 'alias', 'fuzzy', 'none');

-- CreateTable
CREATE TABLE "AnalysisRun" (
    "id" TEXT NOT NULL,
    "status" "AnalysisStatus" NOT NULL,
    "inputKind" "AnalysisInputKind" NOT NULL,
    "overallConfidence" DOUBLE PRECISION NOT NULL,
    "confidenceState" "ConfidenceState" NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "notes" JSONB,
    "failureCode" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalysisRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisItem" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "foodId" TEXT,
    "sourceFoodCode" TEXT,
    "canonicalName" TEXT,
    "matchKind" "MatchKind" NOT NULL,
    "portionAmount" DOUBLE PRECISION NOT NULL,
    "portionUnit" TEXT NOT NULL,
    "portionGrams" DOUBLE PRECISION NOT NULL,
    "portionEstimated" BOOLEAN NOT NULL DEFAULT false,
    "portionSource" TEXT NOT NULL DEFAULT 'nourish-standard',
    "kcal" DOUBLE PRECISION,
    "proteinG" DOUBLE PRECISION,
    "carbsG" DOUBLE PRECISION,
    "fatG" DOUBLE PRECISION,
    "fiberG" DOUBLE PRECISION,
    "sodiumMg" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION NOT NULL,
    "unresolved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AnalysisItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisCandidate" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "foodId" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL,
    "rank" INTEGER NOT NULL,

    CONSTRAINT "AnalysisCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisCorrection" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "itemId" TEXT,
    "action" TEXT NOT NULL,
    "predictedLabel" TEXT,
    "chosenFoodId" TEXT,
    "chosenAmount" DOUBLE PRECISION,
    "chosenUnit" TEXT,
    "modelVersion" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalysisCorrection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalysisRun_createdAt_idx" ON "AnalysisRun"("createdAt");

-- CreateIndex
CREATE INDEX "AnalysisRun_userId_idx" ON "AnalysisRun"("userId");

-- CreateIndex
CREATE INDEX "AnalysisItem_runId_idx" ON "AnalysisItem"("runId");

-- CreateIndex
CREATE INDEX "AnalysisCandidate_runId_idx" ON "AnalysisCandidate"("runId");

-- CreateIndex
CREATE INDEX "AnalysisCorrection_runId_idx" ON "AnalysisCorrection"("runId");

-- AddForeignKey
ALTER TABLE "AnalysisItem" ADD CONSTRAINT "AnalysisItem_runId_fkey" FOREIGN KEY ("runId") REFERENCES "AnalysisRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisCandidate" ADD CONSTRAINT "AnalysisCandidate_runId_fkey" FOREIGN KEY ("runId") REFERENCES "AnalysisRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisCorrection" ADD CONSTRAINT "AnalysisCorrection_runId_fkey" FOREIGN KEY ("runId") REFERENCES "AnalysisRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
