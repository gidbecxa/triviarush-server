/*
  Warnings:

  - You are about to drop the column `fastestTimeScore` on the `Response` table. All the data in the column will be lost.
  - You are about to drop the column `playersPerRoom` on the `TriviaSpecial` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `TriviaSpecial` table. All the data in the column will be lost.
  - You are about to alter the column `type` on the `TriviaSpecial` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(7))` to `Enum(EnumId(5))`.
  - Made the column `avatar` on table `TriviaSpecial` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Response` DROP COLUMN `fastestTimeScore`,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `TriviaSpecial` DROP COLUMN `playersPerRoom`,
    DROP COLUMN `status`,
    ADD COLUMN `dueDate` DATETIME(3) NULL,
    ADD COLUMN `gameStatus` ENUM('upcoming', 'open', 'closed') NOT NULL DEFAULT 'upcoming',
    ADD COLUMN `numberOfPlayers` INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN `playTime` INTEGER NULL,
    ADD COLUMN `timePerQuestion` INTEGER NULL,
    MODIFY `category` ENUM('all', 'animals', 'food', 'games', 'general', 'geography', 'history', 'maths', 'movies', 'music', 'riddles', 'science', 'sports', 'technology') NOT NULL DEFAULT 'general',
    MODIFY `type` ENUM('challenge', 'room', 'tournament') NOT NULL DEFAULT 'challenge',
    MODIFY `avatar` VARCHAR(191) NOT NULL;
