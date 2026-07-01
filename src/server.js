import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';

import { initDatabase } from './config/database.js';
import authRoutes from './routes/auth_routes.js';
import categoryRoutes from './routes/category_routes.js';
import columnRoutes from './routes/column_routes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite database and tables
initDatabase();

const app = express();
const PORT = process.env.PORT || 3000;

// Core Middlewares
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Configuration
app.use(session({
  name: 'stat_session',
  secret: process.env.SESSION_SECRET || 'stat_public_view_secret_key_2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
}));

// Serve static frontend assets
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/columns', columnRoutes);

// Health Check API Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Statistic Public View API',
    timestamp: new Date().toISOString()
  });
});

// Fallback 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found'
  });
});

app.listen(PORT, () => {
  console.log(`[Server] Statistic Public View running on http://localhost:${PORT}`);
});

export default app;
