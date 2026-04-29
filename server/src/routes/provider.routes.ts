import { Router } from 'express';
import { getProviderDashboard } from '../controllers/provider.controller';

const router = Router();

router.get('/dashboard', getProviderDashboard);

export default router;
