import { mat3, quat, vec3 } from 'gl-matrix';
import { Camera } from './Camera.ts';

enum CacheStatus {
  None,
  Decoding,
  Ready,
}

export enum SoundChannel {
  FX,
  Voice,
  UI,
  Music,
}

interface CacheEntry {
  sourceBuffer: ArrayBuffer;
  state: CacheStatus;
  buffer: AudioBuffer | null;
  decoding: Promise<AudioBuffer> | null;
  decodeTime: number;
}

export interface Sound {
  readonly sourceBuffer: ArrayBuffer;
  playing: boolean;
  ready: boolean;
  ended: boolean;
  volume: number;
  speed: number;
  loop: boolean;
  pan: number;

  position?: vec3;
}

interface SoundEntry {
  sound: Sound;

  ended: boolean;
  startedAt: number;

  ready: boolean;

  length: number;
  channel: SoundChannel;

  cache: CacheEntry;
  source: AudioBufferSourceNode | null;
  positionNode: PannerNode | null;
  gainNode: GainNode | null;
  pannerNode: StereoPannerNode | null;
}

interface EqualizerConfig {
  Q: number;
  frequency: number;
  gain: number;
  type: BiquadFilterType;
}

interface ReverbConfig {
  length: number;
  decay: number;
  dryEq?: EqualizerConfig[];
  wetEq?: EqualizerConfig[];
  eq?: EqualizerConfig[];
  wet: number;
}

interface Channel {
  input: AudioNode;
  filters?: BiquadFilterNode[];
}

interface ReverbChannel extends Channel {
  reverb: ConvolverNode;
  dryGain: GainNode;
  wetGain: GainNode;
  dryFilters?: BiquadFilterNode[];
  wetFilters?: BiquadFilterNode[];
}

interface MusicTrack {
  file: string;
  element: HTMLAudioElement;
  source: MediaElementAudioSourceNode;
  gain: GainNode;
}

export class Audio {
  private static context: AudioContext | null = null;

  private static targetNode: GainNode;

  private static readonly channels: Channel[] = [];

  private static readonly cache: CacheEntry[] = [];

  private static readonly entries: SoundEntry[] = [];

  private static fxConfig: ReverbConfig | null = null;

  private static musicTrack: string | null = null;

  private static musicVolume: number = 1;

  private static readonly musicEntries: MusicTrack[] = [];

  public static setupEnvironment(
    length: number,
    decay: number,
    wet: number,
    baseFilters: EqualizerConfig[],
    dryFilters: EqualizerConfig[],
    wetFilters: EqualizerConfig[],
  ) {
    this.fxConfig = {
      length,
      decay,
      eq: baseFilters,
      dryEq: dryFilters,
      wetEq: wetFilters,
      wet,
    };

    if (this.context) {
      this.channels[SoundChannel.FX] = this.createReverbChannel(
        length,
        decay,
        wet,
        baseFilters,
        dryFilters,
        wetFilters,
      );
    }
  }

  public static setMusic(file: string | null, volume: number = 1) {
    this.musicTrack = file;
    this.musicVolume = volume;
  }

  public static init() {
    const contextClick = () => {
      try {
        this.lateInit();
        window.removeEventListener('click', contextClick);
        // window.removeEventListener('keydown', contextClick);
      } catch (ex) {}
    };
    window.addEventListener('click', contextClick);
    // window.addEventListener('keydown', contextClick);
  }

