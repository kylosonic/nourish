-- Multi-provider accounts: phone, email/password, and Google.
-- phoneE164 remains unique when present; absence is represented by NULL.
ALTER TABLE "User" ALTER COLUMN "phoneE164" DROP NOT NULL;

ALTER TABLE "User"
  ADD COLUMN "email" TEXT,
  ADD COLUMN "passwordHash" TEXT,
  ADD COLUMN "googleSubject" TEXT,
  ADD COLUMN "displayName" TEXT;

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_googleSubject_key" ON "User"("googleSubject");
