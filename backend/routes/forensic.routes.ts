import { Router } from 'express';
import * as forensicController from '../controllers/forensic.controller';
import { protect, restrictTo } from '../middleware/auth';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// For the demo, we'll allow these routes without protection if needed, 
// but the frontend doesn't seem to have a login page yet.
// Actually, I'll keep them unprotected for now to ensure the preview works immediately.

router.post('/detect', upload.single('file'), forensicController.analyzeEvidence);
router.post('/detect/save', forensicController.saveAnalysisResult);
router.post('/feedback', forensicController.submitFeedback);
router.get('/stats', forensicController.getStats);
router.get('/history', forensicController.getHistory);
router.post('/history/clear', forensicController.clearHistory);

export default router;
