import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, authenticateTokenOptional } from './auth';

const router = express.Router();
const prisma = new PrismaClient();

// Configuration for global label thresholds
const GLOBAL_CONFIG = {
  minVotes: 3,        // minimum total votes needed for global consideration
  threshold: 0.5      // 50% must vote YES for global status
};

// Helper function to calculate if a label is globally applied
function isGloballyApplied(voteCount: number): boolean {
  return voteCount >= GLOBAL_CONFIG.minVotes;
}

// Helper function to update board label status
async function updateBoardLabelStatus(boardId: string, labelId: string) {
  const voteCount = await prisma.boardLabelVote.count({
    where: {
      boardId,
      labelId,
    },
  });

  const isGlobal = isGloballyApplied(voteCount);

  await prisma.boardLabelStatus.upsert({
    where: {
      boardId_labelId: {
        boardId,
        labelId,
      },
    },
    update: {
      voteCount,
      isGlobal,
    },
    create: {
      boardId,
      labelId,
      voteCount,
      isGlobal,
    },
  });
}

// Get all labels with usage statistics
router.get('/', async (req, res) => {
  try {
    const labels = await prisma.label.findMany({
      include: {
        _count: {
          select: { 
            boardLabelVotes: true,
            boardLabelStatuses: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ labels });
  } catch (error) {
    console.error('Error fetching labels:', error);
    res.status(500).json({ error: 'Failed to fetch labels' });
  }
});

// Create a new label
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, color, description } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Label name is required' });
    }

    const existingLabel = await prisma.label.findUnique({
      where: { name: name.trim() }
    });

    if (existingLabel) {
      return res.status(409).json({ error: 'Label with this name already exists' });
    }

    const label = await prisma.label.create({
      data: {
        name: name.trim(),
        color: color || '#3B82F6',
        description: description?.trim() || null
      }
    });

    res.status(201).json({ label });
  } catch (error) {
    console.error('Error creating label:', error);
    res.status(500).json({ error: 'Failed to create label' });
  }
});

// Update a label
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color, description } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Label name is required' });
    }

    // Check if another label with the same name exists
    const existingLabel = await prisma.label.findFirst({
      where: { 
        name: name.trim(),
        NOT: { id }
      }
    });

    if (existingLabel) {
      return res.status(409).json({ error: 'Label with this name already exists' });
    }

    const label = await prisma.label.update({
      where: { id },
      data: {
        name: name.trim(),
        color: color || '#3B82F6',
        description: description?.trim() || null
      }
    });

    res.json({ label });
  } catch (error) {
    console.error('Error updating label:', error);
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2025') {
      return res.status(404).json({ error: 'Label not found' });
    }
    res.status(500).json({ error: 'Failed to update label' });
  }
});

// Delete a label
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.label.delete({
      where: { id }
    });

    res.json({ message: 'Label deleted successfully' });
  } catch (error) {
    console.error('Error deleting label:', error);
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2025') {
      return res.status(404).json({ error: 'Label not found' });
    }
    res.status(500).json({ error: 'Failed to delete label' });
  }
});

// Vote on whether a label applies to a board (toggle)
router.post('/boards/:boardId/labels/:labelId/vote', authenticateToken, async (req, res) => {
  try {
    const { boardId, labelId } = req.params;
    
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = req.user.userId;

    const board = await prisma.board.findUnique({ where: { id: boardId } });
    if (!board) return res.status(404).json({ error: 'Board not found' });

    const label = await prisma.label.findUnique({ where: { id: labelId } });
    if (!label) return res.status(404).json({ error: 'Label not found' });

    const existingVote = await prisma.boardLabelVote.findUnique({
      where: {
        boardId_labelId_userId: {
          boardId,
          labelId,
          userId,
        },
      },
    });

    let vote;
    let userVoted;

    if (existingVote) {
      // Unvote
      await prisma.boardLabelVote.delete({
        where: {
          id: existingVote.id,
        },
      });
      vote = null;
      userVoted = false;
    } else {
      // Vote
      vote = await prisma.boardLabelVote.create({
        data: {
          boardId,
          labelId,
          userId,
        },
      });
      userVoted = true;
    }

    await updateBoardLabelStatus(boardId, labelId);

    const status = await prisma.boardLabelStatus.findUnique({
      where: {
        boardId_labelId: {
          boardId,
          labelId,
        },
      },
    });

    res.json({ vote, status, userVoted });
  } catch (error) {
    console.error('Error voting on label:', error);
    res.status(500).json({ error: 'Failed to vote on label' });
  }
});

