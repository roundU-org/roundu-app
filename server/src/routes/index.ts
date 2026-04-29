import { Router } from 'express';
import trackingRouter from './tracking.routes';
import referralRouter from './referral.routes';
import authRouter from './auth.routes';

// NOTE: Only tracking and referral routers are mounted because they are the
// only feature areas with real implementations. The other route files in this
// directory are 1-line stubs and are intentionally NOT mounted. Mounting them
// would surface fake endpoints that return nothing and hide the gap from the
// launch-readiness report. See the gap list for the full list of unmounted
// stubs.

const router = Router();

router.use('/auth', authRouter);
router.use('/tracking', trackingRouter);
router.use('/referrals', referralRouter);

export default router;
