-- CreateTable
CREATE TABLE "SlideitOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productTitle" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "raw" JSONB
);
