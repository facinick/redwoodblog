-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserRole" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "userId" INTEGER,
    CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_UserRole" ("createdAt", "id", "name", "updatedAt", "userId") SELECT "createdAt", "id", "name", "updatedAt", "userId" FROM "UserRole";
DROP TABLE "UserRole";
ALTER TABLE "new_UserRole" RENAME TO "UserRole";
CREATE UNIQUE INDEX "UserRole_name_userId_key" ON "UserRole"("name", "userId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;