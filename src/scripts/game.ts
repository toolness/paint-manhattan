import { loadAsepriteSheet } from "../aseprite-sheet.js";
import { loadImage, safeParseInt } from "../util.js";
import { BitmapFont, BitmapFontOptions } from "../font.js";
import { Manhattan } from "../game/core.js";
import { OptionalSoundEffect } from "../audio.js";
import * as urls from '../game/urls.js';
import { enableOfflineSupport } from "../offline.js";
import { RecorderUI } from "../recorder-ui.js";
import { SavegameStorage } from "../game/savegame-storage.js";
import { logAmplitudeEvent } from "../amplitude.js";

const RESET_BUTTON_DISAPPEAR_MS = 10_000;

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

function showResetButton(savegameStorage: SavegameStorage, parent: HTMLElement = document.body) {
  const button = document.createElement('button');
  button.id = 'power-button';
  button.textContent = button.title = 'Reset game';
  button.className = 'pixely-button';
  button.onclick = () => {
    savegameStorage.save(null);
    logAmplitudeEvent({name: 'Game reset'});
    window.location.reload();
  };
  parent.appendChild(button);
  window.setTimeout(() => {
    parent.removeChild(button);
  }, RESET_BUTTON_DISAPPEAR_MS);
}

async function main() {
  const qs = new URLSearchParams(window.location.search);
  const sheet = await loadAsepriteSheet(urls.SPRITESHEET_URL);
  const fontImage = await loadImage(urls.FONT_URL);
  const tinyFontImage = await loadImage(urls.TINY_FONT_URL);
  const splashImage = await loadImage(urls.SPLASH_URL);
  const font = new BitmapFont(fontImage, FONT_OPTIONS);
  const tinyFont = new BitmapFont(tinyFontImage, TINY_FONT_OPTIONS);
  const savegameStorage = new SavegameStorage(window.location.href);
  const savegame = savegameStorage.load();
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
    showStreetsInNarrativeOrder: qs.get('narrative') === 'on',
    enableFullscreen: qs.get('fullscreen') === 'on',
    resizeCanvas: !(qs.get('noresize') === 'on'),
    onFrameDrawn: qs.get('record') === 'on' ? new RecorderUI().handleDrawFrame : undefined,
    savegame,
    onAutoSavegame: savegameStorage.save,
  });
  savegame && showResetButton(savegameStorage);
  manhattan.start();

  await enableOfflineSupport();
}

main().catch(e => {
  console.error(e);
});
