/*
  Warnings:

  - The primary key for the `Item` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `stockKeluar` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `stockMasuk` on the `Item` table. All the data in the column will be lost.
  - The `id` column on the `Item` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[kode]` on the table `Item` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Item" DROP CONSTRAINT "Item_pkey",
DROP COLUMN "stockKeluar",
DROP COLUMN "stockMasuk",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Item_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "public"."StockLog" (
    "id" SERIAL NOT NULL,
    "itemId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Item_kode_key" ON "public"."Item"("kode");

-- AddForeignKey
ALTER TABLE "public"."StockLog" ADD CONSTRAINT "StockLog_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
