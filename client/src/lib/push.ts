import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

let registering = false;

// Requests notification permission and registers this device for FCM push,
// so the provider can still receive new-request alerts when the socket
// connection is closed (app backgrounded/killed). No-op on web.
export async function registerPushNotifications(onToken: (token: string) => void) {
  if (!Capacitor.isNativePlatform() || registering) return;
  registering = true;

  try {
    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }
    if (permStatus.receive !== 'granted') {
      console.warn('[push] notification permission not granted');
      return;
    }

    await PushNotifications.removeAllListeners();

    PushNotifications.addListener('registration', (token) => {
      console.log('[push] device registered for push');
      onToken(token.value);
    });

    PushNotifications.addListener('registrationError', (err) => {
      console.error('[push] registration error:', err);
    });

    await PushNotifications.register();
  } catch (err) {
    console.error('[push] setup failed:', err);
  } finally {
    registering = false;
  }
}
