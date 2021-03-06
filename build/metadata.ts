/**
 * Globs needed for running the game offline. Specifically,
 * these are the files that will be cached by the game's
 * service worker.
 */
export const OFFLINE_GLOBS = [
  'graphics/**/*.png',
  'graphics/**/*.json',
  'vendor/**/*.css',
  'vendor/**/*.js',
  'dist/**/*.js',
  'audio/**/*.mp3',
  'favicon.ico',
  'index.html',
  'debug.html',
  'game.html',
];

/**
 * Globs that are explicitly *not* needed for running
 * the game offline.
 */
export const OFFLINE_IGNORE_GLOBS = [
  'dist/**/*.test.js',
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
  SERVICE_WORKER_FILENAME,
];
