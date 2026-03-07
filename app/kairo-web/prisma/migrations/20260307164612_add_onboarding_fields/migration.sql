-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "daysPerWeek" INTEGER,
ADD COLUMN     "goal" TEXT,
ADD COLUMN     "injuries" TEXT,
ADD COLUMN     "minutesPerSession" INTEGER,
ADD COLUMN     "onboardedAt" TIMESTAMP(3);
