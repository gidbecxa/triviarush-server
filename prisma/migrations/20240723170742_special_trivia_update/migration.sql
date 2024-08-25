/*
  Warnings:

  - You are about to alter the column `topics` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Json` to `Enum(EnumId(10))`.

*/
-- AlterTable
ALTER TABLE `Question` ADD COLUMN `category` ENUM('all', 'animals', 'food', 'games', 'general', 'geography', 'history', 'maths', 'movies', 'music', 'riddles', 'science', 'sports', 'technology') NOT NULL DEFAULT 'all',
    MODIFY `level` ENUM('rookie', 'trivia_ace', 'expert', 'guru', 'mastermind', 'grand_trivia_maestro') NOT NULL DEFAULT 'rookie';

-- AlterTable
ALTER TABLE `Room` MODIFY `category` ENUM('all', 'animals', 'food', 'games', 'general', 'geography', 'history', 'maths', 'movies', 'music', 'riddles', 'science', 'sports', 'technology') NOT NULL DEFAULT 'general';

-- AlterTable
ALTER TABLE `TriviaTopic` MODIFY `slug` ENUM('all', 'animals', 'food', 'games', 'general', 'geography', 'history', 'maths', 'movies', 'music', 'riddles', 'science', 'sports', 'technology') NOT NULL;

-- AlterTable
ALTER TABLE `User` MODIFY `topics` ENUM('all', 'animals', 'food', 'games', 'general', 'geography', 'history', 'maths', 'movies', 'music', 'riddles', 'science', 'sports', 'technology') NOT NULL,
    MODIFY `skillLevel` ENUM('rookie', 'trivia_ace', 'expert', 'guru', 'mastermind', 'grand_trivia_maestro') NOT NULL DEFAULT 'rookie';

-- CreateTable
CREATE TABLE `TriviaSpecial` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `caption` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `rewardId` INTEGER NOT NULL DEFAULT 1,
    `category` ENUM('all', 'animals', 'food', 'games', 'general', 'geography', 'history', 'maths', 'movies', 'music', 'riddles', 'science', 'sports', 'technology') NOT NULL DEFAULT 'all',
    `type` ENUM('personal_challenge', 'multiplayer_challenge', 'daily_challenge', 'sixty_secs_challenge', 'fastest_time_challenge') NOT NULL DEFAULT 'daily_challenge',
    `playersPerRoom` INTEGER NOT NULL DEFAULT 1,
    `avatar` VARCHAR(191) NULL,
    `status` ENUM('upcoming', 'open', 'closed') NOT NULL DEFAULT 'upcoming',
    `questions` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SpecialRoom` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `specialId` INTEGER NOT NULL,
    `state` ENUM('waiting', 'active', 'ended') NOT NULL DEFAULT 'waiting',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SpecialPlayer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `roomId` INTEGER NOT NULL,
    `specialId` INTEGER NOT NULL,
    `playerTime` BIGINT NOT NULL,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `SpecialPlayer_userId_roomId_key`(`userId`, `roomId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TriviaReward` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `avatar` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TriviaSpecial` ADD CONSTRAINT `TriviaSpecial_rewardId_fkey` FOREIGN KEY (`rewardId`) REFERENCES `TriviaReward`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SpecialRoom` ADD CONSTRAINT `SpecialRoom_specialId_fkey` FOREIGN KEY (`specialId`) REFERENCES `TriviaSpecial`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SpecialPlayer` ADD CONSTRAINT `SpecialPlayer_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SpecialPlayer` ADD CONSTRAINT `SpecialPlayer_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `SpecialRoom`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SpecialPlayer` ADD CONSTRAINT `SpecialPlayer_specialId_fkey` FOREIGN KEY (`specialId`) REFERENCES `TriviaSpecial`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
