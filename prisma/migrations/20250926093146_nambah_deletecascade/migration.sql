-- DropForeignKey
ALTER TABLE "public"."StockLog" DROP CONSTRAINT "StockLog_itemId_fkey";

-- AddForeignKey
ALTER TABLE "public"."StockLog" ADD CONSTRAINT "StockLog_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
