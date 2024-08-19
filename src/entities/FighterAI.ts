import { ControlState } from '../engine/Controls.ts';
import { lerp, randomInt } from '../helpers/MathUtils.ts';
import { Fighter } from './Fighter.ts';

enum State {
  Idle,
  Blocking,
  PunchCombo,
  Kick,
  Flee,
}

enum PunchType {
  Head,
  Torso,
  Kick,
}

const PUNCH_QUOTA = [
  Fighter.JAB_HIGH_FATIGUE, //
  Fighter.JAB_LOW_FATIGUE,
  Fighter.KICK_FATIGUE,
];

export class FighterAI {
  private readonly fighter: Fighter;

  private readonly opponent: Fighter;

  private readonly combo: PunchType[][];

  private readonly difficulty: number;

  private timer: number;

  private state: State;

  private comboIndex: number;

  private comboStep: number;

  private comboShift: number;

  public get activeState() {
    return [
      ['Idle', 'Blocking', 'Punch', 'Kick', 'Flee'][this.state],
      this.timer.toFixed(1),
    ] as const;
  }

  public constructor(fighter: Fighter, opponent: Fighter, difficulty: number = 1) {
    this.fighter = fighter;
    this.opponent = opponent;
    this.difficulty = difficulty;
    this.state = State.Idle;
    this.timer = 0;
    this.comboIndex = 0;
    this.comboShift = 0;
    this.comboStep = 0;
    this.combo = [];
    console.debug(difficulty);

    this.reset();
  }

  public think(delta: number): ControlState {
    this.timer = Math.max(this.timer - 0.1 * delta, 0);
    switch (this.state) {
      case State.Idle:
        if (this.timer === 0) {
          this.state = this.makeAttackState();
        }
        break;
      case State.Blocking:
        if (this.timer === 0) {
          this.state = this.makeAttackState();
        }

        return this.block();

      case State.PunchCombo:
        if (!this.canReach()) {
          return this.move(1);
        }
        const combo = this.combo[this.comboIndex];
        if (this.timer === 0) {
          this.comboStep++;
          if (this.comboStep >= combo.length) {
            this.makeWaitState();
          } else {
            this.timer = [1.5, 2.3, 2.9][combo[(this.comboStep + this.comboShift) % combo.length]];
            if (Math.random() < lerp(0.3, 0.1, this.difficulty)) {
              this.makeWaitState();
            }
          }
        }

        return this.attack(combo[(this.comboStep + this.comboShift) % combo.length]);

      case State.Kick:
        if (!this.canReach()) {
          return this.move(1);
        }
        this.state = this.makeAttackState();

        break;
      case State.Flee:
        if (this.timer === 0 && !this.fighter.blockingFatigue) {
          this.state = this.makeAttackState();
        } else {
          return this.move(this.shouldFlee() ? -1 : 0);
        }
        break;
    }

    return {
      forward: false,
      back: false,
      block: false,
      punchHigh: false,
      punchMiddle: false,
      kick: false,
    };
  }

  public reset() {
    this.timer = this.idleTimer();
    this.state = State.Idle;

    this.combo.length = 0;

    for (let k = 0; k < 4; k++) {
      let quota = (4 - k) * 25;
      const punches: PunchType[] = [];

      while (true) {
        let punch: PunchType | null = null;
        if (
          Math.random() < lerp(0.1, 0.4, this.difficulty) &&
          quota > PUNCH_QUOTA[PunchType.Kick]
        ) {
          punch = PunchType.Kick;
          quota -= PUNCH_QUOTA[PunchType.Kick];
        } else if (
          Math.random() < lerp(0.4, 0.8, this.difficulty) &&
          quota > PUNCH_QUOTA[PunchType.Torso]
        ) {
          punch = PunchType.Torso;
          quota -= PUNCH_QUOTA[PunchType.Torso];
        } else if (quota > PUNCH_QUOTA[PunchType.Head]) {
          punch = PunchType.Head;
          quota -= PUNCH_QUOTA[PunchType.Head];
        }

        if (punch === null) {
          break;
        } else {
          punches.push(punch);
        }
      }

      this.combo.push(punches);
    }
  }

  private makeAttackState() {
    if (Math.random() > lerp(0.3, 0.1, this.difficulty)) {
      this.state = State.PunchCombo;

      const comboIndex = 3 - Math.floor(Math.min(100 - this.fighter.fatigue, 99) / 25);

      const combo = this.combo[comboIndex];
      this.comboIndex = comboIndex;
      this.comboStep = 0;
      this.comboShift = randomInt(combo.length - 1);
      this.timer = [1.5, 2.3, 2.9][combo[(this.comboStep + this.comboShift) % combo.length]];

      // }
    } else {
      if (Math.random() > lerp(0.8, 0.0, this.difficulty)) {
        this.state = State.Blocking;
      } else {
        this.state = State.Idle;
      }
      this.timer = this.idleTimer();
    }

    return this.state;
  }

  private makeWaitState() {
    this.timer = this.idleTimer();
    this.state = State.Idle;

    // 0.3 - сложно
    if (Math.random() > lerp(0.5, 0.1, this.difficulty)) {
      this.state = State.Flee;
      this.timer = randomInt(1, 6);
    }

    return this.state;
  }

  private act(buttons: Partial<ControlState>) {
    return {
      forward: false,
      back: false,
      block: false,
      punchHigh: false,
      punchMiddle: false,
      kick: false,
      ...buttons,
    };
  }

  private move(direction: -1 | 0 | 1 = 0): ControlState {
    return this.act({
      forward: direction === 1,
      back: direction === -1,
    });
  }

  private block(): ControlState {
    return this.act({
      block: true,
    });
  }

  private attack(type: PunchType): ControlState {
    return this.act({
      punchHigh: type === PunchType.Head,
      punchMiddle: type === PunchType.Torso,
      kick: type === PunchType.Kick,
    });
  }

  private idleTimer() {
    return lerp(randomInt(3, 12), randomInt(1, 4), this.difficulty);
  }

  private canReach() {
    return Math.abs(this.fighter.position - this.opponent.position) <= 3;
  }

  private shouldFlee() {
    return Math.abs(this.fighter.position - this.opponent.position) <= 7;
  }
}
