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
  private static readonly downMap: KeysState = {};

  private static readonly hitMap: KeysState = {};

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
      forward: this.downMap.ArrowRight,
      back: this.downMap.ArrowLeft,
      punchHigh: this.hitMap.KeyZ,
      punchMiddle: this.hitMap.KeyX,
      kick: this.hitMap.KeyC,
      block: this.downMap.Space,
    };
  }

  public static keyDown(key: string): boolean {
    return this.downMap[key];
  }

  public static keyHit(key: string): boolean {
    return this.hitMap[key];
  }

  public static reset() {
    for (const name in this.hitMap) {
      if (name in this.hitMap) {
        this.hitMap[name] = false;
      }
    }
  }

  private static onKeyDown(ev: KeyboardEvent) {
    if (!this.downMap[ev.code]) {
      this.downMap[ev.code] = true;
    }
    this.hitMap[ev.code] = true;
  }

  private static onKeyUp(ev: KeyboardEvent) {
    this.downMap[ev.code] = false;
    this.hitMap[ev.code] = false;
  }
}
