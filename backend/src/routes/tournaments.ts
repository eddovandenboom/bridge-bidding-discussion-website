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

// Upload and import PBN file (Admin only)
router.post('/import-pbn', authenticateToken, requireAdmin, upload.single('pbnFile'), async (req, res) => {
  console.log('Received PBN import request');
  try {
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ error: 'No PBN file uploaded' });
    }

    console.log(`Admin ${req.user?.username} uploading PBN file: ${req.file.originalname}`);

    // Read the uploaded file
    const fileContent = fs.readFileSync(req.file.path, 'utf-8');
    console.log('--- PBN File Content ---');
    console.log(fileContent);
    console.log('------------------------');
    
    // Parse the PBN content
    const tournamentData = parsePBNContent(fileContent);
    console.log('--- Parsed Tournament Data ---');
    console.log(JSON.stringify(tournamentData, null, 2));
    console.log('----------------------------');
    
    if (!tournamentData.event || !tournamentData.boards || tournamentData.boards.length === 0) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Invalid PBN file: missing event name or boards' });
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
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
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
        isProcessed: true
      }
    });
    
    console.log(`Created tournament with ID: ${tournament.id}`);
    
    // Create boards
    const createdBoards = [];
    for (const boardData of tournamentData.boards) {
      try {
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
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    
    console.log('PBN import completed successfully!');
    
    res.status(201).json({
      message: 'PBN file imported successfully',
      tournament: {
        id: tournament.id,
        name: tournament.name,
        venue: tournament.venue,
        date: tournament.date,
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
      include: {
        boards: {
          orderBy: { boardNumber: 'asc' },
          include: {
            labelStatuses: {
              include: {
                label: true
              }
            }
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

export default router;