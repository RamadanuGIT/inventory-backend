"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/analytics.ts
const express_1 = require("express");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
router.get("/dashboard", async (_req, res) => {
    try {
        // Total item yang terdaftar
        const totalItems = await prisma.item.count();
        // Total stok awal dari semua item
        const totalStock = await prisma.item.aggregate({
            _sum: { stockAwal: true },
        });
        // Item yang stok awalnya rendah (misal < 10) – bisa sesuaikan threshold
        const lowStock = await prisma.item.count({
            where: { stockAwal: { lt: 10 } },
        });
        // Transaksi per bulan (12 bulan terakhir)
        // Menggunakan kolom "jumlah" karena itu yang merepresentasikan jumlah per log
        const transactions = await prisma.$queryRaw `
      SELECT DATE_TRUNC('month', "tanggal") AS month,
             SUM(CASE WHEN type = 'IN'  THEN jumlah ELSE 0 END)  AS total_in,
             SUM(CASE WHEN type = 'OUT' THEN jumlah ELSE 0 END) AS total_out
      FROM "StockLog"
      WHERE "tanggal" >= NOW() - INTERVAL '12 months'
      GROUP BY 1
      ORDER BY 1;
    `;
        res.json({
            totalItems,
            totalStock: totalStock._sum?.stockAwal || 0,
            lowStock,
            transactions,
        });
    }
    catch (err) {
        console.error("Analytics error:", err);
        res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
//# sourceMappingURL=analytics.js.map