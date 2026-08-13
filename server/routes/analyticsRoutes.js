import { Router } from 'express';
import {
  summary,
  monthly,
  categories,
} from '../controllers/analyticsController.js';

const router = Router();

router.get('/summary', summary);
router.get('/monthly', monthly);
router.get('/categories', categories);

export default router;
