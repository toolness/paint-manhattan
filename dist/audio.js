/**
 * Implementation of a sound effect that is non-essential,
 * e.g. its loading shouldn't block the app, nor should the
 * app crash if the effect can't be loaded.
 */
export class OptionalSoundEffect {
    constructor(url) {
        this.url = url;
        this.audio = null;
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
const audioInitCallbacks = [];
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
async function loadAudio(url) {
    const audio = document.createElement('audio');
    return new Promise((resolve, reject) => {
        audioInitCallbacks.push(() => audio.load());
        audio.oncanplay = () => {
            resolve(audio);
        };
        audio.onerror = reject;
        audio.src = url;
    });
}
