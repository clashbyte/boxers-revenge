import { vec3, vec4 } from 'gl-matrix';
import Music1 from '../assets/audio/music/fight1.mp3?url';
import Music2 from '../assets/audio/music/fight2.mp3?url';
import { FIGHTER_NAMES, FighterCache, FighterType } from '../cache/FighterCache.ts';
import { LocationCache } from '../cache/LocationCache.ts';
import { SoundCache } from '../cache/SoundCache.ts';
import { SoundEnvCache } from '../cache/SoundEnvCache.ts';
import { LOCATION_LIGHTS } from '../defs/LocationLights.ts';
import { Audio, SoundChannel } from '../engine/Audio.ts';
import { Camera } from '../engine/Camera.ts';
import { Controls, ControlState } from '../engine/Controls.ts';
import { PointLight } from '../engine/PointLight.ts';
import { Renderer } from '../engine/Renderer.ts';
import { Screen } from '../engine/Screen.ts';
import { ScreenManager } from '../engine/ScreenManager.ts';
import { TextAlign, UI } from '../engine/UI.ts';
import { Fighter } from '../entities/Fighter.ts';
import { FighterAI } from '../entities/FighterAI.ts';
import { easeInOutCubic, easeInQuart, easeOutSine } from '../helpers/Easings.ts';
import { clamp, damp, invLerp, lerp } from '../helpers/MathUtils.ts';
import { SceneryMesh } from '../meshes/SceneryMesh.ts';
import { Skybox } from '../meshes/Skybox.ts';
import { GameOverScreen } from './GameOverScreen.ts';
import { LoadingScreen } from './LoadingScreen.ts';
import { MenuList } from './menus/MenuList.ts';
import { MenuScreen } from './MenuScreen.ts';
import { StoryScreen } from './StoryScreen.ts';

enum GameState {
  IntroVoice,
  IntroTransition,
  MatchTransition,
  Countdown,
  Game,
  End,
  PendingExit,
}

const INSTANT_START = false;

export class GameScreen extends Screen {
  private readonly fighter1: Fighter;

  private readonly fighter2: Fighter;

  private readonly location: SceneryMesh;

  private readonly fighter1AI: FighterAI | null;

  private readonly fighter2AI: FighterAI | null;

  private fighter1Wins: number = 0;

  private fighter2Wins: number = 0;

  private readonly lights: PointLight[];

  private readonly viewBob: number;

  private readonly viewPosition: vec3;

  private kickTime: number;

  private kickPower: number;

  private kickAngle: number;

  private blinkTimer: number;

  private stateTime: number;

  private state: GameState;

  private menuActive: boolean;

  private readonly menuList: MenuList;

  public static startFight(
    charIndex1: number,
    charIndex2: number,
    location: number,
    aiLevel: number,
    storyMode: boolean,
    sayLine: boolean,
  ) {
    ScreenManager.setScreen(
      new LoadingScreen(
        Promise.all([
          LocationCache.preload(location),
          FighterCache.preload(charIndex1, charIndex2),
          SoundCache.preload(),
          Skybox.preload(),
        ]),
        () => {
          ScreenManager.setScreen(
            new GameScreen(charIndex1, charIndex2, location, aiLevel, storyMode, !sayLine),
          );
        },
      ),
    );
  }

