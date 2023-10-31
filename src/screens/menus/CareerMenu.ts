import { TextAlign, UI } from '../../engine/UI.ts';
import { StoryScreen } from '../StoryScreen.ts';
import { Menu, MenuType } from './Menu.ts';
import { MenuList } from './MenuList.ts';

export class CareerMenu extends Menu {
  private readonly list: MenuList;

  private readonly careerState: number | null = null;

  public constructor(changeMenu: (type: MenuType) => void) {
    super(changeMenu);

    this.careerState = null;
    if (localStorage.getItem('career')) {
      this.careerState = parseInt(localStorage.getItem('career')!);
    }

    const list =
      this.careerState !== null
        ? [
            'Продолжить',
            'Новая игра', //
            null,
            'Назад',
          ]
        : [
            'Новая игра', //
            null,
            'Назад',
          ];

    this.list = new MenuList(list, this.menuSelect.bind(this), 20, 768 / 2, 300);
  }

  public reset() {
    this.list.reset();
  }

  public update(delta: number, active: boolean) {
    this.list.update(delta, active);
  }

  public render(appear: number) {
    UI.drawBox([0, 0, 0, appear * 0.5], 20, 0, 300, 768);
    UI.drawText(
      'Карьера',
      170,
      768 / 4,
      50,
      [1, 1, 1, appear],
      true,
      TextAlign.Middle,
      TextAlign.Middle,
    );
    this.list.render(appear);
  }

  private menuSelect(index: number) {
    const resume = this.careerState !== null ? 0 : -1;
    const start = this.careerState !== null ? 1 : 0;
    const back = this.careerState !== null ? 3 : 2;

    if (index === resume) {
      StoryScreen.startStory(this.careerState!);
    } else if (index === start) {
      StoryScreen.startStory(0);
    } else if (index === back) {
      this.changeMenu(MenuType.Main);
    }
  }
}
