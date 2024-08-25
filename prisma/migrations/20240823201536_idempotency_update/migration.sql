-- AlterTable
ALTER TABLE `Room` ADD COLUMN `idempotencyId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `SpecialRoom` ADD COLUMN `idempotencyId` VARCHAR(191) NULL;
