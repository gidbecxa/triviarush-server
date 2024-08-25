-- CreateTable
CREATE TABLE `PlayerReward` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `rewardId` INTEGER NOT NULL,
    `isClaimed` BOOLEAN NOT NULL DEFAULT false,
    `dateEarned` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PlayerReward_userId_rewardId_key`(`userId`, `rewardId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PlayerReward` ADD CONSTRAINT `PlayerReward_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlayerReward` ADD CONSTRAINT `PlayerReward_rewardId_fkey` FOREIGN KEY (`rewardId`) REFERENCES `TriviaReward`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
