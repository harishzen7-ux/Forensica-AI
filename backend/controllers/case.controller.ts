import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { caseService } from '../services/case.service';
import { asyncHandler } from '../utils/asyncHandler';
import { auditService } from '../services/audit.service';

export const createCase = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title } = req.body;
  const caseId = caseService.createCase(title, req.user!.id);
  
  auditService.log(req.user!.id, 'CASE_CREATED', req.ip);

  res.status(201).json({
    status: 'success',
    data: { caseId }
  });
});

export const getCase = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = caseService.getCase(Number(req.params.id));
  res.status(200).json({
    status: 'success',
    data
  });
});

export const listCases = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = caseService.listCases(req.user!.role === 'admin' ? undefined : req.user!.id);
  res.status(200).json({
    status: 'success',
    data
  });
});
