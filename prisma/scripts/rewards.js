const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rewards = [
    {
      title: 'Apple gift card',
      avatar: 'https://sfduajkkrvxrmrryoblz.supabase.co/storage/v1/object/public/trivia-images/Apple-gift-card-icon.jpg',
      quantity: 1,
    },
    {
      title: 'RushCoins',
      avatar: 'https://sfduajkkrvxrmrryoblz.supabase.co/storage/v1/object/public/trivia-images/RushCoins.jpeg',
      quantity: 25,
    },
    {
      title: 'Trivia Stars',
      avatar: 'https://sfduajkkrvxrmrryoblz.supabase.co/storage/v1/object/public/trivia-images/292699832_e865e597-4c6f-4b68-8fa5-8a10808559b5.jpg',
      quantity: 25,
    },
  ];

  for (const reward of rewards) {
    await prisma.triviaReward.create({
      data: reward,
    });
  }

  console.log('Rewards have been successfully populated.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
