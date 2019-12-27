import { loadAsepriteSheet } from "./aseprite-sheet.js";

console.log("Loading resources!");

async function main() {
  const sheet = await loadAsepriteSheet('./manhattan.json');
  console.log("WOO", sheet);
  document.body.appendChild(sheet.image);
}

main().catch(e => {
  console.error(e);
});
