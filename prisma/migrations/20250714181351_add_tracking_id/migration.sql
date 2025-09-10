/*
  Warnings:

  - Added the required column `trackingId` to the `SlideitOrder` table without a default value. This is not possible if the table is not empty.
  - Made the column `raw` on table `SlideitOrder` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SlideitOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trackingId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productTitle" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "raw" JSONB NOT NULL
);
INSERT INTO "new_SlideitOrder" ("createdAt", "id", "price", "productTitle", "raw", "status") SELECT "createdAt", "id", "price", "productTitle", "raw", "status" FROM "SlideitOrder";
DROP TABLE "SlideitOrder";
ALTER TABLE "new_SlideitOrder" RENAME TO "SlideitOrder";
CREATE UNIQUE INDEX "SlideitOrder_trackingId_key" ON "SlideitOrder"("trackingId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
