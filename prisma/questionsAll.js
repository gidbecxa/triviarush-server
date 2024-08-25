const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const questions = [
    {
      text: 'What is the capital of France?',
      options: JSON.stringify(['Paris', 'London', 'Berlin', 'Madrid']),
      answer: 'Paris',
      level: 'rookie',
      category: 'all',
    },
    {
      text: 'Which planet is known as the Red Planet?',
      options: JSON.stringify(['Earth', 'Mars', 'Jupiter', 'Saturn']),
      answer: 'Mars',
      level: 'rookie',
      category: 'all',
    },
    {
      text: 'Who wrote "Romeo and Juliet"?',
      options: JSON.stringify(['William Shakespeare', 'Charles Dickens', 'Jane Austen', 'Mark Twain']),
      answer: 'William Shakespeare',
      level: 'rookie',
      category: 'all',
    },
    {
      text: 'What is the largest ocean on Earth?',
      options: JSON.stringify(['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean']),
      answer: 'Pacific Ocean',
      level: 'rookie',
      category: 'all',
    },
    {
      text: 'How many continents are there on Earth?',
      options: JSON.stringify(['5', '6', '7', '8']),
      answer: '7',
      level: 'rookie',
      category: 'all',
    },
    {
      text: 'Which element has the chemical symbol O?',
      options: JSON.stringify(['Oxygen', 'Gold', 'Silver', 'Iron']),
      answer: 'Oxygen',
      level: 'rookie',
      category: 'all',
    },
    {
      text: 'In which year did World War II end?',
      options: JSON.stringify(['1942', '1945', '1948', '1950']),
      answer: '1945',
      level: 'rookie',
      category: 'all',
    },
    {
      text: 'What is the freezing point of water in degrees Celsius?',
      options: JSON.stringify(['0', '32', '100', '212']),
      answer: '0',
      level: 'rookie',
      category: 'all',
    },
    {
      text: 'Which gas do plants absorb from the atmosphere?',
      options: JSON.stringify(['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Helium']),
      answer: 'Carbon Dioxide',
      level: 'rookie',
      category: 'all',
    },
    {
      text: 'What is the tallest mountain in the world?',
      options: JSON.stringify(['K2', 'Mount Everest', 'Kangchenjunga', 'Lhotse']),
      answer: 'Mount Everest',
      level: 'rookie',
      category: 'all',
    },
  ];

  for (const question of questions) {
    await prisma.question.create({
      data: question,
    });
  }

  console.log('Questions have been successfully populated.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
