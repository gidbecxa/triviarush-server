const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const topics = [
    {
      title: '🐶 Animals & Wildlife',
      slug: 'animals',
      description:
        'Quiz about animals, their habitats, behaviors, and species.',
    },
    {
      title: '🍕 Food & Cuisine',
      slug: 'food',
      description:
        'Test your knowledge on cuisine, ingredients, and culinary traditions.',
    },
    {
      title: '🎮 Video Games & Board Games',
      slug: 'games',
      description: 'Trivia about video games, board games, and game history.',
    },
    {
      title: '🔄 Trivia & General Knowledge',
      slug: 'general',
      description:
        'A thrilling mix of random questions from various categories.',
    },
    {
      title: '🌍 Geography & Landmarks',
      slug: 'geography',
      description:
        'Questions about countries, cities, landmarks, and geographical features.',
    },
    {
      title: '📜 History & Historical Figures',
      slug: 'history',
      description:
        'Test your knowledge on historical events, figures, and periods.',
    },
    {
      title: '➗ Maths & Arithmetic',
      slug: 'maths',
      description:
        'Math problems and questions from arithmetic to mind-blowing maths.',
    },
    {
      title: '🎬 Movies & Cinematic History',
      slug: 'movies',
      description:
        'Trivia about films, directors, actors, and cinematic history.',
    },
    {
      title: '🎵 Music & Artists',
      slug: 'music',
      description:
        'Catch fun through questions about songs, artists, genres, and musical history.',
    },
    {
      title: '🧩 Riddles & Brain Teasers',
      slug: 'riddles',
      description: 'Challenging riddles and brainteasers to test your wit.',
    },
    {
      title: '🔬 Science & Innovation',
      slug: 'science',
      description:
        'Questions on biology, chemistry, physics, and other scientific fields.',
    },
    {
      title: '⚽ Sports & Athletes',
      slug: 'sports',
      description:
        'Test your knowledge on sports, athletes, and sporting events.',
    },
    {
      title: '💻 Technology & Gadgets',
      slug: 'technology',
      description:
        'Questions about tech innovations, gadgets, and the tech industry.',
    },
  ];

  for (const topic of topics) {
    await prisma.triviaTopic.create({
      data: topic,
    });
  }

  console.log('Trivia topics have been successfully populated.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