  public static update(delta: number) {
    const ctx = this.context;
    if (ctx) {
      const posVec = Camera.position;
      const rotVec = Camera.rotation;
      const rotMat = mat3.fromQuat(
        mat3.create(),
        quat.fromEuler(quat.create(), rotVec[0], rotVec[1], rotVec[2]),
      );
      const dirForward = vec3.transformMat3(vec3.create(), [0, 0, -1], rotMat);
      const dirUp = vec3.transformMat3(vec3.create(), [0, 1, 0], rotMat);

      if (ctx.listener.positionX) {
        ctx.listener.positionX.value = posVec[0];
        ctx.listener.positionY.value = posVec[1];
        ctx.listener.positionZ.value = -posVec[2];
        ctx.listener.upX.value = dirUp[0];
        ctx.listener.upY.value = dirUp[1];
        ctx.listener.upZ.value = dirUp[2];
        ctx.listener.forwardX.value = dirForward[0];
        ctx.listener.forwardY.value = dirForward[1];
        ctx.listener.forwardZ.value = dirForward[2];
      } else {
        ctx.listener.setPosition(posVec[0], posVec[1], -posVec[2]);
        ctx.listener.setOrientation(
          dirForward[0],
          dirForward[1],
          dirForward[2],
          dirUp[0],
          dirUp[1],
          dirUp[2],
        );
      }

      for (const en of this.cache) {
        if (en.state === CacheStatus.None) {
          en.state = CacheStatus.Decoding;
          en.decodeTime = performance.now();
          en.decoding = ctx.decodeAudioData(en.sourceBuffer, (result) => {
            en.buffer = result;
            en.decoding = null;
            en.decodeTime = 0; // performance.now() - en.decodeTime;
            en.state = CacheStatus.Ready;
          });
        }
      }

      const toRemove: SoundEntry[] = [];
      for (const en of this.entries) {
        if (!en.ready && en.cache.state === CacheStatus.Ready) {
          const snd = en.sound;
          let elapsed = (performance.now() - en.startedAt - en.cache.decodeTime) / 1000;
          const length = en.cache.buffer!.duration;
          if (snd.loop) {
            elapsed %= length;
          }
          if (elapsed < length) {
            en.gainNode = ctx.createGain();
            en.gainNode.gain.value = snd.volume;
            en.gainNode.connect(this.channels[en.channel].input);

            en.pannerNode = ctx.createStereoPanner();
            en.pannerNode.pan.value = snd.pan;
            en.pannerNode.connect(en.gainNode);

            if (snd.position) {
              en.positionNode = ctx.createPanner();
              en.positionNode.maxDistance = 20;
              en.positionNode.rolloffFactor = 0.02;
              en.positionNode.positionX.value = snd.position[0];
              en.positionNode.positionY.value = snd.position[1];
              en.positionNode.positionZ.value = -snd.position[2];
              en.positionNode.connect(en.pannerNode);
            }

            en.source = ctx.createBufferSource();
            en.source.buffer = en.cache.buffer;
            en.source.loop = snd.loop;
            en.source.playbackRate.value = snd.speed;
            en.source.connect(en.positionNode ? en.positionNode : en.pannerNode);

            en.source.onended = () => {
              en.ended = true;
              en.sound.ended = true;
            };
            en.source.start(0, Math.max(elapsed, 0));

            en.ready = true;
          } else {
            snd.ended = true;
            toRemove.push(en);
          }
        }
        if (en.ready) {
          if (en.ended || en.sound.ended) {
            en.source?.stop();
            en.source?.disconnect();
            en.gainNode?.disconnect();
            en.positionNode?.disconnect();
            en.pannerNode?.disconnect();
            toRemove.push(en);
          } else if (en.positionNode && en.sound.position) {
            en.positionNode.positionX.value = en.sound.position[0];
            en.positionNode.positionY.value = en.sound.position[1];
            en.positionNode.positionZ.value = -en.sound.position[2];
          }
        }
      }

      for (const rem of toRemove) {
        const idx = this.entries.indexOf(rem);
        if (idx !== -1) {
          this.entries.splice(idx, 1);
        }
      }

      let musicFound = false;
      const musicToRemove: MusicTrack[] = [];
      for (const music of this.musicEntries) {
        const active = music.file === this.musicTrack;
        const volume = active ? this.musicVolume : 0;
        if (active) {
          musicFound = true;
        }

        let current = music.gain.gain.value;
        if (current > volume) {
          current = Math.max(current - 0.02 * delta, volume);
        } else if (current < volume) {
          current = Math.min(current + 0.02 * delta, volume);
        }

        if (current === 0 && !active) {
          music.element.pause();
          music.element.remove();
          musicToRemove.push(music);
        } else {
          music.gain.gain.value = current;
        }
      }

      for (const m of musicToRemove) {
        this.musicEntries.splice(this.musicEntries.indexOf(m), 1);
      }

      if (!musicFound && this.musicTrack) {
        const elem = document.createElement('audio');
        elem.src = this.musicTrack;
        elem.loop = true;
        elem.style.position = 'absolute';
        elem.style.top = '0px';
        elem.style.left = '0px';
        elem.tabIndex = -1;
        document.body.appendChild(elem);

        const source = ctx.createMediaElementSource(elem);
        const gain = ctx.createGain();
        gain.gain.value = 0;
        source.connect(gain);
        gain.connect(this.channels[SoundChannel.Music].input);
        elem.play();

        this.musicEntries.push({
          element: elem,
          gain,
          source,
          file: this.musicTrack,
        });
      }
    }
  }

