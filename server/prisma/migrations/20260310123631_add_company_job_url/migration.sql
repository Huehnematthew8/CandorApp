-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "applied_at" TIMESTAMP(3),
ADD COLUMN     "country" TEXT,
ADD COLUMN     "interview_prep" JSONB,
ADD COLUMN     "jd_analysis" JSONB,
ADD COLUMN     "jd_text" TEXT,
ADD COLUMN     "job_url" TEXT,
ADD COLUMN     "visa_required" BOOLEAN,
ADD COLUMN     "work_rights" TEXT;
