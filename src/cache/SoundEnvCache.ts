import { Audio } from '../engine/Audio.ts';

export class SoundEnvCache {
  public static setupForLevel(location: number) {
    Audio.setupEnvironment(0.5, 3, 0, [], [], []);
  }
}
