-- AlterTable
ALTER TABLE `User` ADD COLUMN `settings` JSON NULL,
    ADD COLUMN `twoFactorCode` VARCHAR(191) NULL,
    ADD COLUMN `twoFactorEnabled` BOOLEAN NOT NULL DEFAULT false;
