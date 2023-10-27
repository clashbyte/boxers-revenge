export abstract class Screen {
  public abstract update(delta: number): void;

  public abstract render(): void;

  public abstract renderUI(): void;

  public dispose() {}
}
