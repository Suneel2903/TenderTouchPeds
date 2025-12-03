-- CreateTable
CREATE TABLE "DateAvailability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "slotId" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DateAvailability_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "TimeSlot" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "DateAvailability_date_idx" ON "DateAvailability"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DateAvailability_date_slotId_key" ON "DateAvailability"("date", "slotId");
