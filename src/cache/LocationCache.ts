import { decodeLVL, LVLModel } from '../helpers/decodeLVL.ts';
import { loadTexture } from '../helpers/GLHelpers.ts';
import LevelTexture1 from '@/assets/levels/level1.jpg';
import LevelModel1 from '@/assets/levels/level1.lvl?url';
import LevelTexture2 from '@/assets/levels/level2.jpg';
import LevelModel2 from '@/assets/levels/level2.lvl?url';
import LevelTexture3 from '@/assets/levels/level3.jpg';
import LevelModel3 from '@/assets/levels/level3.lvl?url';
import LevelTexture4 from '@/assets/levels/level4.jpg';
import LevelModel4 from '@/assets/levels/level4.lvl?url';
import LevelTexture5 from '@/assets/levels/level5.jpg';
import LevelModel5 from '@/assets/levels/level5.lvl?url';
import LevelTexture6 from '@/assets/levels/level6.jpg';
import LevelModel6 from '@/assets/levels/level6.lvl?url';
import LevelTexture7 from '@/assets/levels/level7.jpg';
import LevelModel7 from '@/assets/levels/level7.lvl?url';

interface LevelData {
  mesh: LVLModel;
  texture: WebGLTexture;
}

const MESHES = [
  LevelModel1,
  LevelModel2,
  LevelModel3,
  LevelModel4,
  LevelModel5,
  LevelModel6,
  LevelModel7,
];

const TEXTURES = [
  LevelTexture1,
  LevelTexture2,
  LevelTexture3,
  LevelTexture4,
  LevelTexture5,
  LevelTexture6,
  LevelTexture7,
];

export enum LocationType {
  Jail,
  JailOutside,
  GasStation,
  Park,
  Underground,
  BusStop,
  Bar,
}

export class LocationCache {
  private static readonly levels: LevelData[] = [];

  private static readonly promises: (Promise<LocationCache> | null)[] = [];

  public static preload(...indices: LocationType[]) {
    return Promise.all(indices.map((idx) => this.cache(idx)));
  }

  public static get(index: LocationType) {
    return this.levels[index];
  }

  private static async cache(index: LocationType) {
    if (this.levels[index]) {
      return Promise.resolve(this.levels[index]);
    }
    if (!this.promises[index]) {
      this.promises[index] = this.loadLocation(index);
    }

    return this.promises[index];
  }

  private static async loadLocation(index: LocationType): Promise<LevelData> {
    const [meshData, texture] = await Promise.all([
      fetch(MESHES[index]),
      loadTexture(TEXTURES[index], false),
    ]);

    const mesh = decodeLVL(await meshData.arrayBuffer());
    const data: LevelData = {
      mesh,
      texture,
    };
    this.promises[index] = null;
    this.levels[index] = data;

    return data;
  }
}
