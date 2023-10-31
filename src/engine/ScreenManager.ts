import { MenuScreen } from '../screens/MenuScreen.ts';
import { Screen } from './Screen.ts';
import { UI } from './UI.ts';

export class ScreenManager {
  private static screen: Screen | null = null;

  public static setScreen(screen: Screen) {
    this.screen = screen;
  }

  public static init() {
    Promise.all([
      UI.load(), //
    ]).then(() => {
      MenuScreen.startMenu();
      // GameOverScreen.startGameOver(1);
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
