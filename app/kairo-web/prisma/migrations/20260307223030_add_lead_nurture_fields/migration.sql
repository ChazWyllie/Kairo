-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "lastNurtureAt" TIMESTAMP(3),
ADD COLUMN     "lastNurtureStep" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "nurtureOptedOut" BOOLEAN NOT NULL DEFAULT false;
