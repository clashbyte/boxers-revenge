export interface ControlState {
  forward: boolean;
  back: boolean;
  punchHigh: boolean;
  punchMiddle: boolean;
  kick: boolean;
  block: boolean;
}

type KeysState = { [key: string]: boolean };

export class Controls {
  private static readonly keyDown: KeysState = {};

  private static readonly keyHit: KeysState = {};

  public static bind() {
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  public static unbind() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }

  public static getState(): ControlState {
    return {
      forward: this.keyDown.ArrowRight,
      back: this.keyDown.ArrowLeft,
      punchHigh: this.keyHit.KeyZ,
      punchMiddle: this.keyHit.KeyX,
      kick: this.keyHit.KeyC,
      block: this.keyDown.Space,
    };
  }

  public static reset() {
    for (const name in this.keyHit) {
      if (name in this.keyHit) {
        this.keyHit[name] = false;
      }
    }
  }

  private static onKeyDown(ev: KeyboardEvent) {
    if (!this.keyDown[ev.code]) {
      this.keyHit[ev.code] = true;
    }
    this.keyDown[ev.code] = true;
  }

  private static onKeyUp(ev: KeyboardEvent) {
    this.keyDown[ev.code] = false;
    this.keyHit[ev.code] = false;
  }
}
