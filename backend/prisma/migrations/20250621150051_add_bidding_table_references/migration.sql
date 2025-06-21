-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "biddingTableId" TEXT;

-- AlterTable
ALTER TABLE "polls" ADD COLUMN     "biddingTableId" TEXT;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_biddingTableId_fkey" FOREIGN KEY ("biddingTableId") REFERENCES "bidding_tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polls" ADD CONSTRAINT "polls_biddingTableId_fkey" FOREIGN KEY ("biddingTableId") REFERENCES "bidding_tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;
