import { Router } from 'express';
import * as bookingController from '../controllers/booking.controller';

const router = Router();

router.get('/customer/:id', bookingController.getCustomerBookings);
router.post('/', bookingController.createBooking);

export default router;
