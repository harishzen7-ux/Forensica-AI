import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { asyncHandler } from '../utils/asyncHandler';
import { auditService } from '../services/audit.service';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;
  const userId = await authService.register(name, email, password, role);
  
  auditService.log(Number(userId), 'USER_REGISTERED', req.ip);

  res.status(201).json({
    status: 'success',
    data: { userId }
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const data = await authService.login(email, password);
  
  auditService.log(data.user.id, 'USER_LOGGED_IN', req.ip);

  res.status(200).json({
    status: 'success',
    data
  });
});
