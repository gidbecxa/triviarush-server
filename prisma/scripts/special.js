const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const specialTrivias = [
    {
      title: "Weekly Trivia Draw: Win Apple Gift Cards!",
      caption: "60 Seconds to Bliss!",
      description:
        "Step into the spotlight with the Weekly Trivia Draw, where your quick thinking and trivia prowess could land you amazing Apple gift cards! Play a fast-paced, thrilling 60-second trivia challenge and answer as many questions correctly as you can. Only the top 20 scores will advance to the exclusive draw, and from there, three lucky winners will emerge victorious. Don't miss out on this chance to shine and win big—show off your skills, climb the ranks, and secure your spot in the Weekly Trivia Draw now!",
      rewardId: 1,
      category: "all",
      type: "room",
      avatar: "https://sfduajkkrvxrmrryoblz.supabase.co/storage/v1/object/public/trivia-images/9607.jpg",
      gameStatus: "upcoming",
      numberOfPlayers: 20,
      timePerQuestion: 10,
    },
    {
      title: "Ultimate Trivia Showdown: Win 10 RushCoins!",
      caption: "Compete, Conquer, and Claim Your Coins!",
      description:
        "Get ready for the Ultimate Trivia Showdown, where the best of the best come to compete! Answer a set of challenging questions across various topics and rise to the top of the leaderboard. The stakes are high, and so are the rewards! Do you have the knowledge, speed, and strategy to outsmart your competitors? This is your moment to shine and win big. Tap now to enter the Ultimate Trivia Showdown and start your journey to victory!",
      rewardId: 2,
      category: "all",
      type: "challenge",
      avatar: "https://sfduajkkrvxrmrryoblz.supabase.co/storage/v1/object/public/trivia-images/WinRushCoins.jpg",
      gameStatus: "open",
      numberOfPlayers: 1,
      playTime: 100,
      timePerQuestion: 10,
    },
    {
      title: "Trivia Chase Challenge: Go Star In 120 Seconds!",
      caption: "Race Against Time for 100 Trivia Stars!",
      description:
        "Are you ready to put your trivia skills to the ultimate test? Welcome to the Trivia Chase Challenge, where only the quickest and smartest can prevail! Answer 20 trivia questions correctly within 120 seconds to claim your victory and earn a whopping 100 Trivia Stars! Do you have what it takes to beat the clock and conquer the Trivia Chase? Tap now and let the challenge begin!",
      rewardId: 3,
      category: "all",
      type: "challenge",
      avatar: "https://sfduajkkrvxrmrryoblz.supabase.co/storage/v1/object/public/trivia-images/timer-animation.jpeg",
      gameStatus: "open",
      numberOfPlayers: 1,
      playTime: 120,
      timePerQuestion: 6,
    },
  ];

  for (const trivia of specialTrivias) {
    await prisma.triviaSpecial.create({
      data: trivia,
    });
  }

  console.log('Special trivia data has been successfully populated.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
