/**
 * Globs needed for running the game offline. Specifically,
 * these are the files that will be cached by the game's
 * service worker.
 */
export const OFFLINE_GLOBS = [
  'graphics/**/*.png',
  'graphics/**/*.json',
  'vendor/**/*',
  'dist/**/*.js',
  'audio/**/*.mp3',
  'favicon.ico',
  'index.html',
  'debug.html',
];

/** The game's service worker. */
export const SERVICE_WORKER_FILENAME = 'service-worker.js';

/**
 * Globs needed to distribute the game, but not needed for
 * offline operation.
 */
export const ONLINE_GLOBS = [
  'icons/**/*.png',
  'manifest.json',
  'thumbnail.png',
  SERVICE_WORKER_FILENAME,
];
