-- AlterTable
ALTER TABLE `User` ADD COLUMN `isLoggedIn` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `multipleDevicesAllowed` BOOLEAN NOT NULL DEFAULT false;
