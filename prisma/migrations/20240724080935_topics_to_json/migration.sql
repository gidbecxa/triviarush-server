/*
  Warnings:

  - You are about to alter the column `topics` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(4))` to `Json`.

*/
-- AlterTable
ALTER TABLE `User` MODIFY `topics` JSON NULL;
