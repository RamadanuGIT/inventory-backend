"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
router.get("/dashboard", async (_req, res) => {
    try {
        const totalItems = await prisma.item.count();
        const totalStockAgg = await prisma.item.aggregate({
            _sum: { stockAwal: true },
        });
        const totalStock = totalStockAgg._sum?.stockAwal || 0;
        // 1️⃣ Low Stock Items
        const lowStockItems = await prisma.item.findMany({
            where: { stockAwal: { lt: 10 } },
            select: { id: true, nama: true, stockAwal: true },
        });
        // 2️⃣ Transactions 3 bulan terakhir
        const rawTransactions = await prisma.$queryRaw `
      SELECT DATE_TRUNC('month', "tanggal") AS month,
             SUM(CASE WHEN type='IN' THEN jumlah ELSE 0 END) AS total_in,
             SUM(CASE WHEN type='OUT' THEN jumlah ELSE 0 END) AS total_out
      FROM "StockLog"
      WHERE "tanggal" >= (CURRENT_DATE - INTERVAL '3 months')
      GROUP BY 1
      ORDER BY 1
    `;
        const transactions = rawTransactions.map((t) => ({
            month: t.month,
            total_in: Number(t.total_in ?? 0),
            total_out: Number(t.total_out ?? 0),
        }));
        // 3️⃣ Stagnant Items (tidak keluar sama sekali 3 bulan terakhir)
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const stagnantItems = await prisma.$queryRaw `
      SELECT i.id, i.nama, i."stockAwal"
      FROM "Item" i
      LEFT JOIN (
        SELECT "itemId", MAX("tanggal") as lastOut
        FROM "StockLog"
        WHERE type='OUT'
        GROUP BY "itemId"
      ) l ON i.id = l."itemId"
      WHERE l.lastOut IS NULL OR l.lastOut < ${threeMonthsAgo};
    `;
        // 4️⃣ Top Sales 1 bulan terakhir
        const salesRankingRaw = await prisma.$queryRaw `
      SELECT "itemId", "nama", SUM(jumlah) AS total_out
      FROM "StockLog"
      WHERE type='OUT' AND "tanggal" >= (CURRENT_DATE - INTERVAL '1 month')
      GROUP BY "itemId", "nama"
      ORDER BY total_out DESC
      LIMIT 10
    `;
        const salesRanking = salesRankingRaw.map((s) => ({
            ...s,
            total_out: Number(s.total_out),
        }));
        res.json({
            totalItems,
            totalStock,
            lowStockItems,
            lowStock: lowStockItems.length,
            stagnantItems,
            stagnantItemsCount: stagnantItems.length,
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