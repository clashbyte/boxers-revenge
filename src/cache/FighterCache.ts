import { decodeFGT, FGTModel } from '../helpers/decodeFGT.ts';
import { loadTexture } from '../helpers/GLHelpers.ts';
import FighterPhrase1 from '@/assets/audio/intro/1.mp3';
import FighterPhrase2 from '@/assets/audio/intro/2.mp3';
import FighterPhrase3 from '@/assets/audio/intro/3.mp3';
import FighterPhrase4 from '@/assets/audio/intro/4.mp3';
import FighterPhrase5 from '@/assets/audio/intro/5.mp3';
import FighterPhrase6 from '@/assets/audio/intro/6.mp3';
import FighterPhrase7 from '@/assets/audio/intro/7.mp3';
import FighterModel1 from '@/assets/fighters/fighter1.fgt?url';
import FighterTexture1 from '@/assets/fighters/fighter1.jpg';
import FighterModel2 from '@/assets/fighters/fighter2.fgt?url';
import FighterTexture2 from '@/assets/fighters/fighter2.jpg';
import FighterModel3 from '@/assets/fighters/fighter3.fgt?url';
import FighterTexture3 from '@/assets/fighters/fighter3.jpg';
import FighterModel4 from '@/assets/fighters/fighter4.fgt?url';
import FighterTexture4 from '@/assets/fighters/fighter4.jpg';
import FighterModel5 from '@/assets/fighters/fighter5.fgt?url';
import FighterTexture5 from '@/assets/fighters/fighter5.jpg';
import FighterModel6 from '@/assets/fighters/fighter6.fgt?url';
import FighterTexture6 from '@/assets/fighters/fighter6.jpg';
import FighterModel7 from '@/assets/fighters/fighter7.fgt?url';
import FighterTexture7 from '@/assets/fighters/fighter7.jpg';
import FighterModel8 from '@/assets/fighters/fighter8.fgt?url';
import FighterTexture8 from '@/assets/fighters/fighter8.jpg';

interface FighterData {
  mesh: FGTModel;
  texture: WebGLTexture;
  voiceLine: ArrayBuffer | null;
}

const MESHES = [
  FighterModel1,
  FighterModel2,
  FighterModel3,
  FighterModel4,
  FighterModel5,
  FighterModel6,
  FighterModel7,
  FighterModel8,
];

const TEXTURES = [
  FighterTexture1,
  FighterTexture2,
  FighterTexture3,
  FighterTexture4,
  FighterTexture5,
  FighterTexture6,
  FighterTexture7,
  FighterTexture8,
];

const VOICE_LINES = [
  null,
  FighterPhrase1,
  FighterPhrase2,
  FighterPhrase3,
  FighterPhrase4,
  FighterPhrase5,
  FighterPhrase6,
  FighterPhrase7,
];

export const FIGHTER_NAMES = [
  'Боксёр', //
  'Авторитет',
  'Мент',
  'Шофёр',
  'Байкер',
  'Секси',
  'Контролёр',
  'Бандит',
];

export enum FighterType {
  Boxer,
  Inmate,
  Policeman,
  Driver,
  Junkie,
  Woman,
  Controller,
  Bandit,
}

export class FighterCache {
  private static readonly fighters: FighterData[] = [];

  private static readonly promises: (Promise<FighterData> | null)[] = [];

  public static preload(...indices: FighterType[]) {
    return Promise.all(indices.map((idx) => this.cache(idx)));
  }

  public static get(index: FighterType) {
    return this.fighters[index];
  }

  private static async cache(index: FighterType) {
    if (this.fighters[index]) {
      return Promise.resolve(this.fighters[index]);
    }
    if (!this.promises[index]) {
      this.promises[index] = this.loadFighter(index);
    }

    return this.promises[index];
  }

  private static async loadFighter(index: FighterType): Promise<FighterData> {
    const [meshData, texture] = await Promise.all([
      fetch(MESHES[index]),
      loadTexture(TEXTURES[index]),
    ]);

    let voiceLine = null;
    if (VOICE_LINES[index]) {
      const req = await fetch(VOICE_LINES[index]!);
      voiceLine = await req.arrayBuffer();
    }

    const mesh = decodeFGT(await meshData.arrayBuffer());
    const data: FighterData = {
      mesh,
      texture,
      voiceLine,
    };
    this.promises[index] = null;
    this.fighters[index] = data;
    console.debug('cached', index);

    return data;
  }
}
