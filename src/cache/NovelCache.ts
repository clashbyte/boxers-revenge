import { loadTexture } from '../helpers/GLHelpers.ts';

import Novel1Audio from '@/assets/audio/monologs/1.mp3?url';
import Novel2Audio from '@/assets/audio/monologs/2.mp3?url';
import Novel3Audio from '@/assets/audio/monologs/3.mp3?url';
import Novel4Audio from '@/assets/audio/monologs/4.mp3?url';
import Novel5Audio from '@/assets/audio/monologs/5.mp3?url';
import Novel6Audio from '@/assets/audio/monologs/6.mp3?url';
import Novel7Audio from '@/assets/audio/monologs/7.mp3?url';
import Novel8Audio from '@/assets/audio/monologs/8.mp3?url';

import Novel1Frame1 from '@/assets/novels/l1s1.jpg';
import Novel1Frame2 from '@/assets/novels/l1s2.jpg';
import Novel1Frame3 from '@/assets/novels/l1s3.jpg';
import Novel1Frame4 from '@/assets/novels/l1s4.jpg';
import Novel1Frame5 from '@/assets/novels/l1s5.jpg';

import Novel2Frame1 from '@/assets/novels/l2s1.jpg';
import Novel2Frame2 from '@/assets/novels/l2s2.jpg';
import Novel2Frame3 from '@/assets/novels/l2s3.jpg';

import Novel3Frame1 from '@/assets/novels/l3s1.jpg';
import Novel3Frame2 from '@/assets/novels/l3s2.jpg';
import Novel3Frame3 from '@/assets/novels/l3s3.jpg';

import Novel4Frame1 from '@/assets/novels/l4s1.jpg';
import Novel4Frame2 from '@/assets/novels/l4s2.jpg';
import Novel4Frame3 from '@/assets/novels/l4s3.jpg';

import Novel5Frame1 from '@/assets/novels/l5s1.jpg';
import Novel5Frame2 from '@/assets/novels/l5s2.jpg';
import Novel5Frame3 from '@/assets/novels/l5s3.jpg';

import Novel6Frame1 from '@/assets/novels/l6s1.jpg';
import Novel6Frame2 from '@/assets/novels/l6s2.jpg';
import Novel6Frame3 from '@/assets/novels/l6s3.jpg';

import Novel7Frame1 from '@/assets/novels/l7s1.jpg';
import Novel7Frame2 from '@/assets/novels/l7s2.jpg';
import Novel7Frame3 from '@/assets/novels/l7s3.jpg';

import Novel8Frame1 from '@/assets/novels/l8s1.jpg';
import Novel8Frame2 from '@/assets/novels/l8s2.jpg';
import Novel8Frame3 from '@/assets/novels/l8s3.jpg';

interface NovelData {
  audio: ArrayBuffer;
  textures: WebGLTexture[];
}

const IMAGES: string[][] = [
  [
    Novel1Frame1, //
    Novel1Frame2,
    Novel1Frame3,
    Novel1Frame4,
    Novel1Frame5,
  ],
  [
    Novel2Frame1, //
    Novel2Frame2,
    Novel2Frame3,
  ],
  [
    Novel3Frame1, //
    Novel3Frame2,
    Novel3Frame3,
  ],
  [
    Novel4Frame1, //
    Novel4Frame2,
    Novel4Frame3,
  ],
  [
    Novel5Frame1, //
    Novel5Frame2,
    Novel5Frame3,
  ],
  [
    Novel6Frame1, //
    Novel6Frame2,
    Novel6Frame3,
  ],
  [
    Novel7Frame1, //
    Novel7Frame2,
    Novel7Frame3,
  ],
  [
    Novel8Frame1, //
    Novel8Frame2,
    Novel8Frame3,
  ],
];

const SOUNDS: string[] = [
  Novel1Audio, //
  Novel2Audio,
  Novel3Audio,
  Novel4Audio,
  Novel5Audio,
  Novel6Audio,
  Novel7Audio,
  Novel8Audio,
];

export class NovelCache {
  private static readonly novels: NovelData[] = [];

  private static readonly promises: (Promise<NovelData> | null)[] = [];

  public static preload(...indices: number[]) {
    return Promise.all(indices.map((idx) => this.cache(idx)));
  }

  public static get(index: number) {
    return this.novels[index];
  }

  private static async cache(index: number) {
    if (this.novels[index]) {
      return Promise.resolve(this.novels[index]);
    }
    if (!this.promises[index]) {
      this.promises[index] = this.loadNovel(index);
    }

    return this.promises[index];
  }

  private static async loadNovel(index: number): Promise<NovelData> {
    const [audioData, ...textures] = await Promise.all([
      fetch(SOUNDS[index]),
      ...IMAGES[index].map((url) => loadTexture(url, true)),
    ]);

    const data: NovelData = {
      audio: await audioData.arrayBuffer(),
      textures,
    };
    this.promises[index] = null;
    this.novels[index] = data;

    return data;
  }
}
