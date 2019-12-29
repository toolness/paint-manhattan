/** Generic interface for a playable sound effect. */
export interface SoundEffect {
  play(): void;
}

/**
 * Implementation of a sound effect that is non-essential,
 * e.g. its loading shouldn't block the app, nor should the
 * app crash if the effect can't be loaded.
 */
export class OptionalSoundEffect implements SoundEffect {
  private audio: HTMLAudioElement|null = null;

  constructor(readonly url: string) {
    loadAudio(url).then(audio => {
      this.audio = audio;
    }).catch(e => {
      console.log(`Loading ${url} failed.`);
      console.error(e);
    });
  }

  play() {
    if (this.audio) {
      this.audio.play();
    }
  }
}

async function loadAudio(url: string): Promise<HTMLAudioElement> {
  const audio = document.createElement('audio');
  return new Promise((resolve, reject) => {
    audio.oncanplay = () => {
      resolve(audio);
    };
    audio.onerror = reject;
    audio.src = url;
  });
}
