import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { authRouter } from '../backend/src/routes/auth';
import { boardsRouter } from '../backend/src/routes/boards';
import { pollsRouter } from '../backend/src/routes/polls';
import { biddingRouter } from '../backend/src/routes/bidding';
import labelsRouter from '../backend/src/routes/labels';

dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Bridge Bidding Discussion API is running' });
});

// API routes
app.get('/', (req, res) => {
  res.json({ message: 'Bridge Bidding Discussion API' });
});

// Authentication routes
app.use('/auth', authRouter);

// Board and tournament routes
app.use('/', boardsRouter);

// Poll routes
app.use('/', pollsRouter);

// Bidding routes
app.use('/', biddingRouter);

// Labels routes
app.use('/labels', labelsRouter);

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Export handler for Vercel
export default (req: VercelRequest, res: VercelResponse) => {
  return app(req, res);
};