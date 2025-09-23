import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const itemRouter = Router();

// Interface untuk stock request
interface StockRequest {
  itemId: number;
  type: "masuk" | "keluar";
  jumlah: number;
}

// GET semua item
itemRouter.get("/", async (_req, res) => {
  try {
    const items = await prisma.item.findMany();
    res.json({ items });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Tambah item
itemRouter.post("/", async (req, res) => {
  console.log("REQ BODY:", req.body);
  try {
    const { kode, nama, satuan, stockAwal } = req.body;
    const newItem = await prisma.item.create({
      data: {
        kode,
        nama,
        satuan,
        stockAwal: Number(stockAwal),
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

    const update = await prisma.item.update({
      where: { id },
      data: {
        ...req.body,
        stockAwal: req.body.stockAwal ? Number(req.body.stockAwal) : undefined,
      },
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
      type === "masuk" ? item.stockAwal + jumlah : item.stockAwal - jumlah;
    await prisma.item.update({
      where: { id: itemId },
      data: { stockAwal: newStock },
    });

    res.json({ log, newStock });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});
