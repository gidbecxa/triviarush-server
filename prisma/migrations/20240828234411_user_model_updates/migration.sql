/*
  Warnings:

  - You are about to alter the column `level` on the `Question` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(4))` to `Enum(EnumId(8))`.
  - You are about to drop the column `points` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `token` on the `User` table. All the data in the column will be lost.
  - You are about to alter the column `skillLevel` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(8))` to `Enum(EnumId(8))`.

*/
-- AlterTable
ALTER TABLE `Question` MODIFY `level` ENUM('trivia_rookie', 'trivia_ace', 'trivia_expert', 'trivia_guru', 'mastermind', 'grand_trivia_maestro') NOT NULL DEFAULT 'trivia_rookie';

-- AlterTable
ALTER TABLE `TriviaSpecial` ADD COLUMN `shortDescription` TEXT NULL;

-- AlterTable
ALTER TABLE `User` DROP COLUMN `points`,
    DROP COLUMN `token`,
    ADD COLUMN `coins` DOUBLE NOT NULL DEFAULT 10,
    ADD COLUMN `gamesPlayed` INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN `numberOfWins` INTEGER NULL,
    ADD COLUMN `score` INTEGER NOT NULL DEFAULT 1,
    MODIFY `skillLevel` ENUM('trivia_rookie', 'trivia_ace', 'trivia_expert', 'trivia_guru', 'mastermind', 'grand_trivia_maestro') NOT NULL DEFAULT 'trivia_rookie';
