import app from './backend/app';
import { env } from './backend/config/env';
import { initDb } from './backend/db';
import { logger } from './backend/utils/logger';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import express from 'express';
import fs from 'fs';

async function startServer() {
  // Initialize Database
  initDb();

  // Vite middleware for development
  if (env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    
    // Use vite's connect instance as middleware, but skip for /api
    app.use((req, res, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      vite.middlewares(req, res, next);
    });

    // Serve index.html for all other routes (SPA fallback)
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      
      // Never serve HTML for API routes - if we reached here, it's a 404
      if (url.startsWith('/api')) {
        return res.status(404).json({
          status: 'error',
          message: `API endpoint not found: ${req.method} ${url}`
        });
      }

      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    
    // Production SPA fallback - skip for /api
    app.get("*", (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return res.status(404).json({
          status: 'error',
          message: `API endpoint not found: ${req.method} ${req.originalUrl}`
        });
      }
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(3000, "0.0.0.0", () => {
    logger.info(`Server running on http://localhost:3000 in ${env.NODE_ENV} mode`);
  });
}

startServer().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