  public constructor(
    private readonly charIndex1: number,
    private readonly charIndex2: number,
    locationIndex: number,
    aiLevel: number = -1,
    private readonly storyMode: boolean = false,
    skipLine: boolean = false,
  ) {
    super();
    const char1Data = FighterCache.get(charIndex1);
    const char2Data = FighterCache.get(charIndex2);
    const locData = LocationCache.get(locationIndex);
    this.viewBob = 0;
    this.kickTime = 0;
    this.kickPower = 0;
    this.kickAngle = 0;
    this.blinkTimer = 0;
    this.menuActive = false;
    SoundEnvCache.setupForLevel();
    Audio.setMusic(locationIndex % 2 === 0 ? Music1 : Music2, 0.1);

    this.menuList = new MenuList(
      ['Продолжить', 'Выйти'],
      (index) => {
        if (index === 1) {
          MenuScreen.startMenu();
        } else {
          this.menuActive = false;
        }
      },
      1024 / 2 - 150,
      768 / 2,
      300,
    );

    this.fighter1 = new Fighter(
      char1Data.mesh,
      char1Data.texture,
      false,
      this,
      100,
      1,
      charIndex1 === FighterType.Woman,
    );
    this.fighter2 = new Fighter(
      char2Data.mesh,
      char2Data.texture,
      true,
      this,
      lerp(100, 200, aiLevel !== -1 ? aiLevel : 0),
      0.5,
      charIndex2 === FighterType.Woman,
    );
    this.location = new SceneryMesh(locData.mesh, locData.texture);

    this.lights = [new PointLight([0, 5, 5], 9, [1, 1, 1])];
    if (LOCATION_LIGHTS[locationIndex]) {
      for (const def of LOCATION_LIGHTS[locationIndex]) {
        this.lights.push(new PointLight(def.position, def.range, def.color));
      }
    }

    this.fighter1AI = null; // new FighterAI(this.fighter1, this.fighter2, 0);
    this.fighter2AI = aiLevel !== -1 ? new FighterAI(this.fighter2, this.fighter1, aiLevel) : null;

    if (INSTANT_START) {
      this.state = GameState.Game;
      this.stateTime = 1;
    } else if (storyMode && !skipLine) {
      this.state = GameState.IntroVoice;
      this.stateTime = 4;

      if (char2Data.voiceLine) {
        Audio.play(char2Data.voiceLine, SoundChannel.FX, 0.8, false, 1, 0);
      }
    } else {
      this.state = GameState.MatchTransition;
      this.stateTime = 2;
    }

    this.viewPosition = [0, 10, 10];
    this.viewBob = 0;
  }

  public update(realDelta: number): void {
    const delta = !this.menuActive ? realDelta : 0;
    let state1: ControlState | null = null;
    let state2: ControlState | null = null;

    this.stateTime = Math.max(this.stateTime - 0.016 * delta, 0);
    switch (this.state) {
      case GameState.IntroVoice:
        if (this.stateTime === 0) {
          this.state = GameState.IntroTransition;
          this.stateTime = 1.5;
        }
        break;
      case GameState.IntroTransition:
      case GameState.MatchTransition:
        if (this.stateTime === 0) {
          this.state = GameState.Countdown;
          this.stateTime = 3;
        }
        break;
      case GameState.Countdown:
        if (this.stateTime === 0) {
          this.state = GameState.Game;
          this.stateTime = 1;
        }
        break;
      case GameState.Game:
        if (this.fighter1.health === 0 || this.fighter2.health === 0) {
          this.state = GameState.End;
          this.stateTime = 7;
          if (this.fighter1.health === 0) {
            this.fighter2Wins++;
          } else {
            this.fighter1Wins++;
          }
        }
        break;
      case GameState.End:
        if (this.stateTime === 0) {
          if (this.fighter1Wins === 2 || this.fighter2Wins === 2) {
            if (this.storyMode) {
              if (this.fighter1.health > 0) {
                StoryScreen.startStory(this.charIndex2);
              } else {
                GameOverScreen.startGameOver(this.charIndex2 - 1);
              }
            } else {
              MenuScreen.startMenu();
            }
            this.state = GameState.PendingExit;
          } else {
            this.reset();
            this.state = GameState.MatchTransition;
            this.stateTime = 2;
          }
        }
        break;
    }

    if (this.state === GameState.Game && !this.menuActive) {
      state1 = this.fighter1AI?.think(delta) ?? Controls.getState();
      state2 = this.fighter2AI?.think(delta) ?? null;
    }

    if (!this.menuActive) {
      this.fighter1.update(delta, state1, this.fighter2);
      this.fighter2.update(delta, state2, this.fighter1);
    }

    const distance = clamp(Math.abs(this.fighter1.position - this.fighter2.position), 7, 9);
    const center = (this.fighter1.position + this.fighter2.position) / 2.0;
    const cameraTarget = vec3.fromValues(center, 1.5, distance);

    this.viewPosition[0] = damp(this.viewPosition[0], cameraTarget[0], 0.1, delta);
    this.viewPosition[1] = damp(this.viewPosition[1], cameraTarget[1], 0.1, delta);
    this.viewPosition[2] = damp(this.viewPosition[2], cameraTarget[2], 0.1, delta);

    this.lights[0].position = vec3.fromValues(center, 5, 5);

    if (this.kickTime > 0) {
      this.kickTime = Math.max(this.kickTime - 0.02 * delta);
    }
    const kick = Math.sin(this.kickTime * Math.PI * 2) * this.kickTime ** 2;
    const kickX = Math.cos(this.kickAngle) * kick * this.kickPower;
    const kickY = Math.sin(this.kickAngle) * kick * this.kickPower;

    this.blinkTimer = (this.blinkTimer + 0.1 * delta) % (Math.PI * 2);

    const viewPos = vec3.clone(this.viewPosition);
    const viewAngle = vec3.fromValues(
      -5 + //
        Math.sin(this.viewBob * 2) * 0.2 + //
        kickX,
      Math.sin(this.viewBob) * 0.4 -
        (Math.atan2(cameraTarget[0] - this.viewPosition[0], distance * 2) * 180) / Math.PI +
        kickY,
      0,
    );

    if ([GameState.IntroVoice, GameState.IntroTransition].includes(this.state)) {
      const promoLerp =
        this.state === GameState.IntroTransition ? easeInOutCubic(1.0 - this.stateTime / 1.5) : 0;

      const promoPos = vec3.fromValues(-0.5, 1.2, 0.5);
      const promoAngle = vec3.fromValues(-5, -73, 0);
      vec3.lerp(viewPos, promoPos, viewPos, promoLerp);
      vec3.lerp(viewAngle, promoAngle, viewAngle, promoLerp);
    }

    Camera.position = viewPos;
    Camera.rotation = viewAngle;

    if (
      Controls.keyHit('Escape') &&
      (this.menuActive || (!this.menuActive && this.state === GameState.Game))
    ) {
      this.menuActive = !this.menuActive;
      if (this.menuActive) {
        this.menuList.reset();
      }
    }
    if (this.menuActive) {
      this.menuList.update(realDelta, true);
    }
  }

