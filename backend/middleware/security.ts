import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { Express } from 'express';

export const setupSecurity = (app: Express) => {
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for dev/preview compatibility
    crossOriginEmbedderPolicy: false,
  }));
  app.use(cors());

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    handler: (req, res) => {
      res.status(429).json({
        status: 'error',
        message: 'Too many requests from this IP, please try again after 15 minutes'
      });
    }
  });

  app.use('/api', limiter);
};
