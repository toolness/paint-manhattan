import { loadAsepriteSheet } from "./aseprite-sheet.js";
import { loadImage } from "./util.js";
import { BitmapFont } from "./font.js";
import { Manhattan } from "./manhattan.js";
import { OptionalSoundEffect } from "./audio.js";
const SPRITESHEET_URL = "./graphics/manhattan.json";
const SPLASH_URL = "./graphics/splash.png";
const FONT_URL = "./graphics/pman_font01.png";
const SUCCESS_AUDIO_URL = "./audio/success.mp3";
const FONT_OPTIONS = {
    charWidth: 6,
    charHeight: 8,
    charsPerLine: 16,
};
async function main() {
    const qs = new URLSearchParams(window.location.search);
    const sheet = await loadAsepriteSheet(SPRITESHEET_URL);
    const fontImage = await loadImage(FONT_URL);
    const splashImage = await loadImage(SPLASH_URL);
    const font = new BitmapFont(fontImage, FONT_OPTIONS);
    const manhattan = new Manhattan({
        sheet,
        font,
        splashImage,
        root: document.body,
        skipSplashScreen: qs.get('nosplash') === 'on',
        showStreetSkeleton: !(qs.get('noskel') === 'on'),
        startWithStreet: qs.get('street') || undefined,
        successSoundEffect: new OptionalSoundEffect(SUCCESS_AUDIO_URL),
    });
    manhattan.start();
}
main().catch(e => {
    console.error(e);
});