  public render(): void {
    // return;
    Renderer.renderScene(() => {
      this.fighter1.render();
      this.fighter2.render();
      this.location.render();
    }, this.lights);
  }

  public renderUI(): void {
    Renderer.setupUI();
    let uiOff = 0;
    if (
      this.state === GameState.IntroVoice ||
      this.state === GameState.IntroTransition ||
      this.state === GameState.MatchTransition
    ) {
      uiOff = 1;
    } else if (this.state === GameState.Countdown) {
      uiOff = easeInQuart(clamp(this.stateTime - 2, 0, 1));
    }

    // Health bars
    const hOff = -300 * uiOff;
    const f1health = (400 * this.fighter1.health) / this.fighter1.maxHealth;
    UI.drawBox([0, 0.5, 0, 1], 16, 32 + hOff, f1health, 32, 100);
    UI.drawBox([0.6, 0.6, 0.6, 1], 16, 32 + hOff, 400, 32, 1);

    const f2health = (400 * this.fighter2.health) / this.fighter2.maxHealth;
    UI.drawBox([0, 0.5, 0, 1], 1008 - f2health, 32 + hOff, f2health, 32, 100);
    UI.drawBox([0.6, 0.6, 0.6, 1], 608, 32 + hOff, 400, 32, 1);

    // Fatigue bars
    const fOff = 200 * uiOff;
    const f1fatigue = (254 * this.fighter1.fatigue) / 100;
    UI.drawBox([0.5, 0, 0, 1], 17, 721 + fOff, f1fatigue, 14, 100);
    UI.drawBox([0.6, 0.6, 0.6, 1], 16, 720 + fOff, 256, 16, 1);

    const f2fatigue = (254 * this.fighter2.fatigue) / 100;
    UI.drawBox([0.5, 0, 0, 1], 1008 - f2fatigue, 721 + fOff, f2fatigue, 14, 100);
    UI.drawBox([0.6, 0.6, 0.6, 1], 752, 720 + fOff, 256, 16, 1);

    // Names
    const f1name = FIGHTER_NAMES[this.charIndex1];
    const f2name = FIGHTER_NAMES[this.charIndex2];
    UI.drawText(f1name, 28, 48 + hOff, 15, [1, 1, 1, 1], true, TextAlign.Start, TextAlign.Middle);
    UI.drawText(f2name, 994, 48 + hOff, 15, [1, 1, 1, 1], true, TextAlign.End, TextAlign.Middle);

    // Total fatigue
    const blinkColor = vec4.fromValues(1, 1, 1, Math.abs(Math.sin(this.blinkTimer)) * 0.6 + 0.2);
    if (this.fighter1.blockingFatigue) {
      UI.drawText('Выдохся!', 16, 715 + fOff, 15, blinkColor, true, TextAlign.Start, TextAlign.End);
    }
    if (this.fighter2.blockingFatigue) {
      UI.drawText('Выдохся!', 1008, 715 + fOff, 15, blinkColor, true, TextAlign.End, TextAlign.End);
    }
    if (this.fighter2AI) {
      // const [state, fatigue] = this.fighter2AI.activeState;
      // UI.drawText(state, 1008, 80, 14, [0.7, 0.7, 0.7, 1], false, TextAlign.End, TextAlign.Start);
      // UI.drawText(fatigue, 1008, 98, 14, [0.7, 0.7, 0.7, 1], false, TextAlign.End, TextAlign.Start);
    }

    switch (this.state) {
      case GameState.IntroVoice:
        const introA = invLerp(this.stateTime, 0, 1) * invLerp(this.stateTime, 3, 2.5);
        UI.drawText(
          FIGHTER_NAMES[this.charIndex2],
          1024 / 2,
          768 - 32,
          60,
          [1, 1, 1, easeOutSine(introA)],
          true,
          TextAlign.Middle,
          TextAlign.End,
        );
        UI.drawFade(invLerp(this.stateTime, 3, 4));
        break;
      case GameState.MatchTransition:
        UI.drawFade(invLerp(this.stateTime, 1, 2));
        UI.drawText(
          `Раунд ${this.fighter1Wins + this.fighter2Wins + 1}`,
          1024 / 2,
          768 / 2,
          100,
          [1, 1, 1, easeOutSine(this.stateTime)],
          true,
          TextAlign.Middle,
          TextAlign.Middle,
        );
        break;
      case GameState.Countdown:
        const dtime = this.stateTime % 1.0;
        UI.drawText(
          Math.ceil(this.stateTime).toString(),
          1024 / 2,
          768 / 2,
          120 - 20 * dtime,
          [1, 1, 1, easeOutSine(dtime)],
          true,
          TextAlign.Middle,
          TextAlign.Middle,
        );
        break;
      case GameState.Game:
        UI.drawText(
          'БОЙ!',
          1024 / 2,
          768 / 2,
          120 - 20 * this.stateTime,
          [1, 1, 1, easeOutSine(this.stateTime)],
          true,
          TextAlign.Middle,
          TextAlign.Middle,
        );
        break;
      case GameState.End:
        const outroA = invLerp(this.stateTime, 6, 5);
        const outroB = invLerp(this.stateTime, 2, 0);
        const winner = this.fighter2.health === 0 ? this.charIndex1 : this.charIndex2;
        UI.drawText(
          FIGHTER_NAMES[winner],
          1024 / 2,
          768 / 2,
          100,
          [1, 1, 1, easeOutSine(outroA)],
          true,
          TextAlign.Middle,
          TextAlign.End,
        );
        UI.drawText(
          winner === FighterType.Woman ? 'победила' : 'победил',
          1024 / 2,
          768 / 2,
          50,
          [1, 1, 1, easeOutSine(outroA)],
          true,
          TextAlign.Middle,
          TextAlign.Start,
        );
        UI.drawFade(outroB);
        break;
    }

    if (this.menuActive) {
      UI.drawBox([0, 0, 0, 0.5], 1024 / 2 - 150, 0, 300, 768);
      UI.drawText(
        'Пауза',
        1024 / 2,
        768 / 2 - 30,
        30,
        [1, 1, 1, 1],
        true,
        TextAlign.Middle,
        TextAlign.End,
      );
      this.menuList.render(1);
    }
  }

  public kickView(right: boolean, power: number) {
    this.kickAngle = Math.PI * 0.5 + lerp(-1, 1, Math.random()) * 0.3 + (right ? Math.PI : 0);
    this.kickPower = power;
    this.kickTime = 1;
  }

  private reset() {
    this.kickTime = 0;
    this.kickPower = 0;
    this.kickAngle = 0;
    this.blinkTimer = 0;
    vec3.set(this.viewPosition, 0, 4, 12);

    this.fighter1.reset();
    this.fighter2.reset();
    this.fighter1AI?.reset();
    this.fighter2AI?.reset();
  }
}
