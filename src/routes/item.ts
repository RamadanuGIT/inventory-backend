import { Router } from "express";
import { prisma } from "../prisma";
import { Prisma } from "@prisma/client";

export const itemRouter = Router();

// Interface untuk stock request
interface StockRequest {
  itemId: number;
  type: "masuk" | "keluar";
  jumlah: number;
}

itemRouter.get("/search", async (req, res) => {
  try {
    const q = req.query.q?.toString().trim();

    if (!q) {
      return res.status(400).json({ message: "Query pencarian kosong" });
    }

    const items = await prisma.item.findMany({
      where: {
        OR: [
          {
            kode: {
              contains: q,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            nama: {
              contains: q,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        ],
      },
      take: 10,
      orderBy: { nama: "asc" },
    });

    res.json({ items });
  } catch (err: any) {
    console.error("❌ Error /search:", err);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

// GET semua item
itemRouter.get("/", async (_req, res) => {
  try {
    const items = await prisma.item.findMany({
      orderBy: {
        nama: "asc", // atau bisa 'kode' kalau kamu mau urut berdasarkan Part Number
      },
    });
    res.json({ items });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Tambah item
itemRouter.post("/", async (req, res) => {
  try {
    const { kode, nama, quantity, description, information, price, priceUSD } =
      req.body;
    const newItem = await prisma.item.create({
      data: {
        kode,
        nama,
        quantity: Number(quantity),
        price: price ? new Prisma.Decimal(price) : null,
        priceUSD: priceUSD ? new Prisma.Decimal(priceUSD) : null,
        description,
        information,
      },
    });
    res.json(newItem);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Update item
itemRouter.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID harus angka" });

    const { kode, nama, quantity, description, information, price, priceUSD } =
      req.body;

    const data: any = {}; // Prisma update input

    if (kode !== undefined) data.kode = kode;
    if (nama !== undefined) data.nama = nama;
    if (quantity !== undefined) data.quantity = Number(quantity);
    if (description !== undefined) data.description = description;
    if (information !== undefined) data.information = information;
    if (price !== undefined) data.price = Number(price);
    if (priceUSD !== undefined) data.priceUSD = Number(priceUSD);

    const update = await prisma.item.update({
      where: { id },
      data,
    });

    res.json(update);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Delete item
itemRouter.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID harus angka" });

    await prisma.item.delete({ where: { id } });
    res.json({ message: "Delete berhasil" });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Stock masuk / keluar
itemRouter.post("/stock", async (req, res) => {
  try {
    const {
      itemId: itemIdRaw,
      type,
      jumlah: jumlahRaw,
    }: StockRequest = req.body;
    const itemId = Number(itemIdRaw);
    const jumlah = Number(jumlahRaw);

    if (isNaN(itemId) || isNaN(jumlah))
      return res.status(400).json({ error: "itemId dan jumlah harus angka" });

    if (!["masuk", "keluar"].includes(type))
      return res
        .status(400)
        .json({ error: "Tipe harus 'masuk' atau 'keluar'" });

    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) return res.status(404).json({ error: "Item tidak ditemukan" });

    // Buat stock log
    const log = await prisma.stockLog.create({
      data: { itemId, type, jumlah },
    });

    // Update total stock
    const newStock =
      type === "masuk" ? item.quantity + jumlah : item.quantity - jumlah;
    await prisma.item.update({
      where: { id: itemId },
      data: { quantity: newStock },
    });

    res.json({ log, newStock });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});
