"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
router.get("/dashboard", async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        // Total items & stock
        const totalItems = await prisma.item.count();
        const totalStock = await prisma.item.aggregate({
            _sum: { quantity: true },
        });
        // Low Stock Items
        const lowStockItems = await prisma.item.findMany({
            where: { quantity: { lt: 10 } },
            select: { id: true, nama: true, quantity: true },
        });
        // Stagnant Items (tidak keluar selama 3 bulan)
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const stagnantItems = await prisma.item.findMany({
            where: {
                logs: {
                    none: {
                        type: "keluar",
                        tanggal: { gte: threeMonthsAgo },
                    },
                },
            },
            select: { id: true, nama: true, quantity: true },
        });
        // Date range transaksi 12 bulan (default)
        let start = startDate ? new Date(startDate) : new Date();
        start.setFullYear(start.getFullYear() - 1);
        let end = endDate ? new Date(endDate) : new Date();
        // Transaksi 12 bulan terakhir / date range
        const rawTransactions = (await prisma.$queryRaw `
      SELECT DATE_TRUNC('day', "tanggal") AS date,
             SUM(CASE WHEN type='masuk' THEN jumlah ELSE 0 END) AS total_in,
             SUM(CASE WHEN type='keluar' THEN jumlah ELSE 0 END) AS total_out
      FROM "StockLog"
      WHERE "tanggal" BETWEEN ${start} AND ${end}
      GROUP BY 1
      ORDER BY 1
    `);
        const transactions = rawTransactions.map((t) => ({
            date: t.date,
            total_in: Number(t.total_in ?? 0),
            total_out: Number(t.total_out ?? 0),
        }));
        // Top Sales 1 bulan terakhir
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        const salesRankingRaw = (await prisma.$queryRaw `
      SELECT "StockLog"."itemId", "Item"."nama", SUM("StockLog"."jumlah") AS total_out
  FROM "StockLog"
  JOIN "Item" ON "StockLog"."itemId" = "Item"."id"
  WHERE "StockLog"."type"='keluar' AND "StockLog"."tanggal" >= ${oneMonthAgo}
  GROUP BY "StockLog"."itemId", "Item"."nama"
  ORDER BY total_out DESC
  LIMIT 10
    `);
        const salesRanking = salesRankingRaw.map((s) => ({
            ...s,
            nama: String(s.nama),
            total_out: Number(s.total_out),
        }));
        res.json({
            totalItems,
            totalStock: totalStock._sum?.quantity || 0,
            lowStock: lowStockItems.length,
            lowStockItems,
            stagnantItemsCount: stagnantItems.length,
            stagnantItems,
            transactions,
            salesRanking,
        });
    }
    catch (err) {
        console.error("Dashboard error:", err);
        res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
//# sourceMappingURL=analytics.js.map