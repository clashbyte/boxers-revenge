export enum MenuType {
  Main,
  Career,
  Versus,
  Settings,
  About,
}

export abstract class Menu {
  public constructor(protected readonly changeMenu: (type: MenuType) => void) {}

  public abstract update(delta: number, active: boolean): void;

  public abstract render(appear: number): void;

  public reset() {}
}
