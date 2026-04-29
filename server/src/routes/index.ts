import { Router } from 'express';
import trackingRouter from './tracking.routes';
import referralRouter from './referral.routes';
import authRouter from './auth.routes';
import userRouter from './user.routes';
import providerRouter from './provider.routes';
import bookingRouter from './booking.routes';

const router = Router();

router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/providers', providerRouter);
router.use('/bookings', bookingRouter);
router.use('/tracking', trackingRouter);
router.use('/referrals', referralRouter);

export default router;
