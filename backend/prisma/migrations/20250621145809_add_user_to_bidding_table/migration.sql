/*
  Warnings:

  - Added the required column `userId` to the `bidding_tables` table without a default value. This is not possible if the table is not empty.

*/
-- First add the column as nullable
ALTER TABLE "bidding_tables" ADD COLUMN "userId" TEXT;

-- Set existing records to the first user found (demo user)
UPDATE "bidding_tables" SET "userId" = (SELECT "id" FROM "users" LIMIT 1) WHERE "userId" IS NULL;

-- Now make the column not null
ALTER TABLE "bidding_tables" ALTER COLUMN "userId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "bidding_tables" ADD CONSTRAINT "bidding_tables_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
