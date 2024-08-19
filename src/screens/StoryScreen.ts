import { NovelCache } from '../cache/NovelCache.ts';
import { SoundCache, SoundType } from '../cache/SoundCache.ts';
import { Audio, Sound, SoundChannel } from '../engine/Audio.ts';
import { Camera } from '../engine/Camera.ts';
import { Controls } from '../engine/Controls.ts';
import { Renderer } from '../engine/Renderer.ts';
import { Screen } from '../engine/Screen.ts';
import { ScreenManager } from '../engine/ScreenManager.ts';
import { UI } from '../engine/UI.ts';
import { clamp, lerp } from '../helpers/MathUtils.ts';
import { NovelMesh } from '../meshes/NovelMesh.ts';
import { GameScreen } from './GameScreen.ts';
import { LoadingScreen } from './LoadingScreen.ts';
import { MenuScreen } from './MenuScreen.ts';
import StoryMusic from '@/assets/audio/music/monolog.mp3?url';

export class StoryScreen extends Screen {
  private readonly frames: NovelMesh[];

  private readonly angles: number[];

  private readonly novelAudio: ArrayBuffer;

  private audio: Sound | null = null;

  private timer: number = 0;

  private soundStarted: boolean;

  private readonly timePerFrame: number;

  private activeFrame: number = -1;

  public static startStory(index: number) {
    ScreenManager.setScreen(
      new LoadingScreen(
        Promise.all([
          NovelCache.preload(index), //
          SoundCache.preload(),
        ]),
        () => {
          if (index !== 0) {
            localStorage.setItem('career', index.toString());
          }
          ScreenManager.setScreen(new StoryScreen(index));
        },
      ),
    );
  }

  public constructor(private readonly storyIndex: number) {
    super();
    const data = NovelCache.get(storyIndex);
    Audio.setMusic(StoryMusic, 0.3);

    this.novelAudio = data.audio;
    this.frames = data.textures.map((tex) => new NovelMesh(tex));
    this.angles = Array(this.frames.length)
      .fill(0)
      .map((_, idx) => lerp(0, 15, Math.random()) * (idx % 2 === 0 ? -1 : 1));
    this.timePerFrame = (storyIndex === 0 ? 45 : 40) / this.frames.length;
    this.timer = -1;
    this.soundStarted = false;
  }

  public update(delta: number): void {
    this.timer += 0.01667 * delta;
    if (this.timer > 0 && !this.soundStarted) {
      this.audio = Audio.play(this.novelAudio, SoundChannel.Voice, 1, false, 1, 0);
      this.soundStarted = true;
    }

    let skip = false;
    if (this.timer > 0.1) {
      if (Controls.keyHit('Space') || Controls.keyHit('Enter')) {
        skip = true;
        Audio.play(SoundCache.get(SoundType.MenuOK), SoundChannel.UI, 1);
      }
    }

    if (this.timer > this.frames.length * this.timePerFrame + 2 || skip) {
      if (this.audio) {
        this.audio.ended = true;
      }
      if (this.storyIndex === 7) {
        localStorage.removeItem('career');
        MenuScreen.startMenu();
      } else {
        GameScreen.startFight(
          0,
          this.storyIndex + 1,
          this.storyIndex,
          this.storyIndex / 6,
          true,
          true,
        );
      }
    } else {
      Camera.position = [-0.2, 3.1, 1.2];
      Camera.rotation = [
        -71 + Math.sin(this.timer * 0.15),
        -10 + Math.sin(this.timer * 0.3) * 2,
        0,
      ];

      const idx = Math.min(Math.floor(this.timer / this.timePerFrame), this.frames.length - 1);
      if (idx < this.frames.length && idx >= 0 && idx !== this.activeFrame) {
        Audio.play(
          SoundCache.get(SoundType.PaperDrop),
          SoundChannel.Voice,
          0.3,
          false,
          lerp(0.9, 1.1, Math.random()),
          0,
        );
        this.activeFrame = idx;
      }

      const time = Math.min(this.timer / this.timePerFrame, this.frames.length);
      for (let i = 0; i < this.frames.length; i++) {
        const frame = this.frames[i];

        frame.update(
          clamp(time - i, 0, 1.1), //
          this.angles[i],
          i,
        );
      }
    }
  }

  public render(): void {
    Renderer.renderDirect();

    const idx = Math.min(Math.floor(this.timer / this.timePerFrame), this.frames.length - 1);
    for (let i = 0; i <= idx; i++) {
      this.frames[i].render();
    }
  }

  public renderUI(): void {
    Renderer.setupUI();
    const fade = clamp((this.timer - this.frames.length * this.timePerFrame) / 2, 0, 1);
    if (fade > 0) {
      UI.drawFade(fade);
    }
  }
}
