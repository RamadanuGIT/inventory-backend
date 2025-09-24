import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

router.get("/dashboard", async (_req, res) => {
  try {
    const totalItems = await prisma.item.count();
    const totalStock = await prisma.item.aggregate({
      _sum: { stockAwal: true },
    });

    // Low Stock Items
    const lowStockItems = await prisma.item.findMany({
      where: { stockAwal: { lt: 10 } },
      select: { id: true, nama: true, stockAwal: true },
    });

    // Transaksi 3 bulan terakhir per bulan
    const rawTransactions = await prisma.$queryRaw<
      { month: Date; total_in: bigint | null; total_out: bigint | null }[]
    >`
      SELECT DATE_TRUNC('month', "tanggal") AS month,
             SUM(CASE WHEN type = 'IN'  THEN jumlah ELSE 0 END)  AS total_in,
             SUM(CASE WHEN type = 'OUT' THEN jumlah ELSE 0 END) AS total_out
      FROM "StockLog"
      WHERE "tanggal" >= (CURRENT_DATE - INTERVAL '3 months')
      GROUP BY 1
      ORDER BY 1;
    `;

    const transactions = rawTransactions.map((t) => ({
      month: t.month,
      total_in: Number(t.total_in ?? 0),
      total_out: Number(t.total_out ?? 0),
    }));

    // Stagnant Items (tidak keluar selama 3 bulan)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const stagnantItems = await prisma.item.findMany({
      where: {
        logs: {
          none: {
            type: "OUT",
            tanggal: {
              gte: threeMonthsAgo,
            },
          },
        },
      },
      select: { id: true, nama: true },
    });

    // Top Sales 1 bulan terakhir
    const salesRanking = await prisma.$queryRaw<
      { itemId: number; nama: string; total_out: bigint }[]
    >`
      SELECT "itemId", "nama", SUM(jumlah) AS total_out
      FROM "StockLog"
      WHERE type = 'OUT'
        AND "tanggal" >= (CURRENT_DATE - INTERVAL '1 month')
      GROUP BY "itemId", "nama"
      ORDER BY total_out DESC
      LIMIT 10;
    `;

    const salesRankingSafe = salesRanking.map((s) => ({
      ...s,
      total_out: Number(s.total_out),
    }));

    res.json({
      totalItems,
      totalStock: totalStock._sum?.stockAwal || 0,
      lowStock: lowStockItems.length,
      lowStockItems,
      stagnantItemsCount: stagnantItems.length,
      stagnantItems,
      transactions,
      salesRanking: salesRankingSafe,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
