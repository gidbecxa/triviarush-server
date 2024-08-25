-- AlterTable
ALTER TABLE `TriviaSpecial` MODIFY `type` ENUM('DailyChallenge', 'RaceAgainstTimeChallenge', 'WinRushCoinsTrivia', 'FastestTimeChallenge', 'AllTopicsChallenge', 'WeeklyTriviaDraw') NOT NULL DEFAULT 'DailyChallenge';
