import express from "express";
import { prisma } from "../prisma";

export const stockOutRouter = express.Router();
// Batch keluar stok
stockOutRouter.post("/stock/out/batch", async (req, res) => {
  try {
    const { items } = req.body; // [{ itemId, jumlah }, ...]

    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ message: "Items wajib diisi" });

    const results = [];

    for (let i = 0; i < items.length; i++) {
      const { itemId, jumlah } = items[i];

      const item = await prisma.item.findUnique({
        where: { id: Number(itemId) },
      });
      if (!item)
        return res
          .status(404)
          .json({ message: `Item dengan id ${itemId} tidak ditemukan` });

      if (item.stockAwal < jumlah)
        return res
          .status(400)
          .json({ message: `Stok tidak cukup untuk item ${item.nama}` });

      // Kurangi stockAwal
      const updatedItem = await prisma.item.update({
        where: { id: itemId },
        data: { stockAwal: item.stockAwal - jumlah },
      });

      // Tambah log keluar
      const log = await prisma.stockLog.create({
        data: {
          itemId,
          kode: item.kode,
          nama: item.nama,
          type: "out",
          jumlah,
        },
      });

      results.push({ item: updatedItem, log });
    }

    res.json({ message: "Transaksi berhasil", results });
  } catch (err: unknown) {
    console.error("ERROR /stock/out/batch:", err);
    if (err instanceof Error) {
      res
        .status(500)
        .json({ message: "Terjadi kesalahan server", error: err.message });
    } else {
      res
        .status(500)
        .json({ message: "Terjadi kesalahan server", error: String(err) });
    }
  }
});
