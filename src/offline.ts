/** Location of the service worker script relative to our web pages. */
const SERVICE_WORKER_SCRIPT = './service-worker.js';

/** The content hash for the current offline version. */
let offlineVersion = '';

/** Listeners to notify when offline state changes. */
const changeListeners: Function[] = [];

/**
 * Return the content hash for the current offline version, or an empty string if
 * we don't know.
 */
export function getOfflineVersion(): string {
  return offlineVersion;
}

/**
 * Register a function to be called when information about the offline
 * state changes. Returns a function to unsubscribe from updates.
 */
export function onOfflineStateChange(cb: Function): Function {
  changeListeners.push(cb);
  return () => {
    const idx = changeListeners.indexOf(cb);
    if (idx !== -1) {
      changeListeners.splice(idx, 1);
    }
  };
}

/** Returns whether the user wants offline support. */
export function wantsOfflineSupport(): boolean {
  const qs = new URLSearchParams(window.location.search);

  // Note that the service worker script uses the same logic to determine
  // if the requesting/requested page wants offline support, so if this
  // logic changes, make sure it changes in the service worker too.
  return qs.get('offline') === 'on';
}

/** Returns whether the browser can support offline mode. */
export function canSupportOffline(): boolean {
  return 'serviceWorker' in window.navigator && 'caches' in window;
}

/**
 * Enable offline support, but only if the user wants it *and* the browser supports it.
 */
export async function enableOfflineSupport() {
  if (!canSupportOffline() || !wantsOfflineSupport()) return;

  const pageURL = new URL(window.location.href);
  const workerURL = new URL(SERVICE_WORKER_SCRIPT, pageURL);
  const registration = await window.navigator.serviceWorker.register(workerURL.href);
  console.log('Service worker registration succeeded.');
  window.navigator.serviceWorker.oncontrollerchange = () => {
    console.log("Controller changed.");
    // For some reason this event seems to fire prematurely, so we won't reload here.
    // window.location.reload();
  };
  window.navigator.serviceWorker.onmessage = event => {
    if (typeof(event.data) === 'string' && event.data.startsWith('pong ')) {
      offlineVersion = event.data.split(' ')[1];
      changeListeners.forEach(cb => cb());
    }
  };
  if (registration.active) {
    registration.active.postMessage('ping');
  }
  registration.onupdatefound = () => {
    console.log("A service worker update was found.");
    const { installing } = registration;
    if (installing) {
      console.log("Service worker is installing.");
      installing.onstatechange = () => {
        if (installing.state === 'installed') {
          console.log("Service worker installed.");
        } else if (installing.state === 'activated') {
          console.log("Service worker is ACTIVE.");
          window.location.reload();
        }
      };
    }
  };
  registration.update();
}
