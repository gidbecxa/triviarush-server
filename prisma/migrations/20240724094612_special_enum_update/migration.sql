/*
  Warnings:

  - You are about to alter the column `type` on the `TriviaSpecial` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(7))` to `Enum(EnumId(5))`.

*/
-- AlterTable
ALTER TABLE `TriviaSpecial` MODIFY `type` ENUM('DailyChallenge', 'RaceAgainstTimeChallenge', 'FastestTimeChallenge', 'AllTopicsChallenge') NOT NULL DEFAULT 'DailyChallenge';
