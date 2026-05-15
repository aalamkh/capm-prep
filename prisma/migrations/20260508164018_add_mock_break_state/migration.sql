-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ExamSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mode" TEXT NOT NULL,
    "questionIds" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "totalQuestions" INTEGER NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "timeSpentSeconds" INTEGER NOT NULL DEFAULT 0,
    "breakSecondsTaken" INTEGER NOT NULL DEFAULT 0,
    "breakStartedAt" DATETIME,
    "breaksTaken" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_ExamSession" ("completedAt", "id", "mode", "questionIds", "score", "startedAt", "timeSpentSeconds", "totalQuestions") SELECT "completedAt", "id", "mode", "questionIds", "score", "startedAt", "timeSpentSeconds", "totalQuestions" FROM "ExamSession";
DROP TABLE "ExamSession";
ALTER TABLE "new_ExamSession" RENAME TO "ExamSession";
CREATE INDEX "ExamSession_mode_idx" ON "ExamSession"("mode");
CREATE INDEX "ExamSession_startedAt_idx" ON "ExamSession"("startedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
