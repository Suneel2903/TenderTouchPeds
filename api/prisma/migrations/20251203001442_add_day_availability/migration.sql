-- CreateTable
CREATE TABLE "DayAvailability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "availabilityType" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "DayAvailability_date_key" ON "DayAvailability"("date");

-- CreateIndex
CREATE INDEX "DayAvailability_date_idx" ON "DayAvailability"("date");
