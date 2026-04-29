import { Router } from 'express';
import { getProviderDashboard, searchProviders } from '../controllers/provider.controller';

const router = Router();

router.get('/dashboard', getProviderDashboard);
router.get('/search', searchProviders);

export default router;
