import { ZstdInit } from '@oneidentity/zstd-js/wasm/decompress';
import { Screen } from './Screen.ts';
import { UI } from './UI.ts';
import { Camera } from '@/engine/Camera.ts';
import { screenSize } from '@/GL.ts';
import { MenuScreen } from '@/screens/MenuScreen.ts';

export class ScreenManager {
  private static screen: Screen | null = null;

  public static setScreen(screen: Screen) {
    this.screen = screen;
  }

  public static init() {
    Promise.all([
      UI.load(), //
      ZstdInit(),
    ]).then(() => {
      Camera.updateProjection(screenSize[0] / screenSize[1]);
      MenuScreen.startMenu();
      // GameOverScreen.startGameOver(1);
      // GameScreen.startFight(0, 7, 6, 0, true, true);
      // StoryScreen.startStory(0);
    });
  }

  public static update(delta: number) {
    if (this.screen) {
      this.screen.update(delta);
    }
  }

  public static render() {
    if (this.screen) {
      this.screen.render();
    }
    if (this.screen) {
      this.screen.renderUI();
    }
  }
}
