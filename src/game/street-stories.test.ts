import { SPRITESHEET_URL } from "./urls.js";
import { loadAsepriteSheet } from "../aseprite-sheet.js";
import { getStreetFrames } from "./sheet-frames.js";
import { getStreetsInNarrativeOrder, getStreetStory, streetHasStory } from "./street-stories.js";

const sheet = loadAsepriteSheet(SPRITESHEET_URL);

describe("getStreetsInNarrativeOrder()", () => {
  it("returns a valid list of streets", async () => {
    const allStreetSet = new Set(getStreetFrames(await sheet));
    for (let streetName of getStreetsInNarrativeOrder()) {
      if (!getStreetStory(streetName)) {
        throw new Error(`Assertion failure, getStreetStory() is not working!`);
      }
      if (!streetHasStory(streetName)) {
        throw new Error(`Assertion failure, streetHasStory() is not working!`);
      }
      if (!allStreetSet.has(streetName)) {
        throw new Error(`Story has invalid street name "${streetName}"`);
      }
    }
  });
});
