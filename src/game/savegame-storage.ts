import { GameplaySavegame } from "./states/gameplay";

const STORAGE_KEY = 'manhattan_savegame';
const DEBUG = false;

export type Savegame = {
  gameplay: GameplaySavegame;
  id: string;
};

export class SavegameStorage {
  constructor(readonly id: string, readonly storage: Storage|undefined = window.localStorage) {
    this.save = this.save.bind(this);
  }

  load(): GameplaySavegame|undefined {
    if (!this.storage) return;
    try {
      const savegameStr = this.storage.getItem(STORAGE_KEY);
      if (!savegameStr) return;
      let savegame = JSON.parse(savegameStr);
      if (savegame && savegame.id === this.id) {
        if (DEBUG) {
          console.log(`Found savegame with id ${this.id}.`, savegame);
        }
        return savegame.gameplay;
      }
    } catch (e) {
      console.log('Loading game failed!');
      console.error(e);
    }
  }

  save(gameplay: GameplaySavegame|null) {
    if (!this.storage) return;
    if (gameplay) {
      const savegame: Savegame = {
        gameplay,
        id: this.id
      };
      try {
        this.storage.setItem(STORAGE_KEY, JSON.stringify(savegame));
        if (DEBUG) {
          console.log(`Saved game with id ${this.id}.`);
        }
      } catch (e) {
        console.log('Saving game failed!');
        console.error(e);
      }
    } else {
      this.storage.removeItem(STORAGE_KEY);
    }
  }
}