  public static play(
    audio: ArrayBuffer,
    channel: SoundChannel = SoundChannel.FX,
    volume: number = 1,
    loop: boolean = false,
    speed: number = 1,
    pan: number = 0,
    position?: vec3,
  ) {
    let cacheEntry = this.cache.find((en) => en.sourceBuffer === audio);
    if (!cacheEntry) {
      cacheEntry = {
        sourceBuffer: audio,
        state: CacheStatus.None,
        buffer: null,
        decoding: null,
        decodeTime: 0,
      };
      this.cache.push(cacheEntry);
    }

    const snd: Sound = {
      sourceBuffer: audio,
      playing: true,
      ready: false,
      ended: false,
      volume,
      loop,
      speed,
      pan,
      position: position ? vec3.clone(position) : undefined,
    };

    const en: SoundEntry = {
      sound: snd,

      ended: false,
      startedAt: performance.now(),

      ready: false,

      length: 0,
      channel,

      cache: cacheEntry,
      positionNode: null,
      source: null,
      gainNode: null,
      pannerNode: null,
    };
    this.entries.push(en);

    return snd;
  }

  private static lateInit() {
    const ctx = new AudioContext();
    if (ctx) {
      this.context = ctx;

      this.targetNode = ctx.createGain();
      this.targetNode.gain.value = 1;
      this.targetNode.connect(ctx.destination);

      this.channels.push(
        this.createFXChannel(), //
        this.createVoiceChannel(),
        this.createChannel(),
        this.createChannel(),
      );
    } else {
      throw new Error('Failed to start audio');
    }
  }

  private static createChannel(filterConfig?: EqualizerConfig[]): Channel {
    const ctx = this.context!;

    const input = ctx.createGain();
    const filters: BiquadFilterNode[] = this.createFilters(filterConfig);
    if (filters.length > 0) {
      input.connect(filters[0]);
      filters.at(-1)?.connect(this.targetNode);
    } else {
      input.connect(this.targetNode);
    }

    return {
      input,
      filters,
    };
  }

  private static createReverbChannel(
    length: number,
    decay: number,
    wet: number,
    inputFilters?: EqualizerConfig[],
    dryFilters?: EqualizerConfig[],
    wetFilters?: EqualizerConfig[],
  ): ReverbChannel {
    const ctx = this.context!;

    const input = ctx.createGain();
    const inputFilter: BiquadFilterNode[] = this.createFilters(inputFilters);
    const dryFilter: BiquadFilterNode[] = this.createFilters(dryFilters);
    const wetFilter: BiquadFilterNode[] = this.createFilters(wetFilters);

    const dryGain = ctx.createGain();
    const wetGain = ctx.createGain();
    const reverb = ctx.createConvolver();
    reverb.buffer = this.createIR(length, decay);
    wetGain.gain.value = wet;
    dryGain.gain.value = 1.0 - wet;

    input.connect(reverb);
    input.connect(dryGain);
    reverb.connect(wetGain);
    dryGain.connect(this.targetNode);
    wetGain.connect(this.targetNode);

    return {
      input,
      filters: inputFilter,
      reverb,
      dryGain,
      wetGain,
      dryFilters: dryFilter,
      wetFilters: wetFilter,
    };
  }

  private static createFXChannel(): Channel {
    if (this.fxConfig) {
      const cfg = this.fxConfig;

      return this.createReverbChannel(cfg.length, cfg.decay, cfg.wet, cfg.eq, cfg.dryEq, cfg.wetEq);
    }

    return this.createChannel();
  }

  private static createVoiceChannel(): Channel {
    return this.createChannel();
  }

  private static createFilters(filters?: EqualizerConfig[]) {
    const ctx = this.context!;
    const out: BiquadFilterNode[] = [];
    let prev = null;
    if (filters) {
      for (const cfg of filters) {
        const node = ctx.createBiquadFilter();
        node.gain.value = cfg.gain;
        node.frequency.value = cfg.frequency;
        node.Q.value = cfg.Q;
        node.type = cfg.type;
        if (prev) {
          prev.connect(node);
        }
        prev = node;
        out.push(node);
      }
    }

    return out;
  }

  private static createIR(duration: number, decay: number) {
    const sampleRate = this.context!.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.context!.createBuffer(2, length, sampleRate);
    const impulseL = impulse.getChannelData(0);
    const impulseR = impulse.getChannelData(1);

    const rnd = () => Math.random() * 2 - 1;

    for (let i = 0; i < length; i++) {
      const m = (1 - i / length) ** decay;
      impulseL[i] = rnd() * m;
      impulseR[i] = rnd() * m;
    }

    return impulse;
  }
}
