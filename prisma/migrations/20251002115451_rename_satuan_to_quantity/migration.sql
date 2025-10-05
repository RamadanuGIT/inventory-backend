/*
  Warnings:

  - You are about to drop the column `satuan` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `stockAwal` on the `Item` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Item" DROP COLUMN "satuan",
DROP COLUMN "stockAwal",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "information" TEXT,
ADD COLUMN     "priceUSD" DECIMAL(10,2),
ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 0;
