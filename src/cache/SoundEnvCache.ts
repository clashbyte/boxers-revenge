import { Audio } from '../engine/Audio.ts';

export class SoundEnvCache {
  public static setupForLevel() {
    Audio.setupEnvironment(0.5, 3, 0, [], [], []);
  }
}
