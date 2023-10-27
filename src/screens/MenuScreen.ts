import { LOCATION_LIGHTS, LocationCache } from '../cache/LocationCache.ts';
import { Camera } from '../engine/Camera.ts';
import { PointLight } from '../engine/PointLight.ts';
import { Renderer } from '../engine/Renderer.ts';
import { Screen } from '../engine/Screen.ts';
import { ScreenManager } from '../engine/ScreenManager.ts';
import { SceneryMesh } from '../meshes/SceneryMesh.ts';
import { LoadingScreen } from './LoadingScreen.ts';

export class MenuScreen extends Screen {
  private readonly lights: PointLight[];

  private readonly location: SceneryMesh;

  public static startMenu() {
    const location = 2; // Math.floor(Math.random() * 7);

    ScreenManager.setScreen(
      new LoadingScreen(Promise.all([LocationCache.preload(location)]), () => {
        ScreenManager.setScreen(new MenuScreen(location));
      }),
    );
  }

  public constructor(locationIndex: number) {
    super();
    const locData = LocationCache.get(locationIndex);
    this.location = new SceneryMesh(locData.mesh, locData.texture);

    this.lights = [];
    if (LOCATION_LIGHTS[locationIndex]) {
      for (const def of LOCATION_LIGHTS[locationIndex]) {
        this.lights.push(new PointLight(def.position, def.range, def.color));
      }
    }
  }

  public update(): void {
    Camera.lookAt([0, 2, 8], [0, 0, -10]);
  }

  public render(): void {
    Renderer.renderScene(() => {
      this.location.render();
    }, this.lights);
  }

  public renderUI(): void {}
}
