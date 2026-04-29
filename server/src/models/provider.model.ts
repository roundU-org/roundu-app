import { getPool } from '../config/database';

export interface Provider {
  id: string;
  user_id: string;
  bio: string | null;
  experience_years: number;
  rating: number;
  response_rate: number;
  is_online: boolean;
  service_radius: number;
  working_hours: string | null;
}

export const ProviderModel = {
  async findByUserId(userId: string): Promise<Provider | null> {
    const res = await getPool().query('SELECT * FROM providers WHERE user_id = $1', [userId]);
    return res.rows[0] || null;
  },

  async getStats(providerId: string): Promise<any> {
    const earningsRes = await getPool().query(
      "SELECT SUM(amount) as total FROM wallet_transactions WHERE user_id = (SELECT user_id FROM providers WHERE id = $1) AND type = 'credit' AND created_at >= CURRENT_DATE",
      [providerId]
    );
    const jobsRes = await getPool().query(
      "SELECT COUNT(*) as count FROM bookings WHERE provider_id = $1 AND status = 'completed'",
      [providerId]
    );
    return {
      earningsToday: parseFloat(earningsRes.rows[0]?.total || '0'),
      completedJobs: parseInt(jobsRes.rows[0]?.count || '0')
    };
  },

  async findByServiceId(serviceId: string): Promise<Provider[]> {
    const res = await getPool().query(
      'SELECT p.* FROM providers p JOIN provider_services ps ON p.id = ps.provider_id WHERE ps.service_id = $1',
      [serviceId]
    );
    return res.rows;
  }
};
