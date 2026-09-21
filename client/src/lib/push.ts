import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

let registering = false;

// TEMPORARY: android/app/google-services.json was never added, so FirebaseApp
// never initializes natively. The Capacitor push plugin's register() method
// calls straight into FirebaseMessaging.getInstance() on the Android side
// (before anything crosses back into JS), which throws an uncaught
// IllegalStateException on a background thread and takes down the whole app
// - a JS try/catch around register() cannot catch this, since the crash
// happens on the native side of the bridge call.
// Flip this back on once a real google-services.json is added to
// android/app/ (Firebase Console -> Project Settings -> your Android app ->
// download google-services.json) and the app has been rebuilt.
const PUSH_NOTIFICATIONS_ENABLED = false;

// Requests notification permission and registers this device for FCM push,
// so the provider can still receive new-request alerts when the socket
// connection is closed (app backgrounded/killed). No-op on web.
export async function registerPushNotifications(onToken: (token: string) => void) {
  if (!PUSH_NOTIFICATIONS_ENABLED) return;
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
