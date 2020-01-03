import { loadAsepriteSheet } from "../aseprite-sheet.js";
import { loadImage, safeParseInt } from "../util.js";
import { BitmapFont, BitmapFontOptions } from "../font.js";
import { Manhattan } from "../game/core.js";
import { OptionalSoundEffect } from "../audio.js";
import * as urls from '../game/urls.js';
import { validateStreetStories } from "../game/street-story.js";
import { getStreetFrames } from "../game/sheet-frames.js";

const FONT_OPTIONS: BitmapFontOptions = {
  charWidth: 6,
  charHeight: 8,
  charsPerLine: 16,
};

const TINY_FONT_OPTIONS: BitmapFontOptions = {
  charWidth: 4,
  charHeight: 6,
  charsPerLine: 16,
};

async function main() {
  const qs = new URLSearchParams(window.location.search);
  const sheet = await loadAsepriteSheet(urls.SPRITESHEET_URL);
  const fontImage = await loadImage(urls.FONT_URL);
  const tinyFontImage = await loadImage(urls.TINY_FONT_URL);
  const splashImage = await loadImage(urls.SPLASH_URL);
  const font = new BitmapFont(fontImage, FONT_OPTIONS);
  const tinyFont = new BitmapFont(tinyFontImage, TINY_FONT_OPTIONS);
  const manhattan = new Manhattan({
    sheet,
    font,
    tinyFont,
    splashImage,
    root: document.body,
    minStreetSize: safeParseInt(qs.get('minpix'), 0),
    skipSplashScreen: qs.get('nosplash') === 'on',
    showStreetSkeleton: !(qs.get('noskel') === 'on'),
    showStreetStories: !(qs.get('nostreetstories') === 'on'),
    onlyShowStreetsWithStories: qs.get('streetstoriesonly') === 'on',
    startWithStreet: qs.get('street') || undefined,
    showScore: qs.get('score') === 'on',
    successSoundEffect: new OptionalSoundEffect(urls.SUCCESS_AUDIO_URL),
    missSoundEffect: new OptionalSoundEffect(urls.MISS_AUDIO_URL),
  });
  validateStreetStories(getStreetFrames(sheet));
  manhattan.start();
}

async function registerServiceWorker() {
  if (!('serviceWorker' in window.navigator)) return;

  const pageURL = new URL(window.location.href);
  const workerURL = new URL('./service-worker.js', pageURL);
  const registration = await window.navigator.serviceWorker.register(workerURL.href);
  console.log('Service worker registration succeeded.');
  window.navigator.serviceWorker.oncontrollerchange = () => {
    console.log("Controller changed.");
    // For some reason this event seems to fire prematurely, so we won't reload here.
    // window.location.reload();
  };
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

function reportError(e: Error) {
  console.error(e);
}

main().catch(reportError);

registerServiceWorker().catch(reportError);
