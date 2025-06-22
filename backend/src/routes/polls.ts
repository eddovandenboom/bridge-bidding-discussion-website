import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from './auth';

const router = express.Router();
const prisma = new PrismaClient();

// Create a new poll
router.post('/boards/:boardId/polls', authenticateToken, async (req, res) => {
  try {
    const { boardId } = req.params;
    const { title, description, pollType, options, biddingTableId } = req.body;
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = req.user.userId;

    // Validate input
    if (!title || !options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: 'Title and at least 2 options are required' });
    }

    if (!['BIDDING', 'PLAY', 'GENERAL'].includes(pollType)) {
      return res.status(400).json({ error: 'Invalid poll type' });
    }

    // Verify board exists
    const board = await prisma.board.findUnique({ where: { id: boardId } });
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Verify bidding table exists if provided
    if (biddingTableId) {
      const biddingTable = await prisma.biddingTable.findUnique({ 
        where: { id: biddingTableId },
        include: { board: true }
      });
      if (!biddingTable) {
        return res.status(404).json({ error: 'Bidding table not found' });
      }
      if (biddingTable.boardId !== boardId) {
        return res.status(400).json({ error: 'Bidding table does not belong to this board' });
      }
    }

    // Create poll with options
    const poll = await prisma.poll.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        pollType,
        boardId,
        userId,
        biddingTableId: biddingTableId || null,
        options: {
          create: options.map((option: any, index: number) => ({
            text: option.text.trim(),
            description: option.description?.trim() || null
          }))
        }
      },
      include: {
        user: {
          select: { id: true, username: true, role: true }
        },
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
        }
      }
    });

    res.status(201).json({ poll });
  } catch (error) {
    console.error('Create poll error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all polls for a board
router.get('/boards/:boardId/polls', async (req, res) => {
  try {
    const { boardId } = req.params;

    // Verify board exists
    const board = await prisma.board.findUnique({ where: { id: boardId } });
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    const polls = await prisma.poll.findMany({
      where: { 
        boardId,
        isActive: true 
      },
      include: {
        user: {
          select: { id: true, username: true, role: true }
        },
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
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ polls });
  } catch (error) {
    console.error('Get polls error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Vote on a poll
router.post('/polls/:pollId/vote', authenticateToken, async (req, res) => {
  try {
    const { pollId } = req.params;
    const { optionId } = req.body;
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = req.user.userId;

    // Validate input
    if (!optionId) {
      return res.status(400).json({ error: 'Option ID is required' });
    }

    // Verify poll exists and is active
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: true
      }
    });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    if (!poll.isActive) {
      return res.status(400).json({ error: 'Poll is no longer active' });
    }

    // Verify option belongs to this poll
    const option = poll.options.find((opt: any) => opt.id === optionId);
    if (!option) {
      return res.status(400).json({ error: 'Invalid option for this poll' });
    }

    // Check if user already voted (update if they did)
    const existingVote = await prisma.pollVote.findUnique({
      where: {
        pollId_userId: {
          pollId,
          userId
        }
      }
    });

    if (existingVote) {
      // Update existing vote
      await prisma.pollVote.update({
        where: { id: existingVote.id },
        data: { pollOptionId: optionId }
      });
    } else {
      // Create new vote
      await prisma.pollVote.create({
        data: {
          pollId,
          pollOptionId: optionId,
          userId
        }
      });
    }

    // Return updated poll with vote counts
    const updatedPoll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        user: {
          select: { id: true, username: true, role: true }
        },
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
        }
      }
    });

    res.json({ poll: updatedPoll });
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get poll details
router.get('/polls/:pollId', async (req, res) => {
  try {
    const { pollId } = req.params;

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        user: {
          select: { id: true, username: true, role: true }
        },
        board: {
          select: { id: true, boardNumber: true }
        },
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
        }
      }
    });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    res.json({ poll });
  } catch (error) {
    console.error('Get poll error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Close/deactivate a poll (only creator or admin)
router.patch('/polls/:pollId/close', authenticateToken, async (req, res) => {
  try {
    const { pollId } = req.params;
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = req.user.userId;
    const userRole = req.user.role;

    const poll = await prisma.poll.findUnique({
      where: { id: pollId }
    });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    // Check if user is the creator or an admin
    if (poll.userId !== userId && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Only the poll creator or admin can close the poll' });
    }

    // Update poll to inactive
    const updatedPoll = await prisma.poll.update({
      where: { id: pollId },
      data: { isActive: false },
      include: {
        user: {
          select: { id: true, username: true, role: true }
        },
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
        }
      }
    });

    res.json({ poll: updatedPoll });
  } catch (error) {
    console.error('Close poll error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as pollsRouter };