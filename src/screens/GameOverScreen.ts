import { FighterCache, FighterType } from '../cache/FighterCache.ts';
import { Audio } from '../engine/Audio.ts';
import { Camera } from '../engine/Camera.ts';
import { PointLight } from '../engine/PointLight.ts';
import { Renderer } from '../engine/Renderer.ts';
import { Screen } from '../engine/Screen.ts';
import { ScreenManager } from '../engine/ScreenManager.ts';
import { TextAlign, UI } from '../engine/UI.ts';
import { FighterMesh } from '../meshes/FighterMesh.ts';
import { GameScreen } from './GameScreen.ts';
import { LoadingScreen } from './LoadingScreen.ts';
import { MenuList } from './menus/MenuList.ts';
import { MenuScreen } from './MenuScreen.ts';
import StoryMusic from '@/assets/audio/music/monolog.mp3?url';

export class GameOverScreen extends Screen {
  private readonly lights: PointLight[];

  private readonly boxer: FighterMesh;

  private appear: number = 1;

  private exit: boolean = false;

  private exitRetry: boolean = false;

  private animTime: number;

  private readonly menuList: MenuList;

  public static startGameOver(retry: number) {
    ScreenManager.setScreen(
      new LoadingScreen(
        Promise.all([
          // LocationCache.preload(location), //
          FighterCache.preload(FighterType.Boxer),
          // Skybox.preload(),
        ]),
        () => {
          ScreenManager.setScreen(new GameOverScreen(retry));
        },
      ),
    );
  }

  public constructor(private readonly retryFight: number) {
    super();
    this.animTime = 0;
    this.menuList = new MenuList(
      [
        'Еще раз', //
        'В меню',
      ],
      (idx) => {
        if (!this.exit) {
          this.exitRetry = idx === 0;
          this.exit = true;
        }
      },
      1024 / 2 - 150,
      768 / 2,
      300,
    );

    Audio.setMusic(StoryMusic, 0.3);

    const fighterData = FighterCache.get(FighterType.Boxer);
    this.boxer = new FighterMesh(fighterData.mesh, fighterData.texture);
    this.boxer.setPosition(0, true);

    this.lights = [new PointLight([0, 3, 0], 10, [1, 1, 1])];
  }

  public update(delta: number): void {
    const startFrame = 310;
    const animLength = 110;
    this.animTime = (this.animTime + 0.04 * delta) % (Math.PI * 2);
    const ftime = (Math.sin(this.animTime) * 0.4 + 0.5) * animLength;
    const frame1 = Math.floor(ftime);
    const frame2 = (frame1 + 1) % animLength;
    const frameMix = ftime % 1;
    this.boxer.setFrame(frame1 + startFrame, frame2 + startFrame, frameMix);

    this.menuList.update(delta, !this.exit);

    Camera.lookAt([0, 3, 3], [2, -2, 0]);

    if (this.exit) {
      this.appear = Math.min(this.appear + 0.01 * delta, 1);
      if (this.appear === 1) {
        if (this.exitRetry) {
          GameScreen.startFight(0, this.retryFight + 1, this.retryFight, true, true, false);
        } else {
          MenuScreen.startMenu();
        }
      }
    } else {
      this.appear = Math.max(this.appear - 0.01 * delta, 0);
    }
  }

  public render(): void {
    Renderer.renderScene(
      () => {
        this.boxer.render();
      },
      this.lights,
      false,
      true,
    );
  }

  public renderUI(): void {
    Renderer.setupUI();
    UI.drawBox([0, 0, 0, 0.5], 1024 / 2 - 150, 0, 300, 768);
    UI.drawText(
      'ИГРА',
      1024 / 2,
      768 / 2 - 70,
      40,
      [1, 1, 1, 1],
      true,
      TextAlign.Middle,
      TextAlign.End,
    );
    UI.drawText(
      'ОКОНЧЕНА',
      1024 / 2,
      768 / 2 - 30,
      40,
      [1, 1, 1, 1],
      true,
      TextAlign.Middle,
      TextAlign.End,
    );
    this.menuList.render(1.0 - this.appear);
    UI.drawFade(this.appear);
  }
}
