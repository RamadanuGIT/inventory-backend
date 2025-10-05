import fs from "fs";
import path from "path";
import csvParser from "csv-parser";
import { prisma } from "../src/prisma";

// 🔹 Fungsi parse harga string ke number
function parsePrice(value: string | number | undefined): number | null {
  if (value === undefined || value === null) return null;
  const str = String(value);
  const cleaned = str
    .replace(/[^0-9.,]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  return cleaned ? parseFloat(cleaned) : null;
}

// 🔹 Normalisasi key dan value CSV
function normalizeRow(row: Record<string, any>) {
  const normalized: Record<string, any> = {};
  for (const key in row) {
    const cleanKey = key.trim().toLowerCase().replace(/\s+/g, ""); // hapus semua spasi dalam key
    const value = typeof row[key] === "string" ? row[key].trim() : row[key];
    normalized[cleanKey] = value;
  }
  return normalized;
}

async function main() {
  const filePath = path.join(__dirname, "items.csv"); // lokasi CSV

  if (!fs.existsSync(filePath)) {
    console.error("❌ File CSV tidak ditemukan di:", filePath);
    process.exit(1);
  }

  const results: any[] = [];

  fs.createReadStream(filePath)
    .pipe(csvParser())
    .on("data", (data) => results.push(data))
    .on("end", async () => {
      console.log("✅ CSV parsed, total rows:", results.length);

      if (results.length > 0) {
        console.log("🔎 Headers dari CSV:", Object.keys(results[0]));
        console.log("🔎 Contoh row pertama:", results[0]);
      }

      let success = 0;
      let failed = 0;

      for (const rawRow of results) {
        const row = normalizeRow(rawRow);

        try {
          await prisma.item.create({
            data: {
              kode: row["kode"]?.trim() || "",
              nama: row["nama"]?.trim() || "",
              quantity: Number(row["quantity"]) || 0,
              price: parsePrice(row["price"]),
              priceUSD: parsePrice(row["priceusd"]),
              description: row["description"]?.trim() || null,
              information: row["information"]?.trim() || null,
            },
          });
          success++;
        } catch (err: any) {
          failed++;
          console.error("❌ Gagal insert row:", row["kode"], "-", err.message);
        }
      }

      console.log(`✅ Import selesai: ${success} berhasil, ${failed} gagal`);
      process.exit(0);
    });
}

main().catch((e) => {
  console.error("❌ Terjadi error:", e);
  process.exit(1);
});
