import { getFirebaseMessaging } from '../config/firebase';
import { getPool } from '../config/database';

interface PushNotification {
  title: string;
  body: string;
  data?: Record<string, string>;
}

// Sends an FCM push to each user's stored device token, independent of any live
// socket connection — this is the delivery path for backgrounded/killed apps.
// Stale/uninstalled tokens are cleared from the DB so we stop retrying them.
export async function sendPushToUsers(userIds: string[], notification: PushNotification): Promise<void> {
  if (userIds.length === 0) return;

  const messaging = getFirebaseMessaging();
  if (!messaging) return;

  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT id, push_token FROM users WHERE id = ANY($1) AND push_token IS NOT NULL`,
    [userIds]
  );
  if (rows.length === 0) return;

  const staleUserIds: string[] = [];

  await Promise.all(rows.map(async (row: { id: string; push_token: string }) => {
    try {
      await messaging.send({
        token: row.push_token,
        notification: { title: notification.title, body: notification.body },
        data: notification.data || {},
        android: { priority: 'high' },
        apns: { headers: { 'apns-priority': '10' }, payload: { aps: { sound: 'default' } } },
      });
    } catch (err: any) {
      const code = err?.code || err?.errorInfo?.code;
      if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token') {
        staleUserIds.push(row.id);
      } else {
        console.error(`[push] failed to send to user ${row.id}:`, err?.message || err);
      }
    }
  }));

  if (staleUserIds.length > 0) {
    await pool.query(`UPDATE users SET push_token = NULL WHERE id = ANY($1)`, [staleUserIds]);
    console.log(`[push] cleared ${staleUserIds.length} stale push token(s)`);
  }
}
