import { UI } from '../../engine/UI.ts';
import { Menu, MenuType } from './Menu.ts';
import { MenuList } from './MenuList.ts';

export class MainMenu extends Menu {
  private readonly list: MenuList;

  public constructor(changeMenu: (type: MenuType) => void) {
    super(changeMenu);
    this.list = new MenuList(
      [
        '#menu.main.career', //
        '#menu.main.versus',
        '#menu.main.settings',
        '#menu.main.authors',
      ],
      this.menuSelect.bind(this),
      20,
      768 / 2,
      300,
    );
  }

  public update(delta: number, active: boolean) {
    this.list.update(delta, active);
  }

  public render(appear: number) {
    UI.drawBox([0, 0, 0, appear * 0.5], 20, 0, 300, 768);
    this.list.render(appear);
  }

  private menuSelect(index: number) {
    switch (index) {
      case 0:
        this.changeMenu(MenuType.Career);
        break;

      case 1:
        this.changeMenu(MenuType.Versus);
        break;

      case 2:
        this.changeMenu(MenuType.Settings);
        break;

      case 3:
        this.changeMenu(MenuType.About);
        break;
    }
  }
}
