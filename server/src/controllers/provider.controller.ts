import { Request, Response } from 'express';
import { ProviderModel } from '../models/provider.model';

export const getProviderDashboard = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query; // In real app, this comes from JWT
    if (!userId) return res.status(400).json({ success: false, message: 'User ID required' });

    const provider = await ProviderModel.findByUserId(userId as string);
    if (!provider) return res.status(404).json({ success: false, message: 'Provider profile not found' });

    const stats = await ProviderModel.getStats(provider.id);

    res.json({
      success: true,
      data: {
        provider,
        stats
      }
    });
  } catch (error) {
    console.error('Provider dashboard error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const searchProviders = async (req: Request, res: Response) => {
  try {
    const { serviceId } = req.query;
    if (!serviceId) return res.status(400).json({ success: false, message: 'Service ID required' });

    const providers = await ProviderModel.findByServiceId(serviceId as string);
    
    // In a real app, we would join with users table to get names
    // For now, let's assume ProviderModel.findByServiceId returns enriched data
    res.json({ success: true, data: providers });
  } catch (error) {
    console.error('Search providers error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
