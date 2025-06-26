/*
  Warnings:

  - You are about to drop the column `agreementPercent` on the `board_label_status` table. All the data in the column will be lost.
  - You are about to drop the column `totalVotes` on the `board_label_status` table. All the data in the column will be lost.
  - You are about to drop the column `votesAgainst` on the `board_label_status` table. All the data in the column will be lost.
  - You are about to drop the column `votesFor` on the `board_label_status` table. All the data in the column will be lost.
  - You are about to drop the column `vote` on the `board_label_votes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "board_label_status" DROP COLUMN "agreementPercent",
DROP COLUMN "totalVotes",
DROP COLUMN "votesAgainst",
DROP COLUMN "votesFor",
ADD COLUMN     "voteCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "board_label_votes" DROP COLUMN "vote";
