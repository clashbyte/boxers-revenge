import { FGTAnimation } from '../helpers/decodeFGT.ts';

export enum Animation {
  HighJabL,
  MiddleJabL,
  HighJabR,
  MiddleJabR,
  KickL,
  KickR,
  Hit,
  Idle,
  MoveForward,
  MoveBack,
  Block,
  LoseStance,
  WinStance,
}

interface AnimState {
  from: number;
  to: number;
  length: number;
  time: number;
  speed: number;
}

export class FighterAnimator {
  private readonly tracks: FGTAnimation[];

  private readonly state: AnimState;

  private mixFrame: number;

  private mixTime: number;

  private mixLength: number;

  public constructor(animations: FGTAnimation[]) {
    this.mixTime = 0;
    this.mixFrame = 0;
    this.mixLength = 0;
    this.tracks = animations;
    this.state = {
      from: 0,
      to: 1,
      speed: 0,
      time: 0,
      length: 1,
    };
  }

  public play(anim: Animation, transition: number = 0) {
    this.mixFrame = Math.floor(this.state.time) + this.state.from;
    this.mixTime = transition;
    this.mixLength = transition;

    const a = this.tracks[anim];
    this.state.from = a.start;
    this.state.to = a.start + a.length - 1;
    this.state.time = 0;
    this.state.length = a.length - 1;
    this.state.speed = a.fps / 80.0;
  }

  public update(delta: number) {
    this.updateTime(this.state, delta);
  }

  public getState() {
    if (this.mixTime > 0) {
      const alpha = 1.0 - this.mixTime / this.mixLength;
      const frame2 = this.state.from;
      const frame1 = this.mixFrame;

      return {
        frame1,
        frame2,
        alpha,
      };
    }
    const alpha = this.state.time % 1.0;
    const shift = Math.floor(this.state.time);
    const frame1 = shift + this.state.from;
    const frame2 = ((shift + 1) % this.state.length) + this.state.from;

    return {
      frame1,
      frame2,
      alpha,
    };
  }

  private updateTime(state: AnimState, delta: number) {
    if (this.mixTime > 0) {
      this.mixTime = Math.max(this.mixTime - delta, 0.0);
    } else {
      let t = state.time;
      t = (t + delta * state.speed) % state.length;
      state.time = t;
    }
  }
}
