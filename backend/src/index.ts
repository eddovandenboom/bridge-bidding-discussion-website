import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth';
import { boardsRouter } from './routes/boards';
import { pollsRouter } from './routes/polls';
import { biddingRouter } from './routes/bidding';
import labelsRouter from './routes/labels';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Bridge Bidding Discussion API is running' });
});

// API routes
app.get('/api', (req, res) => {
  res.json({ message: 'Bridge Bidding Discussion API' });
});

// Authentication routes
app.use('/api/auth', authRouter);

// Board and tournament routes
app.use('/api', boardsRouter);

// Poll routes
app.use('/api', pollsRouter);

// Bidding routes
app.use('/api', biddingRouter);

// Labels routes
app.use('/api/labels', labelsRouter);

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🌉 Bridge API server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/`);
    console.log(`🃏 Board endpoints: http://localhost:${PORT}/api/tournaments`);
  });
}

// Export for Vercel
export default app;