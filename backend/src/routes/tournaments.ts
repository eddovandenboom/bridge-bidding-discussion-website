import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from './auth';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const uploadDir = path.join('/tmp', 'bridge-uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  fileFilter: (req, file, cb) => {
    // Only accept .pbn files
    if (file.originalname.toLowerCase().endsWith('.pbn')) {
      cb(null, true);
    } else {
      cb(new Error('Only PBN files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Admin middleware
const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
};

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

function parsePBNContent(content: string): PBNTournament {
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
  if (!dealString || !dealString.includes(':')) {
    throw new Error(`Invalid deal string: ${dealString}`);
  }
  
  const [firstSeatChar, dealData] = dealString.split(':', 2);
  const allHands = dealData.split(' ');

  if (allHands.length < 4) {
    throw new Error(`Invalid number of hands in deal string: ${dealString}`);
  }

  const handMap: { [key: string]: string } = {};
  const seatOrder: Seat[] = ['NORTH', 'EAST', 'SOUTH', 'WEST'];
  
  let firstSeatIndex = -1;
  switch (firstSeatChar) {
    case 'N': firstSeatIndex = 0; break;
    case 'E': firstSeatIndex = 1; break;
    case 'S': firstSeatIndex = 2; break;
    case 'W': firstSeatIndex = 3; break;
    default: throw new Error(`Invalid starting seat in deal string: ${firstSeatChar}`);
  }

  for (let i = 0; i < 4; i++) {
    const currentSeat = seatOrder[(firstSeatIndex + i) % 4];
    handMap[currentSeat] = allHands[i];
  }

  return {
    northHand: handMap['NORTH'] || '',
    southHand: handMap['SOUTH'] || '',
    eastHand: handMap['EAST'] || '',
    westHand: handMap['WEST'] || ''
  };
}

function convertDateFormat(pbnDate: string): Date {
  if (!pbnDate) {
    throw new Error('PBN date is missing');
  }
  // Replace dots with dashes for consistency and handle different formats
  const formattedDate = pbnDate.replace(/\./g, '-');
  const parts = formattedDate.split('-');
  
  if (parts.length !== 3) {
    throw new Error(`Invalid date format: ${pbnDate}`);
  }

  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1; // JS months are 0-indexed
  const day = parseInt(parts[2]);

  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    throw new Error(`Invalid date components in: ${pbnDate}`);
  }
  
  const date = new Date(Date.UTC(year, month, day));
  if (isNaN(date.getTime())) {
      throw new Error(`Could not create a valid date from: ${pbnDate}`);
  }
  return date;
}

// Upload and import PBN file (Admin only)
router.post('/import-pbn', authenticateToken, requireAdmin, upload.single('pbnFile'), async (req, res) => {
  console.log('Received PBN import request');
  try {
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ error: 'No PBN file uploaded' });
    }

    console.log(`Admin ${req.user?.username} uploading PBN file: ${req.file.originalname}`);

    // Define a public path for the PBN file within the backend's public directory
    // Go up three levels from /dist/src/routes to the project root /app
    const publicDir = path.join(__dirname, '../../../public/tournaments');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    const pbnFileName = `${Date.now()}-${req.file.originalname}`;
    const pbnFilePath = path.join(publicDir, pbnFileName);
    // The URL should be relative to the backend's public serving path
    const pbnFileUrl = `/tournaments/${pbnFileName}`;

    // Move the file from temp to public.
    // fs.renameSync can cause EXDEV errors in Docker when /tmp and the app directory are on different devices.
    // A safer way is to copy the file and then delete the source.
    fs.copyFileSync(req.file.path, pbnFilePath);
    fs.unlinkSync(req.file.path);
    console.log(`PBN file saved to: ${pbnFilePath}`);

    // Read the PBN file content
    const fileContent = fs.readFileSync(pbnFilePath, 'utf-8');
    
    // Parse the PBN content
    const tournamentData = parsePBNContent(fileContent);
    
    if (!tournamentData.event || !tournamentData.date || !tournamentData.boards || tournamentData.boards.length === 0) {
      fs.unlinkSync(pbnFilePath); // Clean up saved file
      return res.status(400).json({ error: 'Invalid PBN file: missing event name, date, or boards' });
    }

    console.log(`Parsed tournament: ${tournamentData.event}`);
    console.log(`Found ${tournamentData.boards.length} boards`);
    
    // Check if tournament with same name and date already exists
    const existingTournament = await prisma.tournament.findFirst({
      where: {
        name: tournamentData.event,
        date: convertDateFormat(tournamentData.date)
      }
    });

    if (existingTournament) {
      fs.unlinkSync(pbnFilePath); // Clean up saved file
      return res.status(409).json({
        error: 'Tournament with this name and date already exists',
        existingTournament: {
          id: existingTournament.id,
          name: existingTournament.name,
          date: existingTournament.date
        }
      });
    }
    
    // Create tournament
    const tournament = await prisma.tournament.create({
      data: {
        name: tournamentData.event,
        venue: tournamentData.site || 'Unknown Venue',
        date: convertDateFormat(tournamentData.date),
        source: 'PBN Upload',
        isProcessed: true,
        pbnFileUrl: pbnFileUrl
      }
    });
    
    console.log(`Created tournament with ID: ${tournament.id}`);
    
    // Create boards
    const createdBoards = [];
    for (const boardData of tournamentData.boards) {
      try {
        if (!boardData.deal || !boardData.dealer || !boardData.vulnerability) {
          console.error(`Skipping board ${boardData.boardNumber} due to incomplete data in PBN file.`);
          continue;
        }
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
        
        createdBoards.push(board);
        console.log(`Created board ${board.boardNumber}`);
      } catch (boardError) {
        console.error(`Error creating board ${boardData.boardNumber}:`, boardError);
        // Continue with other boards
      }
    }
    
    console.log('PBN import completed successfully!');
    
    res.status(201).json({
      message: 'PBN file imported successfully',
      tournament: {
        id: tournament.id,
        name: tournament.name,
        venue: tournament.venue,
        date: tournament.date,
        pbnFileUrl: tournament.pbnFileUrl,
        boardsCreated: createdBoards.length,
        totalBoards: tournamentData.boards.length
      }
    });
    
  } catch (error) {
    console.error('--- PBN Import Error ---');
    console.error('Error object:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    console.error('------------------------');
    
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    if (error instanceof Error && error.message === 'Only PBN files are allowed') {
      return res.status(400).json({ error: 'Only PBN files are allowed' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all tournaments
router.get('/', async (req, res) => {
  try {
    const tournaments = await prisma.tournament.findMany({
      select: {
        id: true,
        name: true,
        date: true,
        venue: true,
        boards: {
          select: {
            id: true
          },
          orderBy: {
            boardNumber: 'asc'
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    res.json({ tournaments });
  } catch (error) {
    console.error('Get tournaments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get tournament statistics (Admin only) - MUST come before /:tournamentId
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('Fetching tournament stats...');

    console.log('Aggregating tournament count...');
    const stats = await prisma.tournament.aggregate({
      _count: { _all: true },
    });
    console.log('Tournament count aggregated.');

    console.log('Aggregating board count...');
    const boardStats = await prisma.board.aggregate({
      _count: { _all: true },
    });
    console.log('Board count aggregated.');

    console.log('Fetching recent tournaments...');
    const recentTournaments = await prisma.tournament.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        date: true,
        venue: true,
        source: true,
        _count: {
          select: { boards: true }
        }
      }
    });
    console.log('Recent tournaments fetched.');

    res.json({
      totalTournaments: stats._count._all,
      totalBoards: boardStats._count._all,
      recentTournaments
    });
  } catch (error) {
    console.error('Error fetching tournament stats:', error);
    res.status(500).json({
      error: 'Failed to fetch tournament statistics',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Get a single tournament by ID
router.get('/:tournamentId', async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        boards: {
          orderBy: {
            boardNumber: 'asc'
          },
          include: {
            labelStatuses: {
              include: {
                label: true
              }
            }
          }
        }
      }
    });

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    res.json({ tournament });
  } catch (error) {
    console.error(`Error fetching tournament ${req.params.tournamentId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete tournament (Admin only)
router.delete('/:tournamentId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { tournamentId } = req.params;

    // Check if tournament exists
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        _count: {
          select: { boards: true }
        }
      }
    });

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    console.log(`Admin ${req.user?.username} deleting tournament: ${tournament.name}`);

    // Delete tournament (cascade will delete boards)
    await prisma.tournament.delete({
      where: { id: tournamentId }
    });

    res.json({
      message: 'Tournament deleted successfully',
      deleted: {
        name: tournament.name,
        boardsDeleted: tournament._count.boards
      }
    });
  } catch (error) {
    console.error('Error deleting tournament:', error);
    res.status(500).json({ error: 'Failed to delete tournament' });
  }
});

// Get a tournament as a PBN file
router.get('/:tournamentId/pbn', async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        boards: {
          orderBy: {
            boardNumber: 'asc',
          },
        },
      },
    });

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    let pbnContent = '';
    pbnContent += `[Event "${tournament.name}"]\n`;
    pbnContent += `[Site "${tournament.venue}"]\n`;
    pbnContent += `[Date "${tournament.date.toISOString().slice(0, 10).replace(/-/g, '.')}"]\n\n`;

    for (const board of tournament.boards) {
      pbnContent += `[Board "${board.boardNumber}"]\n`;
      pbnContent += `[Dealer "${board.dealer.charAt(0)}"]\n`;
      pbnContent += `[Vulnerable "${board.vulnerability}"]\n`;
      const deal = `N:${board.northHand} ${board.eastHand} ${board.southHand} ${board.westHand}`;
      pbnContent += `[Deal "${deal}"]\n\n`;
    }

    res.header('Content-Type', 'application/x-pbn');
    res.send(pbnContent);
  } catch (error) {
    console.error('Error generating PBN file:', error);
    res.status(500).json({ error: 'Failed to generate PBN file' });
  }
});

export default router;