import { loadAsepriteSheet } from "./aseprite-sheet.js";
import { loadImage } from "./util.js";
import { BitmapFont, BitmapFontOptions } from "./font.js";
import { Manhattan } from "./manhattan.js";

const SPRITESHEET_URL = "./manhattan.json";

const FONT_URL = "./pman_font01.png";

const FONT_OPTIONS: BitmapFontOptions = {
  charWidth: 6,
  charHeight: 8,
  charsPerLine: 16,
};

async function main() {
  const qs = new URLSearchParams(window.location.search);
  const sheet = await loadAsepriteSheet(SPRITESHEET_URL);
  const fontImage = await loadImage(FONT_URL);
  const font = new BitmapFont(fontImage, FONT_OPTIONS);
  const showStreetSkeleton = qs.get('skel') === 'on';
  const manhattan = new Manhattan({sheet, font, root: document.body, showStreetSkeleton});
  manhattan.start();
}

main().catch(e => {
  console.error(e);
});
