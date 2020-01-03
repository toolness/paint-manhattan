importScripts("./service-worker-metadata.js");

const MY_URL = new URL(self.location.href);

const PREFIX = 'paint-manhattan-';

const VERSION = `${PREFIX}${FILE_CONTENT_HASH}`;

const SHORT_VER = FILE_CONTENT_HASH.slice(0, 10);

function isOldCache(cacheName) {
  return cacheName.startsWith(PREFIX) && cacheName !== VERSION;
}

function normalizeRequest(request) {
  const url = new URL(request.url);
  const rootDir = new URL('./', MY_URL);
  const indexHTML = new URL('./index.html', MY_URL);
  if (url.origin === MY_URL.origin && (url.pathname === rootDir.pathname || url.pathname === indexHTML.pathname)) {
    // The root directory and the index.html both refer to the same physical file. Also,
    // we want to strip off any querystring arguments to ensure that we have a cache hit.
    return new Request(indexHTML.href);
  }
  return request;
}

console.log(`Service worker ${SHORT_VER} is running.`);

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
    const request = normalizeRequest(event.request);
    const response = await caches.match(request);
    if (response) {
      return response;
    }
    console.log(`Fetching ${request.url} from the network.`, request);
    throw new Error(`Unexpected network request: ${request.url}`);
    // return fetch(request);
  };
  event.respondWith(respond());
});
