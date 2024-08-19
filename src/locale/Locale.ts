import { LOCALE_RU } from '@/locale/ru.ts';

type LocaleSet = { [key: string]: string | LocaleSet };

export class Locale {
  private static active = 'ru';

  private static readonly locales: { [key: string]: LocaleSet } = {
    ru: LOCALE_RU,
  };

  public static get(key: string) {
    if (key.startsWith('#')) {
      const parts = key.substring(1).split('.');
      let lookup: LocaleSet | string = this.locales[this.active];
      while (parts.length > 0) {
        const name = parts.shift();
        if (name) {
          if (typeof lookup === 'object' && name in lookup) {
            lookup = lookup[name];
          }
        } else {
          break;
        }
      }
      if (typeof lookup === 'string') {
        return lookup;
      }
    }

    return key;
  }

  public static setLocale(name: string) {
    if (name in this.locales) {
      this.active = name;
    }
  }
}
