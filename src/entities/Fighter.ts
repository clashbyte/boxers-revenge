import { SoundCache, SoundType } from '../cache/SoundCache.ts';
import { Audio, SoundChannel } from '../engine/Audio.ts';
import { ControlState } from '../engine/Controls.ts';
import { FGTModel } from '../helpers/decodeFGT.ts';
import { clamp, damp, lerp } from '../helpers/MathUtils.ts';
import { Animation, FighterAnimator } from '../meshes/FighterAnimator.ts';
import { FighterMesh } from '../meshes/FighterMesh.ts';
import { GameScreen } from '../screens/GameScreen.ts';

export const ATTACK_STATES = [
  Animation.HighJabL,
  Animation.HighJabR,
  Animation.MiddleJabL,
  Animation.MiddleJabR,
  Animation.KickL,
  Animation.KickR,
];

export class Fighter {
  public static readonly JAB_HIGH_POWER = 3;

  public static readonly JAB_LOW_POWER = 6;

  public static readonly KICK_POWER = 10;

  public static readonly JAB_HIGH_FATIGUE = 15;

  public static readonly JAB_LOW_FATIGUE = 20;

  public static readonly KICK_FATIGUE = 30;

  private readonly MOVE_SPEED = 0.03;

  private readonly screen: GameScreen;

  private readonly mesh: FighterMesh;

  private readonly animator: FighterAnimator;

  private readonly opposite: boolean;

  private localPosition: number;

  private delay: number;

  private state: Animation;

  private movement: number;

  private punchSide: boolean;

  private damageAt: number | null;

  private damageValue: number;

  private localHealth: number;

  private localFatigue: number;

  private readonly maxHealth: number;

  private fatigueDecreasing: boolean;

  private stepTimer: number;

  public get health() {
    return this.localHealth;
  }

  public get fatigue() {
    return this.localFatigue;
  }

  public get blockingFatigue() {
    return this.fatigueDecreasing;
  }

  public get position() {
    return this.localPosition;
  }

  public constructor(
    mesh: FGTModel,
    texture: WebGLTexture,
    opposite: boolean,
    screen: GameScreen,
    health: number = 100,
    private readonly kickFactor: number = 1.0,
  ) {
    this.screen = screen;
    this.mesh = new FighterMesh(mesh, texture);
    this.animator = new FighterAnimator(mesh.animations);
    this.animator.play(Animation.Idle);
    this.opposite = opposite;
    this.localPosition = (opposite ? 1 : -1) * 2.5;
    this.state = Animation.Idle;
    this.movement = 0;
    this.delay = 0;
    this.punchSide = false;
    this.damageValue = 0;
    this.damageAt = null;
    this.localHealth = health;
    this.maxHealth = health;
    this.localFatigue = 0;
    this.fatigueDecreasing = false;
    this.stepTimer = 0;

    this.mesh.setPosition(this.localPosition, this.opposite);
  }

