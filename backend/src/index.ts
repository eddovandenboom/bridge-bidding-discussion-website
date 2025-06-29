import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { authRouter } from './routes/auth';
import { boardsRouter } from './routes/boards';
import { pollsRouter } from './routes/polls';
import { biddingRouter } from './routes/bidding';
import labelsRouter from './routes/labels';
import tournamentsRouter from './routes/tournaments';

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

// Serve static files from the 'public' directory
app.use('/public', express.static(path.join(__dirname, '../public')));

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
// Tournament management routes (Admin only)
app.use('/api/tournaments', tournamentsRouter);

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
let server: any;

function startServer() {
  if (server) {
    server.close(() => {
      console.log('Server closed. Restarting...');
      server = startNewInstance();
    });
  } else {
    server = startNewInstance();
  }
}

function startNewInstance() {
  return app.listen(PORT, () => {
    console.log(`🌉 Bridge API server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/`);
    console.log(`🃏 Board endpoints: http://localhost:${PORT}/api/tournaments`);
  }).on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.log('Port is in use, trying to restart...');
      setTimeout(startServer, 1000);
    } else {
      console.error(err);
    }
  });
}

startServer();

// Export for Vercel
export default app;