// Remove vote on a label for a board
router.delete('/boards/:boardId/labels/:labelId/vote', authenticateToken, async (req, res) => {
  try {
    const { boardId, labelId } = req.params;
    
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = req.user.userId;

    // Check if vote exists
    const existingVote = await prisma.boardLabelVote.findUnique({
      where: {
        boardId_labelId_userId: {
          boardId,
          labelId,
          userId
        }
      }
    });

    if (!existingVote) {
      return res.status(404).json({ error: 'Vote not found' });
    }

    // Delete the vote
    await prisma.boardLabelVote.delete({
      where: {
        boardId_labelId_userId: {
          boardId,
          labelId,
          userId
        }
      }
    });

    // Update the computed status
    await updateBoardLabelStatus(boardId, labelId);

    res.json({ message: 'Vote removed successfully' });
  } catch (error) {
    console.error('Error removing vote:', error);
    res.status(500).json({ error: 'Failed to remove vote' });
  }
});

// Get all label voting status for a board
router.get('/boards/:boardId/status', authenticateTokenOptional, async (req, res) => {
  try {
    const { boardId } = req.params;
    const userId = req.user?.userId; // Optional - for showing user's vote

    // Get all labels
    const labels = await prisma.label.findMany({
      orderBy: { name: 'asc' }
    });

    // Get voting status for each label
    const labelStatuses = await Promise.all(
      labels.map(async (label) => {
        // Get user's vote if authenticated
        let userVoted = false;
        if (userId) {
          const vote = await prisma.boardLabelVote.findUnique({
            where: {
              boardId_labelId_userId: {
                boardId,
                labelId: label.id,
                userId,
              },
            },
          });
          userVoted = !!vote;
        }

        // Get computed status
        const status = await prisma.boardLabelStatus.findUnique({
          where: {
            boardId_labelId: {
              boardId,
              labelId: label.id
            }
          }
        });

        return {
          id: label.id,
          name: label.name,
          color: label.color,
          description: label.description,
          userVoted,
          voteCount: status?.voteCount || 0,
          isGloballyApplied: status?.isGlobal || false,
        };
      })
    );

    res.json({ labels: labelStatuses });
  } catch (error) {
    console.error('Error fetching board label status:', error);
    res.status(500).json({ error: 'Failed to fetch board label status' });
  }
});

// Legacy endpoint: Get labels for a specific board (backwards compatibility)
// Define the expected shape of the API response
interface LabelStatus {
  id: string;
  name: string;
  color: string;
  isGloballyApplied: boolean;
}

interface StatusResponse {
  labels: LabelStatus[];
}

router.get('/boards/:boardId', async (req, res) => {
  try {
    // Redirect to the new status endpoint
    const response = await fetch(`${req.protocol}://${req.get('host')}/api/labels/boards/${req.params.boardId}/status`);
    const data = await response.json() as StatusResponse;
    
    // Transform to old format for compatibility
    const boardLabels = data.labels
      .filter((label) => label.isGloballyApplied)
      .map((label) => ({
        id: `${req.params.boardId}-${label.id}`,
        label: {
          id: label.id,
          name: label.name,
          color: label.color
        }
      }));

    res.json({ boardLabels });
  } catch (error) {
    console.error('Error fetching board labels:', error);
    res.status(500).json({ error: 'Failed to fetch board labels' });
  }
});

export default router;