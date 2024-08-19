import BodyDropSound from '@/assets/audio/fight/body.mp3?url';
import PainSound1 from '@/assets/audio/fight/pain1.mp3?url';
import PainSound2 from '@/assets/audio/fight/pain2.mp3?url';
import PainSound3 from '@/assets/audio/fight/pain3.mp3?url';
import PainSound4 from '@/assets/audio/fight/pain4.mp3?url';
import PainSoundW1 from '@/assets/audio/fight/painw1.mp3?url';
import PainSoundW2 from '@/assets/audio/fight/painw2.mp3?url';
import PainSoundW3 from '@/assets/audio/fight/painw3.mp3?url';
import PainSoundW4 from '@/assets/audio/fight/painw4.mp3?url';
import PunchSound1 from '@/assets/audio/fight/punch1.mp3?url';
// import PunchSound2 from '@/assets/audio/fight/punch2.mp3?url';
// import PunchSound3 from '@/assets/audio/fight/punch3.mp3?url';
// import PunchSound4 from '@/assets/audio/fight/punch4.mp3?url';
import StepSound1 from '@/assets/audio/fight/step1.mp3?url';
import StepSound2 from '@/assets/audio/fight/step2.mp3?url';
import SwingSound1 from '@/assets/audio/fight/swing1.mp3?url';
import SwingSound2 from '@/assets/audio/fight/swing2.mp3?url';
import SwingSound3 from '@/assets/audio/fight/swing3.mp3?url';
import SwingSound4 from '@/assets/audio/fight/swing4.mp3?url';
import PaperSound from '@/assets/audio/monologs/paper.mp3?url';
import BackUISound from '@/assets/audio/ui/back.mp3';
import OkUISound from '@/assets/audio/ui/ok.mp3?url';
import SelectUISound from '@/assets/audio/ui/select.mp3?url';

export enum SoundType {
  Whoosh,
  Hit,
  PainMale,
  PainFemale,
  Step,
  StepHeel,
  BodyDrop,
  PaperDrop,
  MenuSelect,
  MenuOK,
  MenuBack,
}

const SOUND_LINKS: string[][] = [
  [
    SwingSound1, //
    SwingSound2,
    SwingSound3,
    SwingSound4,
  ],
  [
    PunchSound1, //
    // PunchSound2,
    // PunchSound3,
    // PunchSound4,
  ],
  [
    PainSound1, //
    PainSound2,
    PainSound3,
    PainSound4,
  ],
  [
    PainSoundW1, //
    PainSoundW2,
    PainSoundW3,
    PainSoundW4,
  ],
  [
    StepSound1, //
    StepSound2,
  ],
  [],
  [BodyDropSound],
  [PaperSound],
  [SelectUISound],
  [OkUISound],
  [BackUISound],
];

export class SoundCache {
  private static readonly cache: ArrayBuffer[][] = [];

  public static async preload() {
    if (this.cache.length === 0) {
      const data = await Promise.all(
        SOUND_LINKS.map((group) => Promise.all(group.map((url) => this.fetchSound(url)))),
      );
      this.cache.push(...data);
    }
  }

  public static get(type: SoundType) {
    const group = this.cache[type];

    return group[Math.floor(Math.random() * group.length)];
  }

  private static async fetchSound(url: string) {
    const req = await fetch(url);
    console.debug(url);

    return req.arrayBuffer();
  }
}
