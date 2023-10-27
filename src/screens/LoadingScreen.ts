import { Screen } from '../engine/Screen.ts';
import { TextAlign, UI } from '../engine/UI.ts';
import { GL } from '../GL.ts';

export class LoadingScreen extends Screen {
  public constructor(promise: Promise<any>, onReady: () => void) {
    super();
    promise.then(() => onReady());
  }

  public update(): void {}

  public render(): void {}

  public renderUI(): void {
    GL.clearColor(0, 0, 0, 1);
    GL.clear(GL.COLOR_BUFFER_BIT);
    UI.drawText(
      'Загрузка...',
      1024 / 2,
      760,
      20,
      [1, 1, 1, 1],
      false,
      TextAlign.Middle,
      TextAlign.End,
    );
  }
}
