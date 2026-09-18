-- ImportRun gains the canonicalization-rules version, which becomes part of the
-- idempotency key: the source file hash alone cannot express "same data,
-- different local rules", so a rule change now re-derives the food layer
-- (QA F-04 follow-up: component-word alias filtering).

-- AlterTable
ALTER TABLE "ImportRun" ADD COLUMN "rulesVersion" TEXT;

-- DropIndex
DROP INDEX "ImportRun_sourceName_sourceVersion_fileSha256_key";

-- CreateIndex
CREATE UNIQUE INDEX "ImportRun_sourceName_sourceVersion_fileSha256_rulesVersion_key" ON "ImportRun"("sourceName", "sourceVersion", "fileSha256", "rulesVersion");
