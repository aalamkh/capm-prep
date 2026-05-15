-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "options" TEXT NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "reference" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ExamSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mode" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "totalQuestions" INTEGER NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "timeSpentSeconds" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "userAnswer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "timeSpentSeconds" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Answer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ExamSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StudyStreak" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "questionsAnswered" INTEGER NOT NULL DEFAULT 0,
    "accuracyRate" REAL NOT NULL DEFAULT 0
);

-- CreateIndex
CREATE INDEX "Question_domain_idx" ON "Question"("domain");

-- CreateIndex
CREATE INDEX "Question_difficulty_idx" ON "Question"("difficulty");

-- CreateIndex
CREATE INDEX "Question_type_idx" ON "Question"("type");

-- CreateIndex
CREATE INDEX "ExamSession_mode_idx" ON "ExamSession"("mode");

-- CreateIndex
CREATE INDEX "ExamSession_startedAt_idx" ON "ExamSession"("startedAt");

-- CreateIndex
CREATE INDEX "Answer_sessionId_idx" ON "Answer"("sessionId");

-- CreateIndex
CREATE INDEX "Answer_questionId_idx" ON "Answer"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "StudyStreak_date_key" ON "StudyStreak"("date");

-- CreateIndex
CREATE INDEX "StudyStreak_date_idx" ON "StudyStreak"("date");
