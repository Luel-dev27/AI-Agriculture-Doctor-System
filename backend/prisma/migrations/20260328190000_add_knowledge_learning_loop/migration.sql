CREATE TABLE "KnowledgeEntry" (
    "id" SERIAL NOT NULL,
    "cropName" TEXT NOT NULL,
    "diseaseName" TEXT NOT NULL,
    "aliases" TEXT NOT NULL,
    "symptomKeywords" TEXT NOT NULL,
    "medicineName" TEXT NOT NULL,
    "applicationRate" TEXT NOT NULL,
    "treatmentPlan" TEXT NOT NULL,
    "preventionPlan" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DiagnosisFeedback" (
    "id" SERIAL NOT NULL,
    "diagnosisId" INTEGER NOT NULL,
    "reviewerId" INTEGER NOT NULL,
    "resolution" TEXT NOT NULL,
    "confirmedDiseaseName" TEXT,
    "medicineName" TEXT,
    "applicationRate" TEXT,
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiagnosisFeedback_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Diagnosis"
ADD COLUMN     "fieldNotes" TEXT,
ADD COLUMN     "medicineName" TEXT NOT NULL DEFAULT 'Expert review required',
ADD COLUMN     "applicationRate" TEXT NOT NULL DEFAULT 'Confirm local dosage before application.',
ADD COLUMN     "preventionPlan" TEXT NOT NULL DEFAULT 'Capture follow-up images and review field hygiene practices.',
ADD COLUMN     "knowledgeMatches" TEXT NOT NULL DEFAULT '[]',
ADD COLUMN     "advisorySource" TEXT NOT NULL DEFAULT 'knowledge-guided',
ADD COLUMN     "reviewStatus" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "reviewedByName" TEXT,
ADD COLUMN     "reviewNotes" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "KnowledgeEntry_cropName_diseaseName_key" ON "KnowledgeEntry"("cropName", "diseaseName");
CREATE INDEX "KnowledgeEntry_cropName_idx" ON "KnowledgeEntry"("cropName");
CREATE INDEX "DiagnosisFeedback_diagnosisId_idx" ON "DiagnosisFeedback"("diagnosisId");
CREATE INDEX "DiagnosisFeedback_reviewerId_idx" ON "DiagnosisFeedback"("reviewerId");

ALTER TABLE "DiagnosisFeedback" ADD CONSTRAINT "DiagnosisFeedback_diagnosisId_fkey"
FOREIGN KEY ("diagnosisId") REFERENCES "Diagnosis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DiagnosisFeedback" ADD CONSTRAINT "DiagnosisFeedback_reviewerId_fkey"
FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
