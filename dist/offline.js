/** Location of the service worker script relative to our web pages. */
const SERVICE_WORKER_SCRIPT = './service-worker.js';
/** The content hash for the current offline version. */
let offlineVersion = '';
/** Listeners to notify when offline state changes. */
const changeListeners = [];
/**
 * Return the content hash for the current offline version, or an empty string if
 * we don't know.
 */
export function getOfflineVersion() {
    return offlineVersion;
}
/** Returns whether the user wants offline support. */
export function wantsOfflineSupport() {
    const qs = new URLSearchParams(window.location.search);
    // Note that the service worker script uses the same logic to determine
    // if the requesting/requested page wants offline support, so if this
    // logic changes, make sure it changes in the service worker too.
    return qs.get('nooffline') !== 'on';
}
/** Returns whether the browser can support offline mode. */
export function canSupportOffline() {
    return 'serviceWorker' in window.navigator && 'caches' in window;
}
/**
 * Enable offline support, but only if the user wants it *and* the browser supports it.
 */
export async function enableOfflineSupport() {
    if (!canSupportOffline() || !wantsOfflineSupport())
        return;
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
        if (typeof (event.data) === 'string' && event.data.startsWith('pong ')) {
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
                }
                else if (installing.state === 'activated') {
                    console.log("Service worker is ACTIVE.");
                    window.location.reload();
                }
            };
        }
    };
    registration.update();
}
/** A class that can subscribe/unsubscribe to changes in offline state. */
export class OfflineStateChangeNotifier {
    constructor(callback) {
        this.callback = callback;
    }
    reset() {
        const idx = changeListeners.indexOf(this.callback);
        if (idx !== -1) {
            changeListeners.splice(idx, 1);
        }
    }
    /** Start listening for changes in offline state. */
    start() {
        this.reset();
        changeListeners.push(this.callback);
    }
    /** Stop listening for changes in offline state. */
    stop() {
        this.reset();
    }
}
