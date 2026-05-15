/*
  Warnings:

  - Added the required column `updatedAt` to the `Answer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `questionIds` to the `ExamSession` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Answer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "userAnswer" TEXT,
    "isCorrect" BOOLEAN,
    "flaggedForReview" BOOLEAN NOT NULL DEFAULT false,
    "timeSpentSeconds" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Answer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ExamSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Answer" ("createdAt", "id", "isCorrect", "questionId", "sessionId", "timeSpentSeconds", "userAnswer") SELECT "createdAt", "id", "isCorrect", "questionId", "sessionId", "timeSpentSeconds", "userAnswer" FROM "Answer";
DROP TABLE "Answer";
ALTER TABLE "new_Answer" RENAME TO "Answer";
CREATE INDEX "Answer_sessionId_idx" ON "Answer"("sessionId");
CREATE INDEX "Answer_questionId_idx" ON "Answer"("questionId");
CREATE UNIQUE INDEX "Answer_sessionId_questionId_key" ON "Answer"("sessionId", "questionId");
CREATE TABLE "new_ExamSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mode" TEXT NOT NULL,
    "questionIds" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "totalQuestions" INTEGER NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "timeSpentSeconds" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_ExamSession" ("completedAt", "id", "mode", "score", "startedAt", "timeSpentSeconds", "totalQuestions") SELECT "completedAt", "id", "mode", "score", "startedAt", "timeSpentSeconds", "totalQuestions" FROM "ExamSession";
DROP TABLE "ExamSession";
ALTER TABLE "new_ExamSession" RENAME TO "ExamSession";
CREATE INDEX "ExamSession_mode_idx" ON "ExamSession"("mode");
CREATE INDEX "ExamSession_startedAt_idx" ON "ExamSession"("startedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
