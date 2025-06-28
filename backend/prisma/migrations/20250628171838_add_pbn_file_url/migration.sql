/*
  Warnings:

  - You are about to drop the column `pbnUrl` on the `tournaments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tournaments" DROP COLUMN "pbnUrl",
ADD COLUMN     "pbnFileUrl" TEXT;
