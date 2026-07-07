-- CreateEnum
CREATE TYPE "SmokingStatus" AS ENUM ('NEVER', 'FORMER', 'CURRENT');

-- CreateEnum
CREATE TYPE "AlcoholLevel" AS ENUM ('NONE', 'OCCASIONAL', 'MODERATE', 'HEAVY');

-- CreateEnum
CREATE TYPE "ExerciseFrequency" AS ENUM ('SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE');

-- CreateEnum
CREATE TYPE "DietType" AS ENUM ('VEGETARIAN', 'NON_VEGETARIAN', 'VEGAN', 'PESCATARIAN');

-- CreateEnum
CREATE TYPE "PregnancyStatus" AS ENUM ('NOT_PREGNANT', 'PREGNANT', 'POSTPARTUM', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('DRAFT', 'APPROVED', 'DISPENSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "VitalSource" AS ENUM ('MANUAL', 'APPLE_WATCH', 'DEVICE');

-- CreateEnum
CREATE TYPE "LabStatus" AS ENUM ('NORMAL', 'ABNORMAL', 'CRITICAL');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "alcoholConsumption" "AlcoholLevel",
ADD COLUMN     "alt" INTEGER,
ADD COLUMN     "ast" INTEGER,
ADD COLUMN     "bmi" DECIMAL(4,1),
ADD COLUMN     "cholesterolTotal" INTEGER,
ADD COLUMN     "cigarettesPerDay" INTEGER,
ADD COLUMN     "creatinine" DECIMAL(4,2),
ADD COLUMN     "currentConditions" JSONB,
ADD COLUMN     "currentMedications" JSONB,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "dietType" "DietType",
ADD COLUMN     "egfr" DECIMAL(5,1),
ADD COLUMN     "ethnicity" TEXT,
ADD COLUMN     "exerciseFrequency" "ExerciseFrequency",
ADD COLUMN     "hba1c" DECIMAL(4,1),
ADD COLUMN     "hdl" INTEGER,
ADD COLUMN     "heartRate" INTEGER,
ADD COLUMN     "height" DECIMAL(5,1),
ADD COLUMN     "hemoglobin" DECIMAL(4,1),
ADD COLUMN     "hrv" INTEGER,
ADD COLUMN     "ldl" INTEGER,
ADD COLUMN     "occupation" TEXT,
ADD COLUMN     "pregnancyStatus" "PregnancyStatus",
ADD COLUMN     "respiratoryRate" INTEGER,
ADD COLUMN     "sleepHours" DECIMAL(3,1),
ADD COLUMN     "smokingStatus" "SmokingStatus",
ADD COLUMN     "spo2" DECIMAL(4,1),
ADD COLUMN     "stressLevel" INTEGER,
ADD COLUMN     "temperature" DECIMAL(4,1),
ADD COLUMN     "triglycerides" INTEGER,
ADD COLUMN     "waistCircumference" DECIMAL(5,1),
ADD COLUMN     "wbcCount" DECIMAL(4,1),
ADD COLUMN     "weight" DECIMAL(5,1);

-- CreateTable
CREATE TABLE "MLModelPrediction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "symptoms" JSONB NOT NULL,
    "symptomText" TEXT NOT NULL,
    "patientFeatures" JSONB,
    "predictedDiseases" JSONB NOT NULL,
    "attentionWeights" JSONB,
    "triageLevel" TEXT NOT NULL,
    "confidenceScore" DECIMAL(5,2) NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "inferenceTime" INTEGER NOT NULL,
    "doctorVerified" BOOLEAN NOT NULL DEFAULT false,
    "actualDiagnosis" TEXT,
    "feedbackScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MLModelPrediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SymptomOntology" (
    "id" TEXT NOT NULL,
    "symptomName" TEXT NOT NULL,
    "symptomId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subCategory" TEXT,
    "umlsCUI" TEXT,
    "snomedCode" TEXT,
    "icd10Codes" JSONB,
    "synonyms" JSONB NOT NULL,
    "severity" TEXT,
    "onset" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SymptomOntology_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiseaseKnowledge" (
    "id" TEXT NOT NULL,
    "diseaseName" TEXT NOT NULL,
    "diseaseId" TEXT NOT NULL,
    "icd10Code" TEXT,
    "snomedCode" TEXT,
    "umlsCUI" TEXT,
    "description" TEXT NOT NULL,
    "prevalence" TEXT,
    "severity" TEXT,
    "commonSymptoms" JSONB NOT NULL,
    "rareSymptoms" JSONB,
    "comorbidities" JSONB,
    "riskFactors" JSONB,
    "firstLineTests" JSONB,
    "goldStandardTests" JSONB,
    "treatmentOptions" JSONB,
    "pubmedReferences" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiseaseKnowledge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prescription" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "status" "PrescriptionStatus" NOT NULL DEFAULT 'DRAFT',
    "interactions" JSONB,
    "warnings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medication" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "drugName" TEXT NOT NULL,
    "genericName" TEXT,
    "rxcui" TEXT,
    "dosage" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "sideEffects" TEXT,
    "contraindications" TEXT,
    "pregnancyCategory" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Medication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VitalSign" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "heartRate" INTEGER,
    "hrv" INTEGER,
    "spo2" DECIMAL(4,1),
    "temperature" DECIMAL(4,1),
    "respiratoryRate" INTEGER,
    "weight" DECIMAL(5,1),
    "height" DECIMAL(5,1),
    "bmi" DECIMAL(4,1),
    "source" "VitalSource" NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VitalSign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabResult" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "testType" TEXT NOT NULL,
    "testName" TEXT NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "normalRange" TEXT NOT NULL,
    "status" "LabStatus" NOT NULL,
    "labName" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LabResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrugInformation" (
    "id" TEXT NOT NULL,
    "drugName" TEXT NOT NULL,
    "rxcui" TEXT,
    "genericName" TEXT,
    "brandNames" JSONB,
    "fdaLabel" JSONB,
    "indications" TEXT,
    "dosageInfo" TEXT,
    "contraindications" TEXT,
    "warnings" TEXT,
    "adverseReactions" TEXT,
    "interactions" JSONB,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DrugInformation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalEvidence" (
    "id" TEXT NOT NULL,
    "disease" TEXT NOT NULL,
    "pmid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "abstract" TEXT NOT NULL,
    "journal" TEXT,
    "pubDate" TEXT,
    "relevanceScore" DECIMAL(4,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MedicalEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelTrainingMetrics" (
    "id" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "trainingSize" INTEGER NOT NULL,
    "validationSize" INTEGER NOT NULL,
    "testSize" INTEGER NOT NULL,
    "precision" DECIMAL(4,3) NOT NULL,
    "recall" DECIMAL(4,3) NOT NULL,
    "f1Score" DECIMAL(4,3) NOT NULL,
    "accuracy" DECIMAL(4,3) NOT NULL,
    "aucRoc" DECIMAL(4,3),
    "perDiseaseMetrics" JSONB,
    "epochs" INTEGER NOT NULL,
    "batchSize" INTEGER NOT NULL,
    "learningRate" DECIMAL(10,8) NOT NULL,
    "trainedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModelTrainingMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MLModelPrediction_userId_createdAt_idx" ON "MLModelPrediction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "MLModelPrediction_modelVersion_idx" ON "MLModelPrediction"("modelVersion");

-- CreateIndex
CREATE UNIQUE INDEX "SymptomOntology_symptomName_key" ON "SymptomOntology"("symptomName");

-- CreateIndex
CREATE UNIQUE INDEX "SymptomOntology_symptomId_key" ON "SymptomOntology"("symptomId");

-- CreateIndex
CREATE INDEX "SymptomOntology_category_idx" ON "SymptomOntology"("category");

-- CreateIndex
CREATE UNIQUE INDEX "DiseaseKnowledge_diseaseName_key" ON "DiseaseKnowledge"("diseaseName");

-- CreateIndex
CREATE UNIQUE INDEX "DiseaseKnowledge_diseaseId_key" ON "DiseaseKnowledge"("diseaseId");

-- CreateIndex
CREATE INDEX "DiseaseKnowledge_icd10Code_idx" ON "DiseaseKnowledge"("icd10Code");

-- CreateIndex
CREATE INDEX "Prescription_patientId_createdAt_idx" ON "Prescription"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "Prescription_doctorId_status_idx" ON "Prescription"("doctorId", "status");

-- CreateIndex
CREATE INDEX "Medication_prescriptionId_idx" ON "Medication"("prescriptionId");

-- CreateIndex
CREATE INDEX "VitalSign_userId_recordedAt_idx" ON "VitalSign"("userId", "recordedAt");

-- CreateIndex
CREATE INDEX "LabResult_userId_performedAt_idx" ON "LabResult"("userId", "performedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DrugInformation_drugName_key" ON "DrugInformation"("drugName");

-- CreateIndex
CREATE UNIQUE INDEX "DrugInformation_rxcui_key" ON "DrugInformation"("rxcui");

-- CreateIndex
CREATE INDEX "DrugInformation_rxcui_idx" ON "DrugInformation"("rxcui");

-- CreateIndex
CREATE UNIQUE INDEX "MedicalEvidence_pmid_key" ON "MedicalEvidence"("pmid");

-- CreateIndex
CREATE INDEX "MedicalEvidence_disease_idx" ON "MedicalEvidence"("disease");

-- CreateIndex
CREATE INDEX "ModelTrainingMetrics_modelVersion_trainedAt_idx" ON "ModelTrainingMetrics"("modelVersion", "trainedAt");

-- AddForeignKey
ALTER TABLE "MLModelPrediction" ADD CONSTRAINT "MLModelPrediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medication" ADD CONSTRAINT "Medication_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VitalSign" ADD CONSTRAINT "VitalSign_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabResult" ADD CONSTRAINT "LabResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