  public update(delta: number, controls: ControlState | null, opponent: Fighter) {
    // Update state machine
    this.stepTimer = Math.max(this.stepTimer - delta, 0);
    if (this.delay > 0) {
      this.delay = Math.max(this.delay - delta, 0);
      if (this.damageAt !== null && this.delay <= this.damageAt) {
        this.damageAt = null;
        const hitDist = Math.abs(this.position - opponent.position);
        if (hitDist <= 3) {
          opponent.damage(this.damageValue);
        }
      }
    } else {
      let targetState: Animation = this.state;
      if (this.health === 0) {
        if (targetState !== Animation.LoseStance) {
          Audio.play(SoundCache.get(SoundType.BodyDrop), SoundChannel.FX, 1, false, 1, 0, [
            this.localPosition,
            0.1,
            0,
          ]);
          targetState = Animation.LoseStance;
        }
      } else if (opponent.health === 0) {
        targetState = Animation.WinStance;
      } else {
        switch (this.state) {
          case Animation.HighJabL:
          case Animation.MiddleJabL:
          case Animation.HighJabR:
          case Animation.MiddleJabR:
          case Animation.KickL:
          case Animation.KickR:
            targetState = Animation.Idle;
            break;

          case Animation.Hit:
            targetState = Animation.Idle;
            break;

          case Animation.Idle:
          case Animation.MoveForward:
          case Animation.MoveBack:
            if (this.state !== Animation.Idle) {
              if (this.stepTimer === 0) {
                Audio.play(
                  SoundCache.get(SoundType.Step),
                  SoundChannel.FX,
                  0.5,
                  false,
                  lerp(0.6, 0.9, Math.random()),
                  0,
                  [this.localPosition, 0.1, 0],
                );
                this.stepTimer = 24;
              }
            }

            targetState = Animation.Idle;
            if (controls) {
              if (controls.block) {
                targetState = Animation.Block;
              } else if (controls.punchHigh && !this.fatigueDecreasing) {
                targetState = this.punchSide ? Animation.HighJabR : Animation.HighJabL;
                this.addFatigue(Fighter.JAB_HIGH_FATIGUE);
                this.punchSide = !this.punchSide;

                Audio.play(
                  SoundCache.get(SoundType.Whoosh),
                  SoundChannel.FX,
                  0.5,
                  false,
                  lerp(1.2, 1.4, Math.random()),
                  0,
                  [this.localPosition, 0.1, 0],
                );
              } else if (controls.punchMiddle && !this.fatigueDecreasing) {
                targetState = this.punchSide ? Animation.MiddleJabR : Animation.MiddleJabL;
                this.addFatigue(Fighter.JAB_LOW_FATIGUE);
                this.punchSide = !this.punchSide;

                Audio.play(
                  SoundCache.get(SoundType.Whoosh),
                  SoundChannel.FX,
                  1,
                  false,
                  lerp(1, 1.2, Math.random()),
                  0,
                  [this.localPosition, 0.1, 0],
                );
              } else if (controls.kick && !this.fatigueDecreasing) {
                targetState = this.punchSide ? Animation.KickR : Animation.KickL;
                this.addFatigue(Fighter.KICK_FATIGUE);
                this.punchSide = !this.punchSide;

                Audio.play(
                  SoundCache.get(SoundType.Whoosh),
                  SoundChannel.FX,
                  1,
                  false,
                  lerp(0.8, 1, Math.random()),
                  0,
                  [this.localPosition, 0.1, 0],
                );
              } else if (controls.forward && this.state !== Animation.MoveBack) {
                targetState = Animation.MoveForward;
                if (this.state !== Animation.MoveForward) {
                  this.stepTimer = 8;
                }
              } else if (controls.back && this.state !== Animation.MoveForward) {
                targetState = Animation.MoveBack;
                if (this.state !== Animation.MoveBack) {
                  this.stepTimer = 8;
                }
              }
            }
            break;

          case Animation.Block:
            if (!controls || !controls.block) {
              targetState = Animation.Idle;
            }
            break;
        }
      }

      if (this.state !== targetState) {
        let delay = 0;
        let transition = 0;
        this.damageValue = 0;
        this.damageAt = null;
        switch (targetState) {
          case Animation.Idle:
            delay = 2;
            transition = 4;
            break;

          case Animation.HighJabR:
          case Animation.HighJabL:
            this.damageAt = 10;
            this.damageValue = Fighter.JAB_HIGH_POWER;
            delay = 14;
            transition = 0;
            break;

          case Animation.MiddleJabR:
          case Animation.MiddleJabL:
            this.damageAt = 10;
            this.damageValue = Fighter.JAB_LOW_POWER;
            delay = 22;
            transition = 0;
            break;

          case Animation.KickL:
          case Animation.KickR:
            this.damageAt = 10;
            this.damageValue = Fighter.KICK_POWER;
            delay = 28;
            transition = 0;
            break;

          case Animation.MoveForward:
          case Animation.MoveBack:
            transition = 2;
            delay = 1;
            break;

          case Animation.Block:
            transition = 4;
            delay = 4;
            break;

          case Animation.WinStance:
          case Animation.LoseStance:
            transition = 5;
            break;
        }

        this.delay = delay;
        this.state = targetState;
        this.animator.play(this.state, transition);
      }
    }

    if (!ATTACK_STATES.includes(this.state)) {
      this.localFatigue = Math.max(this.localFatigue - delta * 0.5, 0);
      if (this.localFatigue <= 40) {
        this.fatigueDecreasing = false;
      }
    }

    let targetSpeed = 0;
    if (this.state === Animation.MoveBack) {
      targetSpeed = -1;
    } else if (this.state === Animation.MoveForward) {
      targetSpeed = 1;
    }

    this.movement = damp(
      this.movement,
      targetSpeed * this.MOVE_SPEED * (this.opposite ? -1 : 1),
      0.2,
      delta,
    );

    // Wrap position
    let min = -11.5;
    let max = 11.5;
    if (this.state === Animation.LoseStance) {
      if (this.localPosition < -9) {
        this.localPosition += 0.08 * delta;
      } else if (this.localPosition > 9) {
        this.localPosition -= 0.08 * delta;
      }
    } else if (this.state !== Animation.WinStance) {
      if (this.opposite) {
        min = opponent.position + 2.5;
        max = Math.min(opponent.position + 10, max);
      } else {
        min = Math.max(opponent.position - 10, min);
        max = opponent.position - 2.5;
      }
      this.localPosition = clamp(this.localPosition + this.movement, min, max);
    }

    // Update animations
    this.animator.update(delta);
    const anim = this.animator.getState();
    this.mesh.setFrame(anim.frame1, anim.frame2, anim.alpha);
    this.mesh.setPosition(this.localPosition, this.opposite);
  }

