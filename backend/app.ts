import express from 'express';
import { setupSecurity } from './middleware/security';
import { globalErrorHandler } from './middleware/error';
import authRoutes from './routes/auth.routes';
import forensicRoutes from './routes/forensic.routes';
import caseRoutes from './routes/case.routes';
import { AppError } from './utils/errors';

const app = express();

// Security
setupSecurity(app);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Logging & Request Normalization
app.use('/api', (req, res, next) => {
  console.log(`[API REQUEST] ${req.method} ${req.originalUrl} (path: ${req.path})`);
  
  // Ensure we always want JSON for /api
  res.setHeader('Content-Type', 'application/json');
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', forensicRoutes);
app.use('/api/cases', caseRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// API 404 handler - MUST return JSON, never HTML
app.use('/api', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `API route not found: ${req.method} ${req.originalUrl}`
  });
});

// Error handling
app.use(globalErrorHandler);

export default app;
