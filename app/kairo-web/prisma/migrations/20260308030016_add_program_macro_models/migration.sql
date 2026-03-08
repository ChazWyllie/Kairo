-- AlterTable
ALTER TABLE "CheckIn" ADD COLUMN     "avgWeight" DOUBLE PRECISION,
ADD COLUMN     "backPhotoUrl" TEXT,
ADD COLUMN     "biggestStruggle" TEXT,
ADD COLUMN     "biggestWin" TEXT,
ADD COLUMN     "calorieAdherence" INTEGER,
ADD COLUMN     "coachResponse" TEXT,
ADD COLUMN     "coachStatus" TEXT,
ADD COLUMN     "digestionScore" INTEGER,
ADD COLUMN     "energyScore" INTEGER,
ADD COLUMN     "frontPhotoUrl" TEXT,
ADD COLUMN     "helpNeeded" TEXT,
ADD COLUMN     "hungerScore" INTEGER,
ADD COLUMN     "painNotes" TEXT,
ADD COLUMN     "photoSubmitted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "proteinAdherence" INTEGER,
ADD COLUMN     "recoveryScore" INTEGER,
ADD COLUMN     "responseAt" TIMESTAMP(3),
ADD COLUMN     "sidePhotoUrl" TEXT,
ADD COLUMN     "sleepAverage" DOUBLE PRECISION,
ADD COLUMN     "stepsAverage" INTEGER,
ADD COLUMN     "stressScore" INTEGER,
ADD COLUMN     "waist" DOUBLE PRECISION,
ADD COLUMN     "workoutsCompleted" INTEGER;

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "age" INTEGER,
ADD COLUMN     "alcoholIntake" TEXT,
ADD COLUMN     "appetiteLevel" TEXT,
ADD COLUMN     "avgSleep" DOUBLE PRECISION,
ADD COLUMN     "bodyFat" TEXT,
ADD COLUMN     "currentCalories" INTEGER,
ADD COLUMN     "currentSplit" TEXT,
ADD COLUMN     "currentWeight" TEXT,
ADD COLUMN     "equipmentAccess" TEXT,
ADD COLUMN     "fallOffCause" TEXT,
ADD COLUMN     "favoriteLifts" TEXT,
ADD COLUMN     "foodsAvoid" TEXT,
ADD COLUMN     "foodsEnjoy" TEXT,
ADD COLUMN     "fullName" TEXT,
ADD COLUMN     "height" TEXT,
ADD COLUMN     "jobActivityLevel" TEXT,
ADD COLUMN     "mealsPerDay" INTEGER,
ADD COLUMN     "occupation" TEXT,
ADD COLUMN     "proteinIntake" INTEGER,
ADD COLUMN     "sessionLength" INTEGER,
ADD COLUMN     "stepCount" INTEGER,
ADD COLUMN     "stressLevel" TEXT,
ADD COLUMN     "success90Days" TEXT,
ADD COLUMN     "supplements" TEXT,
ADD COLUMN     "supportNeeded" TEXT,
ADD COLUMN     "timezone" TEXT,
ADD COLUMN     "travelFrequency" TEXT,
ADD COLUMN     "weakBodyParts" TEXT,
ADD COLUMN     "weekendEating" TEXT,
ADD COLUMN     "yearsTraining" INTEGER;

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "age" INTEGER,
    "height" TEXT,
    "currentWeight" TEXT,
    "goal" TEXT NOT NULL,
    "whyNow" TEXT,
    "trainingExperience" TEXT,
    "trainingFrequency" TEXT,
    "gymAccess" TEXT,
    "injuryHistory" TEXT,
    "nutritionStruggles" TEXT,
    "biggestObstacle" TEXT,
    "helpWithMost" TEXT,
    "preferredTier" TEXT,
    "readyForStructure" BOOLEAN NOT NULL DEFAULT false,
    "budgetComfort" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvedAt" TIMESTAMP(3),
    "paymentSent" BOOLEAN NOT NULL DEFAULT false,
    "convertedToMember" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "summary" TEXT,
    "actionItems" TEXT,
    "loomLink" TEXT,
    "followUpNeeded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramBlock" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "primaryGoal" TEXT,
    "split" TEXT,
    "daysPerWeek" INTEGER,
    "progressionModel" TEXT,
    "deloadPlanned" BOOLEAN NOT NULL DEFAULT false,
    "deloadWeek" INTEGER,
    "keyExercises" TEXT,
    "workoutNotes" TEXT,
    "cardioTarget" TEXT,
    "stepsTarget" INTEGER,
    "adjustmentsMade" TEXT,
    "adjustmentReason" TEXT,
    "nextUpdateDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MacroTarget" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "calories" INTEGER NOT NULL,
    "protein" INTEGER NOT NULL,
    "fatsMin" INTEGER,
    "carbs" INTEGER,
    "stepsTarget" INTEGER,
    "hydrationTarget" TEXT,
    "adjustmentReason" TEXT,
    "previousCalories" INTEGER,
    "previousProtein" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MacroTarget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Application_email_key" ON "Application"("email");

-- CreateIndex
CREATE INDEX "Application_status_idx" ON "Application"("status");

-- CreateIndex
CREATE INDEX "Review_memberId_idx" ON "Review"("memberId");

-- CreateIndex
CREATE INDEX "ProgramBlock_memberId_idx" ON "ProgramBlock"("memberId");

-- CreateIndex
CREATE INDEX "ProgramBlock_memberId_status_idx" ON "ProgramBlock"("memberId", "status");

-- CreateIndex
CREATE INDEX "MacroTarget_memberId_idx" ON "MacroTarget"("memberId");

-- CreateIndex
CREATE INDEX "MacroTarget_memberId_status_idx" ON "MacroTarget"("memberId", "status");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramBlock" ADD CONSTRAINT "ProgramBlock_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MacroTarget" ADD CONSTRAINT "MacroTarget_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
