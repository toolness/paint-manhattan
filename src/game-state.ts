import { getClassName } from "./util.js";

/** Whether to log state-related debug information. */
const DEBUG = false;

/** Anything that can be started and stopped, possibly multiple times. */
type Startable = {
  start: Function,
  stop: Function
};

/**
 * Encapsulates the current state of the game using the state design pattern:
 * 
 * https://en.wikipedia.org/wiki/State_pattern
 */
export class GameState {
  /** A list of startables that will start when this state enters, and stop when it exits. */
  private startables: Startable[] = [];

  /**
   * Bind the given startables to the lifetime of this state: that is, when the
   * state is entered, the startables will start, and when the state is exited,
   * they will stop.
   */
  protected bindToLifetime(...startable: Startable[]) {
    this.startables.push(...startable);
  }

  /**
   * Called when the state is entered.
   * 
   * If you override this method, make sure to call its super.
   */
  enter() {
    this.startables.forEach(s => {
      DEBUG && console.log(`Starting ${getClassName(s)}.`);
      s.start()
    });
  }

  /**
   * Called when the state is exited.
   * 
   * If you override this method, make sure to call its super.
   */
  exit() {
    this.startables.forEach(s => {
      DEBUG && console.log(`Stopping ${getClassName(s)}.`);
      s.stop()
    });
  }

  /** Updates the state before drawing occurs. */
  update() {}

  /** Called whenever the state should draw itself to the canvas. */
  draw(ctx: CanvasRenderingContext2D) {}
}
