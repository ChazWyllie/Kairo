-- CreateTable
CREATE TABLE "CheckIn" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "workout" BOOLEAN NOT NULL DEFAULT false,
    "meals" INTEGER NOT NULL DEFAULT 0,
    "water" BOOLEAN NOT NULL DEFAULT false,
    "steps" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CheckIn_memberId_date_idx" ON "CheckIn"("memberId", "date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "CheckIn_memberId_date_key" ON "CheckIn"("memberId", "date");

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
