import { getPool } from '../config/database';

export interface Notification {
  id: string;
  user_id: string;
  text: string;
  is_read: boolean;
  created_at: Date;
}

export const NotificationModel = {
  async create(notification: { user_id: string; text: string }): Promise<Notification> {
    const res = await getPool().query(
      'INSERT INTO notifications (user_id, text) VALUES ($1, $2) RETURNING *',
      [notification.user_id, notification.text]
    );
    return res.rows[0];
  },

  async findByUserId(userId: string): Promise<Notification[]> {
    const res = await getPool().query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return res.rows;
  }
};
