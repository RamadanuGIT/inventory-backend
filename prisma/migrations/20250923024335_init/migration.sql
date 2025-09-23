-- CreateTable
CREATE TABLE "public"."Item" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "satuan" TEXT NOT NULL,
    "stockAwal" INTEGER NOT NULL,
    "stockMasuk" INTEGER NOT NULL DEFAULT 0,
    "stockKeluar" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);
