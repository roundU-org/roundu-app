import * as admin from 'firebase-admin';

let messaging: admin.messaging.Messaging | null | undefined;

// Lazily initialize on first use so a missing/invalid config doesn't crash server boot.
export function getFirebaseMessaging(): admin.messaging.Messaging | null {
  if (messaging !== undefined) return messaging;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('[firebase] Missing FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY — push notifications disabled');
    messaging = null;
    return messaging;
  }

  try {
    const app = admin.apps.length ? admin.app() : admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
    messaging = admin.messaging(app);
  } catch (err) {
    console.error('[firebase] Failed to initialize firebase-admin:', err);
    messaging = null;
  }

  return messaging;
}
