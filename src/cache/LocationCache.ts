import { vec3 } from 'gl-matrix';
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

export const LOCATION_LIGHTS: { position: vec3; color: vec3; range: number }[][] = [
  // Prison cell
  [
    {
      position: [-5, 4, -5],
      color: [0.9, 1, 0.9],
      range: 15,
    },
    {
      position: [11.5, 4, 4],
      color: [1.0, 0.4, 0.4],
      range: 15,
    },
  ],

  // Jail outside
  [
    {
      position: [-4, 7.3, -9.6],
      range: 20,
      color: [0.9, 0.9, 1.0],
    },
  ],

  // Gas station
  [
    {
      position: [0, 6, -9],
      range: 20,
      color: [0.9, 0.9, 1.0],
    },
    {
      position: [-11.5, 3, 0],
      range: 8,
      color: [1.0, 1.0, 1.0],
    },
    {
      position: [4, 8, 5],
      range: 15,
      color: [1.0, 1.0, 0.7],
    },
  ],

  // Park
  [
    {
      position: [-0.2, 6, -7],
      range: 25,
      color: [1.1, 1.0, 0.7],
    },
  ],

  // Underground
  [
    {
      position: [3, 4.5, -2],
      range: 13,
      color: [1.1, 1.0, 0.7],
    },
    {
      position: [-14, 4.5, 2],
      range: 13,
      color: [0.3, 0.6, 1.0],
    },
  ],

  // Bus stop
  [
    {
      position: [-0.2, 6, -7],
      range: 15,
      color: [1.1, 1.0, 0.7],
    },
    {
      position: [16, 6, -5],
      range: 10,
      color: [1.1, 1.0, 0.7],
    },
  ],

  // Bar
  [
    {
      position: [9, 6, -4],
      range: 20,
      color: [1.1, 1.0, 0.8],
    },
    {
      position: [-15, 4, 1],
      range: 10,
      color: [0.0, 1.0, 0.0],
    },
  ],
];

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
