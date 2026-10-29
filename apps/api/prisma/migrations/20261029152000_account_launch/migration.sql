-- Account launch: explicit consent flags/audit timestamps and passwordless
-- email OTP challenges. Existing consent rows remain valid; the effective
-- value is derived from their grant/revocation history.
ALTER TABLE "Consent"
  ADD COLUMN "granted" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Consent"
SET "granted" = ("grantedAt" IS NOT NULL AND "revokedAt" IS NULL);

CREATE INDEX "Consent_userId_kind_idx" ON "Consent"("userId", "kind");

CREATE TABLE "EmailOtpChallenge" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "codeSalt" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "invalidatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailOtpChallenge_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EmailOtpChallenge_email_createdAt_idx"
  ON "EmailOtpChallenge"("email", "createdAt");

ALTER TABLE "AnalysisCorrection" ADD COLUMN "details" JSONB;

CREATE TABLE "BarcodeProduct" (
    "barcode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "servingSizeG" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "kcalPer100g" DOUBLE PRECISION NOT NULL,
    "proteinPer100g" DOUBLE PRECISION NOT NULL,
    "carbsPer100g" DOUBLE PRECISION NOT NULL,
    "fatPer100g" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'open-food-facts',
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BarcodeProduct_pkey" PRIMARY KEY ("barcode")
);

CREATE TYPE "DeletionRequestStatus" AS ENUM ('Pending', 'Completed', 'Rejected');

CREATE TABLE "AccountDeletionRequest" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phoneE164" TEXT,
    "note" TEXT,
    "status" "DeletionRequestStatus" NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AccountDeletionRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AccountDeletionRequest_status_createdAt_idx"
  ON "AccountDeletionRequest"("status", "createdAt");
