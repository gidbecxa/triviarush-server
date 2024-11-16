/*
  Warnings:

  - You are about to drop the column `score` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `User` DROP COLUMN `score`,
    ADD COLUMN `points` INTEGER NOT NULL DEFAULT 1;
