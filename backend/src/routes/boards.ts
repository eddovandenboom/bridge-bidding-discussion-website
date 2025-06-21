import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from './auth';

const router = express.Router();
const prisma = new PrismaClient();

// Search tournaments and boards with filters
router.get('/search', async (req, res) => {
  try {
    const {
      searchTerm,
      labels: labelIds,
      vulnerability,
      dealer,
      boardNumberFrom,
      boardNumberTo,
      dateFrom,
      dateTo
    } = req.query;

    // Build filters for boards
    const boardFilters: any = {};
    
    if (vulnerability) {
      boardFilters.vulnerability = vulnerability;
    }
    
    if (dealer) {
      boardFilters.dealer = dealer;
    }
    
    if (boardNumberFrom || boardNumberTo) {
      boardFilters.boardNumber = {};
      if (boardNumberFrom) boardFilters.boardNumber.gte = parseInt(boardNumberFrom as string);
      if (boardNumberTo) boardFilters.boardNumber.lte = parseInt(boardNumberTo as string);
    }

    // Build filters for tournaments
    const tournamentFilters: any = {};
    
    if (dateFrom || dateTo) {
      tournamentFilters.date = {};
      if (dateFrom) tournamentFilters.date.gte = new Date(dateFrom as string);
      if (dateTo) tournamentFilters.date.lte = new Date(dateTo as string);
    }

    if (searchTerm) {
      tournamentFilters.OR = [
        { name: { contains: searchTerm as string, mode: 'insensitive' } },
        { venue: { contains: searchTerm as string, mode: 'insensitive' } }
      ];
    }

    // Build label filter
    if (labelIds && Array.isArray(labelIds) && labelIds.length > 0) {
      boardFilters.labels = {
        some: {
          labelId: {
            in: labelIds as string[]
          }
        }
      };
    } else if (labelIds && typeof labelIds === 'string') {
      boardFilters.labels = {
        some: {
          labelId: labelIds
        }
      };
    }

    const tournaments = await prisma.tournament.findMany({
      where: tournamentFilters,
      include: {
        boards: {
          where: boardFilters,
          orderBy: { boardNumber: 'asc' },
          include: {
            labels: {
              include: {
                label: true
              }
            },
            _count: {
              select: {
                comments: true,
                polls: true
              }
            }
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    // Filter out tournaments with no matching boards if board filters were applied
    const filteredTournaments = tournaments.filter(tournament => 
      tournament.boards.length > 0 || Object.keys(boardFilters).length === 0
    );

    res.json({ tournaments: filteredTournaments });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search tournaments and boards' });
  }
});

// Get all tournaments with their boards
router.get('/tournaments', async (req, res) => {
  try {
    const tournaments = await prisma.tournament.findMany({
      include: {
        boards: {
          orderBy: { boardNumber: 'asc' },
          include: {
            labels: {
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

// Get specific tournament with all boards
router.get('/tournaments/:tournamentId', async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        boards: {
          orderBy: { boardNumber: 'asc' },
          include: {
            labels: {
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
    console.error('Get tournament error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific board with full details
router.get('/boards/:boardId', async (req, res) => {
  try {
    const { boardId } = req.params;

    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        tournament: {
          select: { id: true, name: true, date: true, venue: true }
        },
        comments: {
          include: {
            user: {
              select: { id: true, username: true, role: true }
            },
            replies: {
              include: {
                user: {
                  select: { id: true, username: true, role: true }
                }
              }
            }
          },
          where: { parentId: null }, // Only top-level comments
          orderBy: { createdAt: 'desc' }
        },
        biddingTables: {
          include: {
            bids: {
              orderBy: { position: 'asc' }
            }
          }
        },
        playSequences: {
          include: {
            plays: {
              orderBy: [{ trick: 'asc' }, { position: 'asc' }]
            }
          }
        },
        polls: {
          include: {
            options: {
              include: {
                votes: {
                  include: {
                    user: {
                      select: { id: true, username: true }
                    }
                  }
                }
              }
            },
            user: {
              select: { id: true, username: true }
            }
          },
          where: { isActive: true }
        },
        labels: {
          include: {
            label: true,
            user: {
              select: { id: true, username: true }
            }
          }
        }
      }
    });

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    res.json({ board });
  } catch (error) {
    console.error('Get board error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add comment to board
router.post('/boards/:boardId/comments', authenticateToken, async (req, res) => {
  try {
    const { boardId } = req.params;
    const { content, parentId } = req.body;
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = req.user.userId;

    // Validate input
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    // Verify board exists
    const board = await prisma.board.findUnique({ where: { id: boardId } });
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // If replying to a comment, verify parent exists
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({ where: { id: parentId } });
      if (!parentComment || parentComment.boardId !== boardId) {
        return res.status(400).json({ error: 'Invalid parent comment' });
      }
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        boardId,
        userId,
        parentId: parentId || null
      },
      include: {
        user: {
          select: { id: true, username: true, role: true }
        }
      }
    });

    res.status(201).json({ comment });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recent boards across all tournaments
router.get('/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const recentBoards = await prisma.board.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        tournament: {
          select: { id: true, name: true, date: true }
        },
        comments: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { username: true }
            }
          }
        },
        labels: {
          include: {
            label: true
          }
        }
      }
    });

    res.json({ boards: recentBoards });
  } catch (error) {
    console.error('Get recent boards error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as boardsRouter };