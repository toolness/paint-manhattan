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

const audioInitCallbacks: Function[] = [];

/**
 * This function needs to ultimately be called from an
 * event handler; it works around the barriers
 * some web browsers (such as iOS Safari) put in our way
 * to prevent sites from abusing autoplay.
 */
export function initializeAudio() {
  audioInitCallbacks.forEach(cb => cb());
  audioInitCallbacks.splice(0);
}

async function loadAudio(url: string): Promise<HTMLAudioElement> {
  // Browsers are extremely fidgety when it comes to loading audio, perhaps because
  // they always assume it's going to be some massive file that it's going to need to
  // stream or something (while our audio files are quite small).
  //
  // In any case, the caching of the audio for offline use, in particular, has lots
  // of issues. See for example Google Workbox's documentation on serving cached
  // audio and video:
  //
  //   https://developers.google.com/web/tools/workbox/guides/advanced-recipes#cached-av
  //
  // It seems we can work around all this jibberjabber by just retrieving the actual
  // bytes of audio data (which works consistently offline) and then creating an object URL
  // from it, which we point an <audio> element at.

  if (!url.endsWith('.mp3')) {
    throw new Error('Only MP3 audio is currently supported!');
  }
  const audio = document.createElement('audio');
  const response = await fetch(url);
  if (response.status !== 200) {
    throw new Error(`GET ${url} returned HTTP ${response.status}`);
  }
  const buf = await response.arrayBuffer();
  const objectURL = URL.createObjectURL(new Blob([buf], {type: 'audio/mpeg'}));
  return new Promise((resolve, reject) => {
    audioInitCallbacks.push(() => audio.load());
    audio.oncanplay = () => {
      resolve(audio);
    };
    audio.onerror = reject;
    audio.src = objectURL;
  });
}
