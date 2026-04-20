import { Router } from 'express';
import * as caseController from '../controllers/case.controller';
import { protect } from '../middleware/auth';
import { z } from 'zod';
import { validate } from '../middleware/validate';

const router = Router();

const createCaseSchema = z.object({
  body: z.object({
    title: z.string().min(3),
  }),
});

router.use(protect);

router.post('/', validate(createCaseSchema), caseController.createCase);
router.get('/', caseController.listCases);
router.get('/:id', caseController.getCase);

export default router;
