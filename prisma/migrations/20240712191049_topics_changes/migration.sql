/*
  Warnings:

  - You are about to drop the `Topic` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `Topic`;

-- CreateTable
CREATE TABLE `TriviaTopic` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `slug` ENUM('animals', 'food', 'games', 'general', 'geography', 'history', 'maths', 'movies', 'music', 'riddles', 'science', 'sports', 'technology') NOT NULL,

    UNIQUE INDEX `TriviaTopic_title_key`(`title`),
    UNIQUE INDEX `TriviaTopic_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
