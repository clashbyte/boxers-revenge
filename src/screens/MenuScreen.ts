import { vec3 } from 'gl-matrix';
import MenuMusic from '../assets/audio/music/menu.mp3?url';
import { FighterCache, FighterType } from '../cache/FighterCache.ts';
import { LocationCache } from '../cache/LocationCache.ts';
import { LOCATION_LIGHTS } from '../defs/LocationLights.ts';
import { LOCATION_POINTS } from '../defs/LocationPoints.ts';
import { Audio, SoundChannel } from '../engine/Audio.ts';
import { Camera } from '../engine/Camera.ts';
import { Controls } from '../engine/Controls.ts';
import { PointLight } from '../engine/PointLight.ts';
import { Renderer } from '../engine/Renderer.ts';
import { Screen } from '../engine/Screen.ts';
import { ScreenManager } from '../engine/ScreenManager.ts';
import { UI } from '../engine/UI.ts';
import { easeOutQuart } from '../helpers/Easings.ts';
import { damp } from '../helpers/MathUtils.ts';
import { Animation, FighterAnimator } from '../meshes/FighterAnimator.ts';
import { FighterMesh } from '../meshes/FighterMesh.ts';
import { SceneryMesh } from '../meshes/SceneryMesh.ts';
import { Skybox } from '../meshes/Skybox.ts';
import { LoadingScreen } from './LoadingScreen.ts';
import { CareerMenu } from './menus/CareerMenu.ts';
import { MainMenu } from './menus/MainMenu.ts';
import { Menu, MenuType } from './menus/Menu.ts';
import { SoundCache, SoundType } from '@/cache/SoundCache.ts';

export class MenuScreen extends Screen {
  private readonly screens: Menu[];

  private readonly lights: PointLight[];

  private readonly location: SceneryMesh;

  private readonly boxer: FighterMesh;

  private readonly boxerAnimator: FighterAnimator;

  private appear: number = 0;

  private entry: number = 0;

  private menu: number = 0;

  private targetMenu: number | null = null;

  private readonly camPos: vec3;

  private readonly camTarget: vec3;

  public static startMenu() {
    const location = Math.floor(Math.random() * 7);

    ScreenManager.setScreen(
      new LoadingScreen(
        Promise.all([
          LocationCache.preload(location), //
          FighterCache.preload(FighterType.Boxer),
          Skybox.preload(),
          SoundCache.preload(),
        ]),
        () => {
          ScreenManager.setScreen(new MenuScreen(location));
        },
      ),
    );
  }

  public constructor(private readonly locationIndex: number) {
    super();
    const locData = LocationCache.get(locationIndex);
    this.location = new SceneryMesh(locData.mesh, locData.texture);
    Audio.setMusic(MenuMusic, 0.2);

    const fighterData = FighterCache.get(FighterType.Boxer);
    this.boxer = new FighterMesh(fighterData.mesh, fighterData.texture);
    this.boxer.setPosition(0.8, -75);

    this.boxerAnimator = new FighterAnimator(fighterData.mesh.animations);
    this.boxerAnimator.play(Animation.Idle);

    this.lights = [new PointLight([-1, 2, 8], 10, [1, 1, 1])];
    if (LOCATION_LIGHTS[locationIndex]) {
      for (const def of LOCATION_LIGHTS[locationIndex]) {
        this.lights.push(new PointLight(def.position, def.range, def.color));
      }
    }

    this.camPos = vec3.clone(LOCATION_POINTS[locationIndex][0].point);
    this.camTarget = vec3.clone(LOCATION_POINTS[locationIndex][0].target);

    this.changeScreen = this.changeScreen.bind(this);
    this.screens = [
      new MainMenu(this.changeScreen), //
      new CareerMenu(this.changeScreen),
    ];
  }

  public update(delta: number): void {
    this.entry = Math.min(this.entry + 0.02 * delta, 1);
    if (this.targetMenu !== null) {
      this.appear = Math.max(this.appear - 0.1 * delta, 0);
      if (this.appear === 0) {
        this.menu = this.targetMenu;
        this.targetMenu = null;
        if (this.menu !== MenuType.Main) {
          this.screens[this.menu]?.reset();
        }
      }
    } else {
      this.appear = Math.min(this.appear + 0.1 * delta, 1);
    }

    if (this.menu !== MenuType.Main && this.targetMenu === null) {
      if (Controls.keyHit('Escape')) {
        this.targetMenu = MenuType.Main;

        Audio.play(SoundCache.get(SoundType.MenuBack), SoundChannel.UI, 1);
      }
    }

    if (this.screens[this.menu]) {
      this.screens[this.menu].update(delta, this.appear === 1);
    }

    this.boxerAnimator.update(delta);
    const animState = this.boxerAnimator.getState();
    this.boxer.setFrame(animState.frame1, animState.frame2, animState.alpha);

    const camPoint =
      LOCATION_POINTS[this.locationIndex][this.targetMenu !== null ? this.targetMenu : this.menu] ??
      null;
    if (camPoint) {
      this.dampVector(this.camPos, camPoint.point, 0.08, delta);
      this.dampVector(this.camTarget, camPoint.target, 0.08, delta);
    }

    const pos = vec3.clone(this.camPos);
    const targ = vec3.clone(this.camTarget);
    if (this.entry < 1) {
      const factor = easeOutQuart(this.entry);
      vec3.lerp(pos, [0, 2, 6], pos, factor);
      vec3.lerp(targ, [0, 5, -1], targ, factor);
    }

    Camera.lookAt(pos, targ);
  }

  public render(): void {
    Renderer.renderScene(() => {
      this.location.render();
      this.boxer.render();
    }, this.lights);
  }

  public renderUI(): void {
    Renderer.setupUI();
    if (this.screens[this.menu]) {
      this.screens[this.menu].render(this.appear * this.entry);
    }
    UI.drawFade(1.0 - this.entry);
  }

  private changeScreen(index: MenuType) {
    if (index !== this.menu && index !== this.targetMenu) {
      this.targetMenu = index;
    }
  }

  private dampVector(out: vec3, to: vec3, lambda: number, delta: number) {
    out[0] = damp(out[0], to[0], lambda, delta);
    out[1] = damp(out[1], to[1], lambda, delta);
    out[2] = damp(out[2], to[2], lambda, delta);
  }
}
