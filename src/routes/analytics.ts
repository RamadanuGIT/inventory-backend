import { Router } from "express";
import { PrismaClient } from "@prisma/client/extension";

const prisma = new PrismaClient();
const router = Router();

router.get("/dashboard", async (req, res) => {
  try {
    const totalItems = await prisma.item.count();
    const totalStock = await prisma.item.aggregate({
      _sum: { quantity: true },
    });

    const lowStock = await prisma.item.count();

    // Transaksi perbulan (12 bulan terakhir)
    const transactions = await prisma.$queryRaw`
    SELECT DATE_TRUNC('month', "createdAt") AS month,
            SUM (CASE WHEN type = 'IN' THEN quantity ELSE 0 END) AS total_in,
            SUM (CASE WHEN type = 'OUT' THEN quantity ELSE 0 END) AS total_out
    FROM "StockLog"
    WHERE "createdAt" >= NOW() - INTERVAL '12 months'
    GROUP BY 1
    ORDER BY 1;
     `;

    res.json({
      totalItems,
      totalStock: totalStock._sum.quantity || 0,
      lowStock,
      transactions,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
