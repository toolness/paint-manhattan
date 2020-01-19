import { AnimatedPngRecorder } from "./animated-png-recorder.js";

const SCALE_FACTOR = 2;

export class RecorderUI {
  readonly recorder = new AnimatedPngRecorder();
  readonly overlayEl: HTMLDivElement;
  readonly buttonEl: HTMLButtonElement;
  private url: string|null = null;

  constructor(readonly rootEl: HTMLElement = document.body) {
    this.handleDrawFrame = this.handleDrawFrame.bind(this);
    this.handleClick = this.handleClick.bind(this);

    this.overlayEl = document.createElement('div');
    this.overlayEl.className = 'recorder-ui-overlay';
    this.rootEl.appendChild(this.overlayEl);

    this.buttonEl = document.createElement('button');
    this.buttonEl.textContent = 'Stop recording';
    this.buttonEl.onclick = this.handleClick;
    this.overlayEl.appendChild(this.buttonEl);
  }

  async handleClick() {
    const { buttonEl } = this;

    if (this.url) {
      window.open(this.url, '_blank');
    } else {
      buttonEl.disabled = true;
      buttonEl.textContent = "Encoding\u2026";
      const { frameCount } = this.recorder;
      const { url, byteLength } = await this.recorder.encodeToDataURL(SCALE_FACTOR);
      this.url = url;
      buttonEl.title = `Final recording is ${frameCount} frames (${byteLength} bytes).`;
      buttonEl.textContent = `Open recording`;
      buttonEl.disabled = false;
    }
  }

  handleDrawFrame(ctx: CanvasRenderingContext2D) {
    if (!this.url) {
      this.recorder.addFrame(ctx);
      this.buttonEl.title = `Recorded ${this.recorder.frameCount} frames so far.`;
    }
  }
}
