-- CreateTable
CREATE TABLE "ReviewSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "questionId" TEXT NOT NULL,
    "nextReviewDate" DATETIME NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "easeFactor" REAL NOT NULL DEFAULT 2.5,
    "lapses" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReviewSchedule_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ReviewSchedule_questionId_key" ON "ReviewSchedule"("questionId");

-- CreateIndex
CREATE INDEX "ReviewSchedule_nextReviewDate_idx" ON "ReviewSchedule"("nextReviewDate");
