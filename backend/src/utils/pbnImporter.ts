import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Define Seat type locally
type Seat = 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';

interface PBNBoard {
  boardNumber: number;
  dealer: Seat;
  vulnerability: string;
  deal: string;
}

interface PBNTournament {
  event: string;
  site: string;
  date: string;
  boards: PBNBoard[];
}

function parsePBNFile(filePath: string): PBNTournament {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').map(line => line.trim()).filter(line => line);
  
  let tournament: Partial<PBNTournament> = {
    boards: []
  };
  
  let currentBoard: Partial<PBNBoard> = {};
  
  for (const line of lines) {
    if (line.startsWith('[') && line.endsWith(']')) {
      const match = line.match(/\[(\w+)\s+"(.+)"\]/);
      if (match) {
        const [, key, value] = match;
        
        switch (key) {
          case 'Event':
            tournament.event = value;
            break;
          case 'Site':
            tournament.site = value;
            break;
          case 'Date':
            tournament.date = value;
            break;
          case 'Board':
            // Save previous board if exists
            if (currentBoard.boardNumber) {
              tournament.boards!.push(currentBoard as PBNBoard);
            }
            // Start new board
            currentBoard = {
              boardNumber: parseInt(value)
            };
            break;
          case 'Dealer':
            // Convert single letter to full name
            const dealerMap: { [key: string]: Seat } = {
              'N': 'NORTH',
              'S': 'SOUTH', 
              'E': 'EAST',
              'W': 'WEST'
            };
            currentBoard.dealer = dealerMap[value] || 'NORTH';
            break;
          case 'Vulnerable':
            // Convert PBN vulnerability notation to our format
            let vuln = value;
            if (vuln === '-') vuln = 'None';
            else if (vuln === 'NS') vuln = 'NS';
            else if (vuln === 'EW') vuln = 'EW';
            else if (vuln === 'All') vuln = 'Both';
            currentBoard.vulnerability = vuln;
            break;
          case 'Deal':
            currentBoard.deal = value;
            break;
        }
      }
    }
  }
  
  // Add the last board
  if (currentBoard.boardNumber) {
    tournament.boards!.push(currentBoard as PBNBoard);
  }
  
  return tournament as PBNTournament;
}

function parseDealString(dealString: string): {
  northHand: string;
  southHand: string;
  eastHand: string;
  westHand: string;
} {
  // Deal format: "N:NSSS.HHHS.DDDS.CCCS EEEE.HHHH.DDDD.CCCC ..."
  const parts = dealString.split(' ');
  const hands = parts[0].split(':')[1]; // Remove the "N:" prefix
  
  const [north, east, south, west] = [hands, ...parts.slice(1)];
  
  return {
    northHand: north,
    southHand: south,
    eastHand: east,
    westHand: west
  };
}

function convertDateFormat(pbnDate: string): Date {
  // Convert "2025.6.17" to proper date
  const parts = pbnDate.split('.');
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1; // JS months are 0-indexed
  const day = parseInt(parts[2]);
  
  return new Date(year, month, day);
}

export async function importPBNFile(filePath: string): Promise<void> {
  console.log(`Starting import of PBN file: ${filePath}`);
  
  try {
    const tournamentData = parsePBNFile(filePath);
    console.log(`Parsed tournament: ${tournamentData.event}`);
    console.log(`Found ${tournamentData.boards.length} boards`);
    
    // Create tournament
    const tournament = await prisma.tournament.create({
      data: {
        name: tournamentData.event,
        venue: tournamentData.site,
        date: convertDateFormat(tournamentData.date),
      }
    });
    
    console.log(`Created tournament with ID: ${tournament.id}`);
    
    // Create boards
    for (const boardData of tournamentData.boards) {
      const hands = parseDealString(boardData.deal);
      
      const board = await prisma.board.create({
        data: {
          tournamentId: tournament.id,
          boardNumber: boardData.boardNumber,
          dealer: boardData.dealer,
          vulnerability: boardData.vulnerability,
          northHand: hands.northHand,
          southHand: hands.southHand,
          eastHand: hands.eastHand,
          westHand: hands.westHand,
        }
      });
      
      console.log(`Created board ${board.boardNumber}`);
    }
    
    console.log('PBN import completed successfully!');
    
  } catch (error) {
    console.error('Error importing PBN file:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// CLI usage
if (require.main === module) {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: npx tsx src/utils/pbnImporter.ts <path-to-pbn-file>');
    process.exit(1);
  }
  
  importPBNFile(filePath)
    .then(() => {
      console.log('Import completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Import failed:', error);
      process.exit(1);
    });
}