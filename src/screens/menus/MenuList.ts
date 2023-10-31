import { Controls } from '../../engine/Controls.ts';
import { TextAlign, UI } from '../../engine/UI.ts';
import { damp, euclideanModulo, saturate } from '../../helpers/MathUtils.ts';

type MenuItem = string | [string, string] | null;

export class MenuList {
  private readonly items: MenuItem[];

  private index: number;

  private visualIndex: number;

  public constructor(
    items: MenuItem[],
    private readonly onSelect: (index: number, side: number) => void,
    private readonly startX: number,
    private readonly startY: number,
    private readonly width: number,
  ) {
    this.index = 0;
    this.visualIndex = 0;
    this.items = [...items];
  }

  public setItems(items: MenuItem[]) {
    this.items.length = 0;
    this.items.push(...items);
    if (this.index >= this.items.length) {
      this.index = this.items.length - 1;
    }
  }

  public reset() {
    this.index = 0;
    this.visualIndex = 0;
  }

  public update(delta: number, active: boolean) {
    let pos = this.index;
    if (active) {
      const item = this.items[this.index];
      if (item !== null) {
        let click = null;
        if (typeof item === 'string') {
          if (Controls.keyHit('Enter') || Controls.keyHit('Space')) {
            click = 0;
          }
        } else if (Controls.keyHit('ArrowLeft') || Controls.keyHit('KeyA')) {
          click = -1;
        } else if (
          Controls.keyHit('ArrowRight') ||
          Controls.keyHit('KeyD') ||
          Controls.keyHit('Enter') ||
          Controls.keyHit('Space')
        ) {
          click = 1;
        }
        if (click !== null) {
          this.onSelect(this.index, click);
        }
      }

      if (Controls.keyHit('KeyW') || Controls.keyHit('ArrowUp')) {
        for (let i = 1; i < this.items.length; i++) {
          const idx = euclideanModulo(this.index - i, this.items.length);
          if (this.items[idx] !== null) {
            pos = idx;
            break;
          }
        }
      }
      if (Controls.keyHit('KeyS') || Controls.keyHit('ArrowDown')) {
        for (let i = 1; i < this.items.length; i++) {
          const idx = euclideanModulo(this.index + i, this.items.length);
          if (this.items[idx] !== null) {
            pos = idx;
            break;
          }
        }
      }
    }
    if (pos !== this.index) {
      this.index = pos;
    }

    this.visualIndex = damp(this.visualIndex, this.index, 0.3, delta);
  }

  public render(opacity: number) {
    const size = 40;
    const font = 24;
    const fontSub = 20;

    UI.drawBox(
      [1, 1, 1, opacity],
      this.startX,
      this.startY + size * this.visualIndex,
      this.width,
      size,
    );

    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];

      if (item !== null) {
        const accent = saturate(Math.abs(this.visualIndex - i));
        if (typeof item === 'string') {
          UI.drawText(
            item,
            this.startX + this.width * 0.5,
            this.startY + size * 0.5 + size * i,
            font,
            [accent, accent, accent, opacity],
            true,
            TextAlign.Middle,
            TextAlign.Middle,
          );
        } else {
          UI.drawText(
            item[0],
            this.startX + 10,
            this.startY + size * 0.5 + size * i,
            fontSub,
            [accent, accent, accent, opacity],
            true,
            TextAlign.Start,
            TextAlign.Middle,
          );
          UI.drawText(
            item[1],
            this.startX + this.width - 10,
            this.startY + size * 0.5 + size * i,
            fontSub,
            [accent, accent, accent, opacity],
            true,
            TextAlign.End,
            TextAlign.Middle,
          );
        }
      }
    }
  }
}
