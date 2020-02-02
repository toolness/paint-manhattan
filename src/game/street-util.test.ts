import { areStreetNamesValid } from "./street-util.js";
import { SPRITESHEET_URL } from "./urls.js";
import { loadAsepriteSheet } from "../aseprite-sheet.js";

const sheet = loadAsepriteSheet(SPRITESHEET_URL);

describe("areStreetNamesValid()", () => {
  it("returns true when all names are valid", async () => {
    expect(areStreetNamesValid(await sheet, ['Pearl Street'])).to.be.true;
  });

  it("returns false when at least one name is invalid", async () => {
    expect(areStreetNamesValid(await sheet, ['Pearl Street', 'Boop Street'])).to.be.false;
  });
});
