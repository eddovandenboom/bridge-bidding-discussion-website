import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearTournaments() {
  console.log('Starting to clear all tournaments...');

  try {
    // The schema is set to cascade deletes, so deleting a tournament
    // will also delete its associated boards, comments, polls, etc.
    const deleteResult = await prisma.tournament.deleteMany({});
    
    console.log(`Successfully deleted ${deleteResult.count} tournaments.`);
    
  } catch (error) {
    console.error('Error clearing tournaments:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearTournaments()
  .then(() => {
    console.log('Tournament clearing process finished.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('An unexpected error occurred:', error);
    process.exit(1);
  });