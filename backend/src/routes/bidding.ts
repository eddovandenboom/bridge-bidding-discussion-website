import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from './auth';

const router = express.Router();
const prisma = new PrismaClient();

// Create a new bidding table for a board
router.post('/boards/:boardId/bidding', authenticateToken, async (req, res) => {
  try {
    const { boardId } = req.params;
    const { bids } = req.body;
    const userId = req.user.userId;

    // Validate input
    if (!bids || !Array.isArray(bids)) {
      return res.status(400).json({ error: 'Bids array is required' });
    }

    // Verify board exists
    const board = await prisma.board.findUnique({ where: { id: boardId } });
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Create bidding table with bids
    const biddingTable = await prisma.biddingTable.create({
      data: {
        boardId,
        userId,
        bids: {
          create: bids.map((bid: any, index: number) => ({
            position: index,
            seat: bid.seat,
            level: bid.level,
            suit: bid.suit,
            call: bid.call,
            isAlert: bid.isAlert || false,
            alertText: bid.alertText || null,
            comment: bid.comment || null
          }))
        }
      },
      include: {
        bids: {
          orderBy: { position: 'asc' }
        },
        user: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    res.status(201).json({ biddingTable });
  } catch (error) {
    console.error('Create bidding table error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get bidding tables for a board
router.get('/boards/:boardId/bidding', async (req, res) => {
  try {
    const { boardId } = req.params;

    const biddingTables = await prisma.biddingTable.findMany({
      where: { boardId },
      include: {
        bids: {
          orderBy: { position: 'asc' }
        },
        user: {
          select: {
            id: true,
            username: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ biddingTables });
  } catch (error) {
    console.error('Get bidding tables error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a specific bidding table
router.put('/bidding/:biddingTableId', authenticateToken, async (req, res) => {
  try {
    const { biddingTableId } = req.params;
    const { bids } = req.body;

    // Validate input
    if (!bids || !Array.isArray(bids)) {
      return res.status(400).json({ error: 'Bids array is required' });
    }

    // Verify bidding table exists
    const existingTable = await prisma.biddingTable.findUnique({
      where: { id: biddingTableId }
    });

    if (!existingTable) {
      return res.status(404).json({ error: 'Bidding table not found' });
    }

    // Delete existing bids and create new ones
    await prisma.bid.deleteMany({
      where: { biddingTableId }
    });

    const updatedBiddingTable = await prisma.biddingTable.update({
      where: { id: biddingTableId },
      data: {
        bids: {
          create: bids.map((bid: any, index: number) => ({
            position: index,
            seat: bid.seat,
            level: bid.level,
            suit: bid.suit,
            call: bid.call,
            isAlert: bid.isAlert || false,
            alertText: bid.alertText || null,
            comment: bid.comment || null
          }))
        }
      },
      include: {
        bids: {
          orderBy: { position: 'asc' }
        }
      }
    });

    res.json({ biddingTable: updatedBiddingTable });
  } catch (error) {
    console.error('Update bidding table error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a bidding table
router.delete('/bidding/:biddingTableId', authenticateToken, async (req, res) => {
  try {
    const { biddingTableId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Note: In a real app, you might want to add ownership checks
    // For now, any authenticated user can delete bidding tables

    const deletedTable = await prisma.biddingTable.delete({
      where: { id: biddingTableId }
    });

    res.json({ message: 'Bidding table deleted successfully' });
  } catch (error) {
    console.error('Delete bidding table error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Bidding table not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific bidding table with full details
router.get('/bidding/:biddingTableId', async (req, res) => {
  try {
    const { biddingTableId } = req.params;

    const biddingTable = await prisma.biddingTable.findUnique({
      where: { id: biddingTableId },
      include: {
        board: {
          select: {
            id: true,
            boardNumber: true,
            dealer: true,
            vulnerability: true
          }
        },
        bids: {
          orderBy: { position: 'asc' }
        }
      }
    });

    if (!biddingTable) {
      return res.status(404).json({ error: 'Bidding table not found' });
    }

    res.json({ biddingTable });
  } catch (error) {
    console.error('Get bidding table error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as biddingRouter };