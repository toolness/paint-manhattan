// This file was auto-generated by build-service-worker-metadata.js.
// Please do not modify it.

const FILE_CONTENT_HASH = "338bc5ea52bda9b0b223670c001cb6e362f13a7e4e2fb0e5c7ca9306ff42c47e";

const FILE_LIST = [
  "audio/miss.mp3",
  "audio/success.mp3",
  "debug.html",
  "dist/aseprite-sheet.js",
  "dist/audio.js",
  "dist/canvas-resizer.js",
  "dist/font.js",
  "dist/fullscreen.js",
  "dist/game-state.js",
  "dist/game/action-prompt.js",
  "dist/game/core.js",
  "dist/game/sheet-frames.js",
  "dist/game/state.js",
  "dist/game/states/gameplay.js",
  "dist/game/states/splash-screen.js",
  "dist/game/states/street-story.js",
  "dist/game/street-stories.js",
  "dist/game/street-util.js",
  "dist/game/urls.js",
  "dist/offline.js",
  "dist/pen.js",
  "dist/scripts/debug.js",
  "dist/scripts/main.js",
  "dist/timer.js",
  "dist/util.js",
  "favicon.ico",
  "graphics/manhattan.json",
  "graphics/manhattan.png",
  "graphics/pman_font01.json",
  "graphics/pman_font01.png",
  "graphics/splash.json",
  "graphics/splash.png",
  "graphics/tiny_font.json",
  "graphics/tiny_font.png",
  "index.html",
  "vendor/skeleton/normalize.css",
  "vendor/skeleton/skeleton.css"
];

// Here begins service-worker.template.js.
//
// This file will be used as a template for the actual service worker.
// Specfically, the following variable definitions will be pre-pended
// to the beginning:
//
// * `FILE_LIST` will be an array of strings corresponding to the files
//   that the app needs.
//
// * `FILE_CONTENT_HASH` will be a string hash of all the contents of the
//   files in `FILE_LIST`.
//
// Note that we used to store these variables in a separate file and
// import them via importScripts(), but it seems not all browsers actually
// check to see if files imported via importScripts() have changed when
// checking for service worker updates, so we're just embedding it in
// the service worker instead.

const MY_URL = new URL(self.location.href);

const PREFIX = 'paint-manhattan-';

const VERSION = `${PREFIX}${FILE_CONTENT_HASH}`;

const SHORT_VER = FILE_CONTENT_HASH.slice(0, 10);

function isOldCache(cacheName) {
  return cacheName.startsWith(PREFIX) && cacheName !== VERSION;
}

function clientWantsOfflineContent(client, url) {
  if (client) {
    url = client.url;
  }

  const qs = new URLSearchParams(new URL(url).search);

  // Note that `src/offline.ts` uses the same logic to determine
  // if the requesting/requested page wants offline support, so if this
  // logic changes, make sure it changes there too.
  return qs.get('offline') === 'on';
}

function normalizeRequest(request) {
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

self.addEventListener('message', event => {
  if (event.data === 'ping') {
    event.source.postMessage(`pong ${FILE_CONTENT_HASH}`);
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
    const client = await clients.get(event.clientId);
    let request = event.request;
    if (clientWantsOfflineContent(client, request.url)) {
      request = normalizeRequest(event.request);
      const response = await caches.match(request);
      if (response) {
        return response;
      }
      throw new Error(`Unexpected network request: ${request.url}`);
    }
    return fetch(request);
  };
  event.respondWith(respond());
});
