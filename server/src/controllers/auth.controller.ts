import { Request, Response } from 'express';
import * as msg91 from '../services/msg91.service';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UserModel } from '../models/user.model';

export const sendOTP = async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone number required' });

    const result = await msg91.sendOTP(phone);
    res.json({ success: true, message: 'OTP sent successfully', data: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const verifyWidgetToken = async (req: Request, res: Response) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) return res.status(400).json({ error: 'Access token required' });

    const result = await msg91.verifyWidgetToken(accessToken);
    
    // The result contains user details like mobile number
    const mobile = result.mobile_number || 'unknown';

    // DB: Find or Create User
    let user = await UserModel.findByPhone(mobile);
    if (!user) {
      user = await UserModel.create({ phone: mobile });
    }
    
    // Create JWT
    const token = jwt.sign({ id: user.id, phone: mobile }, env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });

    res.json({ success: true, message: 'Verified', token, mobile, user });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
};
