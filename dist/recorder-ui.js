import { AnimatedPngRecorder } from "./animated-png-recorder.js";
const SCALE_FACTOR = 1;
export class RecorderUI {
    constructor(rootEl = document.body) {
        this.rootEl = rootEl;
        this.recorder = new AnimatedPngRecorder();
        this.handleDrawFrame = this.handleDrawFrame.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.overlayEl = document.createElement('div');
        this.overlayEl.className = 'recorder-ui-overlay';
        this.rootEl.appendChild(this.overlayEl);
        this.buttonEl = document.createElement('button');
        this.buttonEl.textContent = 'Stop recording';
        this.buttonEl.onclick = this.handleClick.bind(this, this.buttonEl);
        this.overlayEl.appendChild(this.buttonEl);
    }
    handleClick(buttonEl) {
        buttonEl.disabled = true;
        this.overlayEl.textContent = "Encoding\u2026";
        this.buttonEl = null;
        const { frameCount } = this.recorder;
        this.recorder.encodeToObjectURL(SCALE_FACTOR).then(({ url, byteLength }) => {
            const link = document.createElement('a');
            link.download = 'manhattan-recording.png';
            link.href = url;
            link.textContent = `Download recording`;
            const text = document.createElement('div');
            text.textContent = `(${frameCount} frames, ${byteLength} bytes)`;
            this.overlayEl.textContent = '';
            this.overlayEl.appendChild(link);
            this.overlayEl.appendChild(text);
        }).catch(e => {
            window.alert("Alas, an error occurred while encoding the animation.");
            console.error(e);
        });
    }
    handleDrawFrame(ctx) {
        if (this.buttonEl) {
            this.recorder.addFrame(ctx);
            this.buttonEl.title = `Recorded ${this.recorder.frameCount} frames so far.`;
        }
    }
}
