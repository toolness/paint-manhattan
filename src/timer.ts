export class Timer {
  private timeout: number|null = null;
  tick: number = 0;

  constructor(readonly intervalMs: number, readonly onTick: Function) {
  }

  start() {
    this.stop();
    this.timeout = window.setInterval(() => {
      this.tick += 1;
      this.onTick();
    }, this.intervalMs);
  }

  stop() {
    if (this.timeout !== null) {
      window.clearInterval(this.timeout);
      this.timeout = null;
    }
    this.tick = 0;
  }
}
