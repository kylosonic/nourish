-- S3: accounts, sessions and the server-side mirror of the user log (ADR-0008).
-- The server mirrors the device; it is never the only copy. Client-generated ids
-- make a replayed push idempotent, and deletes are tombstones (OFF-02).
-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('Active', 'Deleted');

-- CreateEnum
CREATE TYPE "ConsentKind" AS ENUM ('healthDataProcessing', 'aiImprovement', 'analytics');

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'PLUS', 'PRO');

-- CreateEnum
CREATE TYPE "EntitlementSource" AS ENUM ('default', 'store', 'manual');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phoneE164" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3),
    "onboardedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpChallenge" (
    "id" TEXT NOT NULL,
    "phoneE164" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "codeSalt" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "invalidatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "replacedById" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "ConsentKind" NOT NULL,
    "version" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entitlement" (
    "userId" TEXT NOT NULL,
    "plan" "Plan" NOT NULL DEFAULT 'FREE',
    "source" "EntitlementSource" NOT NULL DEFAULT 'default',
    "validUntil" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entitlement_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Meal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "clientSeq" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Meal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealItem" (
    "id" TEXT NOT NULL,
    "mealId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "foodName" TEXT NOT NULL,
    "portionUnit" TEXT NOT NULL,
    "portionQuantity" DOUBLE PRECISION NOT NULL,
    "grams" DOUBLE PRECISION NOT NULL,
    "kcal" DOUBLE PRECISION NOT NULL,
    "proteinG" DOUBLE PRECISION NOT NULL,
    "carbsG" DOUBLE PRECISION NOT NULL,
    "fatG" DOUBLE PRECISION NOT NULL,
    "fiberG" DOUBLE PRECISION,
    "sodiumMg" DOUBLE PRECISION,

    CONSTRAINT "MealItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaterLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "amountMl" INTEGER NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "WaterLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeightLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "WeightLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneE164_key" ON "User"("phoneE164");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "OtpChallenge_phoneE164_createdAt_idx" ON "OtpChallenge"("phoneE164", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_familyId_idx" ON "RefreshToken"("familyId");

-- CreateIndex
CREATE UNIQUE INDEX "Consent_userId_kind_version_key" ON "Consent"("userId", "kind", "version");

-- CreateIndex
CREATE INDEX "Meal_userId_updatedAt_idx" ON "Meal"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Meal_userId_clientId_key" ON "Meal"("userId", "clientId");

-- CreateIndex
CREATE UNIQUE INDEX "MealItem_mealId_clientId_key" ON "MealItem"("mealId", "clientId");

-- CreateIndex
CREATE INDEX "WaterLog_userId_updatedAt_idx" ON "WaterLog"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WaterLog_userId_clientId_key" ON "WaterLog"("userId", "clientId");

-- CreateIndex
CREATE INDEX "WeightLog_userId_updatedAt_idx" ON "WeightLog"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WeightLog_userId_clientId_key" ON "WeightLog"("userId", "clientId");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consent" ADD CONSTRAINT "Consent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meal" ADD CONSTRAINT "Meal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealItem" ADD CONSTRAINT "MealItem_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaterLog" ADD CONSTRAINT "WaterLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeightLog" ADD CONSTRAINT "WeightLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

