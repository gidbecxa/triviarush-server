-- CreateTable
CREATE TABLE `Response` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `roomId` INTEGER NOT NULL,
    `questionId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `score` INTEGER NOT NULL DEFAULT 0,
    `responseTime` INTEGER NOT NULL,
    `fastestTimeScore` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `Response_roomId_questionId_userId_key`(`roomId`, `questionId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Response` ADD CONSTRAINT `Response_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `Room`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Response` ADD CONSTRAINT `Response_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Response` ADD CONSTRAINT `Response_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
