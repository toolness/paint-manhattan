import { loadAsepriteSheet } from "./aseprite-sheet.js";
import { loadImage, safeParseInt } from "./util.js";
import { BitmapFont, BitmapFontOptions } from "./font.js";
import { Manhattan } from "./game/core.js";
import { OptionalSoundEffect } from "./audio.js";
import * as urls from './urls.js';

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
    startWithStreet: qs.get('street') || undefined,
    successSoundEffect: new OptionalSoundEffect(urls.SUCCESS_AUDIO_URL),
    missSoundEffect: new OptionalSoundEffect(urls.MISS_AUDIO_URL),
  });
  manhattan.start();
}

main().catch(e => {
  console.error(e);
});
