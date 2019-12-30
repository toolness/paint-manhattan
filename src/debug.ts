import { loadAsepriteSheet } from "./aseprite-sheet.js";
import { SPRITESHEET_URL } from "./urls.js";
import { getStreetFrames } from "./manhattan.js";

async function debugMain() {
  const sheet = await loadAsepriteSheet(SPRITESHEET_URL);
  const streetNames = getStreetFrames(sheet);
  const streetEl = document.getElementById('street');

  if (!streetEl) {
    throw new Error('Assertion failure, unable to find street <select> element!');
  }

  streetNames.sort();

  for (let name of streetNames) {
    const optionEl = document.createElement('option');
    optionEl.textContent = name;
    optionEl.setAttribute('value', name);
    streetEl.appendChild(optionEl);
  }
}

debugMain().catch(e => {
  console.error(e);
});
