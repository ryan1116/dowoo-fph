-- CreateTable
CREATE TABLE "MarketData" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "freightType" TEXT NOT NULL,
    "unitPrice" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "CostMaster" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "category" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "RouteStandard" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "basePrice" REAL NOT NULL,
    "marketAdjustedPrice" REAL NOT NULL,
    "finalPrice" REAL NOT NULL,
    "confidenceScore" REAL NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "MarketData_origin_destination_vehicleType_idx" ON "MarketData"("origin", "destination", "vehicleType");

-- CreateIndex
CREATE INDEX "MarketData_date_idx" ON "MarketData"("date");

-- CreateIndex
CREATE UNIQUE INDEX "CostMaster_item_key" ON "CostMaster"("item");

-- CreateIndex
CREATE INDEX "CostMaster_category_idx" ON "CostMaster"("category");

-- CreateIndex
CREATE INDEX "RouteStandard_origin_destination_idx" ON "RouteStandard"("origin", "destination");

-- CreateIndex
CREATE UNIQUE INDEX "RouteStandard_origin_destination_vehicleType_key" ON "RouteStandard"("origin", "destination", "vehicleType");
