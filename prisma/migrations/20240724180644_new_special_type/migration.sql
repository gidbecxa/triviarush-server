-- AlterTable
ALTER TABLE `TriviaSpecial` MODIFY `type` ENUM('DailyChallenge', 'RaceAgainstTimeChallenge', 'WinRushCoinsTrivia', 'FastestTimeChallenge', 'AllTopicsChallenge') NOT NULL DEFAULT 'DailyChallenge';