  public render() {
    this.mesh.render();
  }

  public reset() {
    this.animator.play(Animation.Idle);
    this.localPosition = (this.opposite ? 1 : -1) * 2.5;
    this.state = Animation.Idle;
    this.movement = 0;
    this.delay = 0;
    this.punchSide = false;
    this.damageValue = 0;
    this.damageAt = null;
    this.localHealth = this.maxHealth;
    this.localFatigue = 0;
    this.fatigueDecreasing = false;

    this.mesh.setPosition(this.localPosition, this.opposite);
  }

  public damage(value: number) {
    this.localHealth = Math.max(
      this.localHealth - (this.state === Animation.Block ? value * 0.2 : value),
      0,
    );
    this.damageAt = null;
    this.damageValue = 0;
    let needGrunt = false;

    if (this.localHealth > 0) {
      if (this.state !== Animation.Block) {
        this.state = Animation.Hit;
        this.delay = 28;
        this.animator.play(Animation.Hit, 0);
        if (Math.random() < 0.2) {
          needGrunt = true;
        }

        this.screen.kickView(!this.opposite, value * 0.3 * this.kickFactor);
      } else {
        this.movement = 0.05 * (this.opposite ? 1 : -1);
        this.screen.kickView(!this.opposite, this.kickFactor);
      }
    } else {
      needGrunt = true;
      Audio.play(SoundCache.get(SoundType.BodyDrop), SoundChannel.FX, 1, false, 0.8, 0, [
        this.localPosition,
        0.1,
        0,
      ]);
      this.state = Animation.LoseStance;
      this.delay = 0;
      this.animator.play(Animation.LoseStance, 5);
      this.screen.kickView(!this.opposite, 4.0);
    }

    Audio.play(
      SoundCache.get(SoundType.Hit),
      SoundChannel.FX,
      1,
      false,
      lerp(0.6, 0.9, Math.random()),
      0,
      [this.localPosition, 0.1, 0],
    );

    if (needGrunt) {
      Audio.play(
        SoundCache.get(SoundType.PainMale),
        SoundChannel.FX,
        0.8,
        false,
        lerp(0.8, 1.0, Math.random()),
        0,
        [this.localPosition, 0.1, 0],
      );
    }
  }

  private addFatigue(value: number) {
    this.localFatigue = Math.min(this.localFatigue + value, 100);
    if (this.localFatigue === 100) {
      this.fatigueDecreasing = true;
    }
  }
}
