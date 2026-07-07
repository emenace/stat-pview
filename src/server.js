import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import { SqliteStore } from './config/session_store.js';

import { initDatabase } from './config/database.js';
import authRoutes from './routes/auth_routes.js';
import categoryRoutes from './routes/category_routes.js';
import columnRoutes from './routes/column_routes.js';
import recordRoutes from './routes/record_routes.js';
import chartRoutes from './routes/chart_routes.js';
import subcategoryRoutes from './routes/subcategory_routes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite database and tables
initDatabase();

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Core Middlewares
app.use(cors({
  origin: isProd ? process.env.FRONTEND_URL : 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Configuration
app.use(session({
  name: 'stat_session',
  secret: process.env.SESSION_SECRET || 'stat_public_view_secret_key_2026',
  store: new SqliteStore(),
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
  }
}));

// Serve static frontend assets
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/subcategories', subcategoryRoutes);
app.use('/api/columns', columnRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/charts', chartRoutes);

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
