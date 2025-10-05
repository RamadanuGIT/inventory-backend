"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.itemRouter = void 0;
const express_1 = require("express");
const prisma_1 = require("../prisma");
const client_1 = require("@prisma/client");
exports.itemRouter = (0, express_1.Router)();
exports.itemRouter.get("/search", async (req, res) => {
    try {
        const q = req.query.q?.toString().trim();
        if (!q) {
            return res.status(400).json({ message: "Query pencarian kosong" });
        }
        const items = await prisma_1.prisma.item.findMany({
            where: {
                OR: [
                    {
                        kode: {
                            contains: q,
                            mode: client_1.Prisma.QueryMode.insensitive,
                        },
                    },
                    {
                        nama: {
                            contains: q,
                            mode: client_1.Prisma.QueryMode.insensitive,
                        },
                    },
                ],
            },
            take: 10,
            orderBy: { nama: "asc" },
        });
        res.json({ items });
    }
    catch (err) {
        console.error("❌ Error /search:", err);
        res.status(500).json({ message: "Terjadi kesalahan server" });
    }
});
// GET semua item
exports.itemRouter.get("/", async (_req, res) => {
    try {
        const items = await prisma_1.prisma.item.findMany({
            orderBy: {
                nama: "asc", // atau bisa 'kode' kalau kamu mau urut berdasarkan Part Number
            },
        });
        res.json({ items });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || "Internal server error" });
    }
});
// Tambah item
exports.itemRouter.post("/", async (req, res) => {
    try {
        const { kode, nama, quantity, description, information, price, priceUSD } = req.body;
        const newItem = await prisma_1.prisma.item.create({
            data: {
                kode,
                nama,
                quantity: Number(quantity),
                price: price ? new client_1.Prisma.Decimal(price) : null,
                priceUSD: priceUSD ? new client_1.Prisma.Decimal(priceUSD) : null,
                description,
                information,
            },
        });
        res.json(newItem);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || "Internal server error" });
    }
});
// Update item
exports.itemRouter.put("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (isNaN(id))
            return res.status(400).json({ error: "ID harus angka" });
        const { kode, nama, quantity, description, information, price, priceUSD } = req.body;
        const data = {}; // Prisma update input
        if (kode !== undefined)
            data.kode = kode;
        if (nama !== undefined)
            data.nama = nama;
        if (quantity !== undefined)
            data.quantity = Number(quantity);
        if (description !== undefined)
            data.description = description;
        if (information !== undefined)
            data.information = information;
        if (price !== undefined)
            data.price = Number(price);
        if (priceUSD !== undefined)
            data.priceUSD = Number(priceUSD);
        const update = await prisma_1.prisma.item.update({
            where: { id },
            data,
        });
        res.json(update);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || "Internal server error" });
    }
});
// Delete item
exports.itemRouter.delete("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (isNaN(id))
            return res.status(400).json({ error: "ID harus angka" });
        await prisma_1.prisma.item.delete({ where: { id } });
        res.json({ message: "Delete berhasil" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || "Internal server error" });
    }
});
// Stock masuk / keluar
exports.itemRouter.post("/stock", async (req, res) => {
    try {
        const { itemId: itemIdRaw, type, jumlah: jumlahRaw, } = req.body;
        const itemId = Number(itemIdRaw);
        const jumlah = Number(jumlahRaw);
        if (isNaN(itemId) || isNaN(jumlah))
            return res.status(400).json({ error: "itemId dan jumlah harus angka" });
        if (!["masuk", "keluar"].includes(type))
            return res
                .status(400)
                .json({ error: "Tipe harus 'masuk' atau 'keluar'" });
        const item = await prisma_1.prisma.item.findUnique({ where: { id: itemId } });
        if (!item)
            return res.status(404).json({ error: "Item tidak ditemukan" });
        // Buat stock log
        const log = await prisma_1.prisma.stockLog.create({
            data: { itemId, type, jumlah },
        });
        // Update total stock
        const newStock = type === "masuk" ? item.quantity + jumlah : item.quantity - jumlah;
        await prisma_1.prisma.item.update({
            where: { id: itemId },
            data: { quantity: newStock },
        });
        res.json({ log, newStock });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || "Internal server error" });
    }
});
//# sourceMappingURL=item.js.map