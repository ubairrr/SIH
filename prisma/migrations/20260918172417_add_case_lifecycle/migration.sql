-- CreateEnum
CREATE TYPE "Stage" AS ENUM ('FIR_REGISTERED', 'UNDER_INVESTIGATION', 'CHARGE_SHEET_FILED', 'IN_COURT', 'CLOSED_JUDGMENT');

-- CreateEnum
CREATE TYPE "Verdict" AS ENUM ('CONVICTED', 'ACQUITTED', 'DISCHARGED', 'COMPOUNDED');

-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "firNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "offenceSections" TEXT NOT NULL,
    "incidentDate" TIMESTAMP(3) NOT NULL,
    "policeStation" TEXT NOT NULL,
    "complainant" TEXT NOT NULL,
    "accused" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "stage" "Stage" NOT NULL DEFAULT 'FIR_REGISTERED',
    "verdict" "Verdict",
    "judgmentSummary" TEXT,
    "registeredById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StageHistory" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "fromStage" "Stage",
    "toStage" "Stage" NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorRole" "Role" NOT NULL,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StageHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Case_firNumber_key" ON "Case"("firNumber");

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageHistory" ADD CONSTRAINT "StageHistory_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageHistory" ADD CONSTRAINT "StageHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
