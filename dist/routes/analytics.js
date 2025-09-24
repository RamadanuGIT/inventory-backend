"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
router.get("/dashboard", async (_req, res) => {
    try {
        const totalItems = await prisma.item.count();
        const totalStock = await prisma.item.aggregate({
            _sum: { stockAwal: true },
        });
        const lowStock = await prisma.item.count({
            where: { stockAwal: { lt: 10 } },
        });
        // Ambil transaksi 12 bulan terakhir
        const rawTransactions = await prisma.$queryRaw `
      SELECT DATE_TRUNC('month', "tanggal") AS month,
             SUM(CASE WHEN type = 'IN'  THEN jumlah ELSE 0 END)  AS total_in,
             SUM(CASE WHEN type = 'OUT' THEN jumlah ELSE 0 END) AS total_out
      FROM "StockLog"
      WHERE "tanggal" >= NOW() - INTERVAL '3 months'
      GROUP BY 1
      ORDER BY 1;
    `;
        // Konversi BigInt -> number (atau string) agar aman di JSON
        const transactions = rawTransactions.map((t) => ({
            month: t.month,
            total_in: Number(t.total_in ?? 0),
            total_out: Number(t.total_out ?? 0),
        }));
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