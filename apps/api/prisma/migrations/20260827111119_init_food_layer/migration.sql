-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('Pending', 'Committed', 'Failed');

-- CreateEnum
CREATE TYPE "FoodStatus" AS ENUM ('Active', 'Deprecated', 'Merged');

-- CreateEnum
CREATE TYPE "AliasKind" AS ENUM ('alternate', 'transliteration', 'misspelling', 'appTransliteration');

-- CreateTable
CREATE TABLE "ImportRun" (
    "id" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourceVersion" TEXT NOT NULL,
    "sourceReference" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "fileName" TEXT NOT NULL,
    "fileSha256" TEXT NOT NULL,
    "extractSha256" TEXT,
    "rowCount" INTEGER NOT NULL,
    "status" "ImportStatus" NOT NULL DEFAULT 'Pending',
    "notes" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "ImportRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Food" (
    "id" TEXT NOT NULL,
    "canonicalName" TEXT NOT NULL,
    "categoryCode" TEXT NOT NULL,
    "description" TEXT,
    "region" TEXT,
    "preparation" TEXT,
    "status" "FoodStatus" NOT NULL DEFAULT 'Active',
    "verification" TEXT,
    "confidence" DOUBLE PRECISION,
    "defaultPortionUnit" TEXT NOT NULL,
    "defaultPortionQty" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "defaultPortionGrams" DOUBLE PRECISION NOT NULL,
    "per100gKcal" DOUBLE PRECISION NOT NULL,
    "per100gProtein" DOUBLE PRECISION NOT NULL,
    "per100gCarbs" DOUBLE PRECISION NOT NULL,
    "per100gFat" DOUBLE PRECISION NOT NULL,
    "per100gFiber" DOUBLE PRECISION,
    "per100gSodiumMg" DOUBLE PRECISION,
    "extraNutrients" JSONB,
    "importId" TEXT NOT NULL,
    "sourceFoodCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Food_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodAlias" (
    "id" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "kind" "AliasKind" NOT NULL DEFAULT 'alternate',
    "normalized" TEXT NOT NULL,

    CONSTRAINT "FoodAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodPortion" (
    "id" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "grams" DOUBLE PRECISION NOT NULL,
    "portionSource" TEXT NOT NULL DEFAULT 'nourish-standard',

    CONSTRAINT "FoodPortion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodCategory" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "FoodCategory_pkey" PRIMARY KEY ("code")
);

-- CreateIndex
CREATE UNIQUE INDEX "ImportRun_sourceName_sourceVersion_fileSha256_key" ON "ImportRun"("sourceName", "sourceVersion", "fileSha256");

-- CreateIndex
CREATE UNIQUE INDEX "Food_sourceFoodCode_key" ON "Food"("sourceFoodCode");

-- CreateIndex
CREATE INDEX "Food_canonicalName_idx" ON "Food"("canonicalName");

-- CreateIndex
CREATE INDEX "Food_categoryCode_idx" ON "Food"("categoryCode");

-- CreateIndex
CREATE INDEX "FoodAlias_normalized_idx" ON "FoodAlias"("normalized");

-- CreateIndex
CREATE UNIQUE INDEX "FoodAlias_foodId_alias_language_key" ON "FoodAlias"("foodId", "alias", "language");

-- CreateIndex
CREATE UNIQUE INDEX "FoodPortion_foodId_unit_key" ON "FoodPortion"("foodId", "unit");

-- AddForeignKey
ALTER TABLE "Food" ADD CONSTRAINT "Food_categoryCode_fkey" FOREIGN KEY ("categoryCode") REFERENCES "FoodCategory"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Food" ADD CONSTRAINT "Food_importId_fkey" FOREIGN KEY ("importId") REFERENCES "ImportRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodAlias" ADD CONSTRAINT "FoodAlias_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodPortion" ADD CONSTRAINT "FoodPortion_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;
