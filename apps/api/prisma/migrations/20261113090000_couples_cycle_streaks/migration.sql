-- Private cycle tracking, expiring couple invitations, revocable sharing, and
-- shared wellness check-ins. Every row is tied to a user (or connection) with
-- cascading deletion so account erasure removes all cycle and couple data.

CREATE TABLE "CycleProfile" (
    "userId" TEXT NOT NULL,
    "cycleLengthDays" INTEGER NOT NULL DEFAULT 28,
    "periodLengthDays" INTEGER NOT NULL DEFAULT 5,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CycleProfile_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE "CycleEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "startDateKey" TEXT NOT NULL,
    "endDateKey" TEXT,
    "symptoms" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "clientSeq" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CycleEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WellnessCheckIn" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "clientSeq" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WellnessCheckIn_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CoupleInvitation" (
    "id" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoupleInvitation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CoupleConnection" (
    "id" TEXT NOT NULL,
    "userOneId" TEXT NOT NULL,
    "userTwoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "CoupleConnection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CoupleSharingPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "shareCycle" BOOLEAN NOT NULL DEFAULT false,
    "shareCheckIns" BOOLEAN NOT NULL DEFAULT false,
    "shareFoodStreak" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoupleSharingPreference_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CycleEntry_userId_clientId_key"
  ON "CycleEntry"("userId", "clientId");
CREATE INDEX "CycleEntry_userId_updatedAt_idx"
  ON "CycleEntry"("userId", "updatedAt");
CREATE INDEX "CycleEntry_userId_startDateKey_idx"
  ON "CycleEntry"("userId", "startDateKey");

CREATE UNIQUE INDEX "WellnessCheckIn_userId_clientId_key"
  ON "WellnessCheckIn"("userId", "clientId");
CREATE INDEX "WellnessCheckIn_userId_updatedAt_idx"
  ON "WellnessCheckIn"("userId", "updatedAt");
CREATE INDEX "WellnessCheckIn_userId_dateKey_idx"
  ON "WellnessCheckIn"("userId", "dateKey");

CREATE UNIQUE INDEX "CoupleInvitation_codeHash_key"
  ON "CoupleInvitation"("codeHash");
CREATE INDEX "CoupleInvitation_inviterId_createdAt_idx"
  ON "CoupleInvitation"("inviterId", "createdAt");

CREATE INDEX "CoupleConnection_userOneId_endedAt_idx"
  ON "CoupleConnection"("userOneId", "endedAt");
CREATE INDEX "CoupleConnection_userTwoId_endedAt_idx"
  ON "CoupleConnection"("userTwoId", "endedAt");

CREATE UNIQUE INDEX "CoupleSharingPreference_userId_coupleId_key"
  ON "CoupleSharingPreference"("userId", "coupleId");
CREATE INDEX "CoupleSharingPreference_coupleId_idx"
  ON "CoupleSharingPreference"("coupleId");

ALTER TABLE "CycleProfile"
  ADD CONSTRAINT "CycleProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CycleEntry"
  ADD CONSTRAINT "CycleEntry_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WellnessCheckIn"
  ADD CONSTRAINT "WellnessCheckIn_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CoupleInvitation"
  ADD CONSTRAINT "CoupleInvitation_inviterId_fkey"
  FOREIGN KEY ("inviterId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CoupleConnection"
  ADD CONSTRAINT "CoupleConnection_userOneId_fkey"
  FOREIGN KEY ("userOneId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CoupleConnection"
  ADD CONSTRAINT "CoupleConnection_userTwoId_fkey"
  FOREIGN KEY ("userTwoId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CoupleSharingPreference"
  ADD CONSTRAINT "CoupleSharingPreference_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CoupleSharingPreference"
  ADD CONSTRAINT "CoupleSharingPreference_coupleId_fkey"
  FOREIGN KEY ("coupleId") REFERENCES "CoupleConnection"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
