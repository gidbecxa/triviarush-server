/*
  Warnings:

  - You are about to drop the column `content` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `timeStamp` on the `Message` table. All the data in the column will be lost.
  - Added the required column `text` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Message` DROP COLUMN `content`,
    DROP COLUMN `timeStamp`,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `system` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `text` INTEGER NOT NULL;
