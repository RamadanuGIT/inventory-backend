"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stockRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.stockRouter = (0, express_1.Router)();
// GET semua stock logs
// stockRouter.ts
exports.stockRouter.get("/stock-logs", async (req, res) => {
    try {
        const { search, sort = "tanggal", order = "desc", type, startDate, endDate, limit = "50", page = "1", kode, nama, } = req.query;
        const where = {};
        // filter tipe transaksi
        if (type)
            where.type = type;
        // filter tanggal
        if (startDate || endDate) {
            where.tanggal = {};
            if (startDate)
                where.tanggal.gte = new Date(String(startDate));
            if (endDate)
                where.tanggal.lte = new Date(String(endDate));
        }
        // filter berdasarkan relasi item
        const itemFilters = [];
        if (kode)
            itemFilters.push({
                kode: { contains: String(kode), mode: "insensitive" },
            });
        if (nama)
            itemFilters.push({
                nama: { contains: String(nama), mode: "insensitive" },
            });
        if (search)
            itemFilters.push({
                OR: [
                    { kode: { contains: String(search), mode: "insensitive" } },
                    { nama: { contains: String(search), mode: "insensitive" } },
                ],
            });
        if (itemFilters.length > 0) {
            where.item = { AND: itemFilters };
        }
        const take = parseInt(limit, 10);
        const skip = (parseInt(page, 10) - 1) * take;
        const logs = await prisma.stockLog.findMany({
            where,
            orderBy: { [String(sort)]: order === "asc" ? "asc" : "desc" },
            include: { item: true },
            take,
            skip,
        });
        const total = await prisma.stockLog.count({ where });
        res.json({ logs, total });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Gagal mengambil data stock logs" });
    }
});
// POST stock masuk / keluar
exports.stockRouter.post("/stock", async (req, res) => {
    try {
        const { itemId, type, jumlah } = req.body;
        const item = await prisma.item.findUnique({
            where: { id: Number(itemId) },
        });
        if (!item)
            return res.status(404).json({ error: "Item tidak ditemukan" });
        // Update total stock
        const newStock = type === "masuk"
            ? item.quantity + Number(jumlah)
            : item.quantity - Number(jumlah);
        await prisma.item.update({
            where: { id: Number(itemId) },
            data: { quantity: newStock },
        });
        // Buat stock log
        const log = await prisma.stockLog.create({
            data: {
                itemId: Number(itemId),
                type,
                jumlah: Number(jumlah),
            },
        });
        // Ambil log beserta item untuk response
        const logWithItem = await prisma.stockLog.findUnique({
            where: { id: log.id },
            include: { item: true },
        });
        res.json({
            log: {
                id: logWithItem.id,
                itemId: logWithItem.itemId,
                kode: logWithItem.item.kode,
                nama: logWithItem.item.nama,
                type: logWithItem.type,
                jumlah: logWithItem.jumlah,
                tanggal: logWithItem.tanggal,
            },
            newStock,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Gagal update stock" });
    }
});
//# sourceMappingURL=stockLog.js.map