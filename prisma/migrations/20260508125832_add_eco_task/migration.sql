-- AlterTable
ALTER TABLE "Question" ADD COLUMN "ecoTask" TEXT;

-- CreateIndex
CREATE INDEX "Question_ecoTask_idx" ON "Question"("ecoTask");
