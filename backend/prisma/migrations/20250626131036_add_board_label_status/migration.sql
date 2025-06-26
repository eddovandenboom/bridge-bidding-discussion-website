/*
  Warnings:

  - You are about to drop the `board_labels` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "board_labels" DROP CONSTRAINT "board_labels_boardId_fkey";

-- DropForeignKey
ALTER TABLE "board_labels" DROP CONSTRAINT "board_labels_labelId_fkey";

-- DropForeignKey
ALTER TABLE "board_labels" DROP CONSTRAINT "board_labels_userId_fkey";

-- DropTable
DROP TABLE "board_labels";

-- CreateTable
CREATE TABLE "board_label_votes" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vote" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "board_label_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "board_label_status" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,
    "votesFor" INTEGER NOT NULL DEFAULT 0,
    "votesAgainst" INTEGER NOT NULL DEFAULT 0,
    "totalVotes" INTEGER NOT NULL DEFAULT 0,
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "agreementPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "board_label_status_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "board_label_votes_boardId_labelId_userId_key" ON "board_label_votes"("boardId", "labelId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "board_label_status_boardId_labelId_key" ON "board_label_status"("boardId", "labelId");

-- AddForeignKey
ALTER TABLE "board_label_votes" ADD CONSTRAINT "board_label_votes_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "board_label_votes" ADD CONSTRAINT "board_label_votes_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "labels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "board_label_votes" ADD CONSTRAINT "board_label_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "board_label_status" ADD CONSTRAINT "board_label_status_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "board_label_status" ADD CONSTRAINT "board_label_status_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "labels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
