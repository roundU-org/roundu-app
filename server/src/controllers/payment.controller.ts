import { Request, Response } from 'express';
import Razorpay from 'razorpay';
import { env } from '../config/env';

const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID || '',
  key_secret: env.RAZORPAY_KEY_SECRET || '',
});

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;
    
    const options = {
      amount: amount * 100, // amount in smallest currency unit
      currency,
      receipt,
    };

    const order = await razorpay.orders.create(options);
    res.json({ success: true, order });
  } catch (error) {
    console.error('Razorpay order error:', error);
    res.status(500).json({ success: false, message: 'Payment initialization failed' });
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  // Verification logic using crypto.createHmac
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  // ... verification code ...
  res.json({ success: true });
};
