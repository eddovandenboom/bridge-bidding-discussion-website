import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from './auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get all labels
router.get('/', async (req, res) => {
  try {
    const labels = await prisma.label.findMany({
      include: {
        _count: {
          select: { boardLabels: true }
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
    if (error.code === 'P2025') {
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
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Label not found' });
    }
    res.status(500).json({ error: 'Failed to delete label' });
  }
});

// Apply label to board
router.post('/boards/:boardId', authenticateToken, async (req, res) => {
  try {
    const { boardId } = req.params;
    const { labelId } = req.body;
    const userId = req.user.userId;

    if (!labelId) {
      return res.status(400).json({ error: 'Label ID is required' });
    }

    // Check if board exists
    const board = await prisma.board.findUnique({
      where: { id: boardId }
    });

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Check if label exists
    const label = await prisma.label.findUnique({
      where: { id: labelId }
    });

    if (!label) {
      return res.status(404).json({ error: 'Label not found' });
    }

    // Check if label is already applied
    const existingBoardLabel = await prisma.boardLabel.findUnique({
      where: {
        boardId_labelId: {
          boardId,
          labelId
        }
      }
    });

    if (existingBoardLabel) {
      return res.status(409).json({ error: 'Label already applied to this board' });
    }

    // Apply the label
    const boardLabel = await prisma.boardLabel.create({
      data: {
        boardId,
        labelId,
        userId
      },
      include: {
        label: true,
        user: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    res.status(201).json({ boardLabel });
  } catch (error) {
    console.error('Error applying label to board:', error);
    res.status(500).json({ error: 'Failed to apply label to board' });
  }
});

// Remove label from board
router.delete('/boards/:boardId/:labelId', authenticateToken, async (req, res) => {
  try {
    const { boardId, labelId } = req.params;

    const boardLabel = await prisma.boardLabel.findUnique({
      where: {
        boardId_labelId: {
          boardId,
          labelId
        }
      }
    });

    if (!boardLabel) {
      return res.status(404).json({ error: 'Label not applied to this board' });
    }

    await prisma.boardLabel.delete({
      where: {
        boardId_labelId: {
          boardId,
          labelId
        }
      }
    });

    res.json({ message: 'Label removed from board successfully' });
  } catch (error) {
    console.error('Error removing label from board:', error);
    res.status(500).json({ error: 'Failed to remove label from board' });
  }
});

// Get labels for a specific board
router.get('/boards/:boardId', async (req, res) => {
  try {
    const { boardId } = req.params;

    const boardLabels = await prisma.boardLabel.findMany({
      where: { boardId },
      include: {
        label: true,
        user: {
          select: {
            id: true,
            username: true
          }
        }
      },
      orderBy: {
        label: {
          name: 'asc'
        }
      }
    });

    res.json({ boardLabels });
  } catch (error) {
    console.error('Error fetching board labels:', error);
    res.status(500).json({ error: 'Failed to fetch board labels' });
  }
});

export default router;