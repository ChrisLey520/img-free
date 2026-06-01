-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RedemptionCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNUSED',
    "resultPath" TEXT,
    "pddOrderId" TEXT,
    "remakesUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" DATETIME,
    "expiresAt" DATETIME
);
INSERT INTO "new_RedemptionCode" ("code", "createdAt", "expiresAt", "id", "pddOrderId", "resultPath", "status", "usedAt") SELECT "code", "createdAt", "expiresAt", "id", "pddOrderId", "resultPath", "status", "usedAt" FROM "RedemptionCode";
DROP TABLE "RedemptionCode";
ALTER TABLE "new_RedemptionCode" RENAME TO "RedemptionCode";
CREATE UNIQUE INDEX "RedemptionCode_code_key" ON "RedemptionCode"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
