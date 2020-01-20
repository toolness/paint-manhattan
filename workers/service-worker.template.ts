/**
 * This file will be used as a template for the actual service worker.
 * Specfically, some constants starting with `FILE_` will be pre-pended
 * to the beginning.
 *
 * Note that we used to store these variables in a separate file and
 * import them via importScripts(), but it seems not all browsers actually
 * check to see if files imported via importScripts() have changed when
 * checking for service worker updates, so we're just embedding it in
 * the service worker instead.
 */

/** The files that the app needs to work offline. */
declare let FILE_LIST: string[];

/** A string hash of all the contents of the files in `FILE_LIST`. */
declare let FILE_CONTENT_HASH: string;

const MY_URL = new URL(self.location.href);

const PREFIX = 'paint-manhattan-';

const VERSION = `${PREFIX}${FILE_CONTENT_HASH}`;

const SHORT_VER = FILE_CONTENT_HASH.slice(0, 10);

function isOldCache(cacheName: string) {
  return cacheName.startsWith(PREFIX) && cacheName !== VERSION;
}

function clientWantsOfflineContent(client: Client, url: string) {
  if (client) {
    url = client.url;
  }

  const qs = new URLSearchParams(new URL(url).search);

  // Note that `src/offline.ts` uses the same logic to determine
  // if the requesting/requested page wants offline support, so if this
  // logic changes, make sure it changes there too.
  return qs.get('nooffline') !== 'on';
}

function normalizeRequest(request: Request) {
  const url = new URL(request.url);
  const rootDir = new URL('./', MY_URL);
  const indexHTML = new URL('./index.html', MY_URL);
  const debugHTML = new URL('./debug.html', MY_URL);
  if (url.origin === MY_URL.origin) {
    // If the request is one of our HTML files, we want to strip off any querystring arguments
    // to ensure that we have a cache hit.
    if (url.pathname === rootDir.pathname || url.pathname === indexHTML.pathname) {
      // The root directory and the index.html both refer to the same physical file.
      return new Request(indexHTML.href);
    } else if (url.pathname === debugHTML.pathname) {
      return new Request(debugHTML.href);
    }
  }
  return request;
}

// Argh, this is a weird workaround for https://github.com/Microsoft/TypeScript/issues/14877.
function run(self: ServiceWorkerGlobalScope) {
  self.addEventListener('message', event => {
    if (event.data === 'ping') {
      if (!event.source) {
        throw new Error('event.source is null!');
      }
      if (event.source instanceof WindowClient) {
        event.source.postMessage(`pong ${FILE_CONTENT_HASH}`);
      }
    }
  });
  
  self.addEventListener('install', event => {
    console.log(`Service worker ${SHORT_VER} is installing at ${self.location.href}.`);
    const install = async () => {
      await self.skipWaiting();
      const cache = await caches.open(VERSION);
      await cache.addAll(FILE_LIST);
      console.log(`Service worker ${SHORT_VER} cached ${FILE_LIST.length} files.`);
    };
    event.waitUntil(install());
  });
  
  self.addEventListener('activate', event => {
    console.log(`Service worker ${SHORT_VER} is activating.`);
    const activate = async () => {
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter(isOldCache);
      await Promise.all(oldCaches.map(name => {
        console.log(`Deleting old cache ${name}.`);
        return caches.delete(name);
      }));
      await self.clients.claim();
    };
    event.waitUntil(activate());
  });
  
  self.addEventListener('fetch', event => {
    const respond = async () => {
      const client: Client = await self.clients.get(event.clientId);
      let request = event.request;
      if (clientWantsOfflineContent(client, request.url)) {
        request = normalizeRequest(event.request);
        const response = await caches.match(request);
        if (response) {
          return response;
        }
        // The following line can be uncommented for debugging purposes.
        //throw new Error(`Unexpected network request: ${request.url}`);
      }
      return fetch(request);
    };
    event.respondWith(respond());
  });  
}

run((self as any) as ServiceWorkerGlobalScope);
