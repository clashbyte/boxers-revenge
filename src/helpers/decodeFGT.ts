import { ZstdSimple } from '@oneidentity/zstd-js/wasm/decompress';
import { BinaryWriter } from '../../utils/BinaryWriter.ts';
import { BinaryReader } from './BinaryReader.ts';

export interface FGTAnimation {
  start: number;
  length: number;
  fps: number;
}

export interface FGTModel {
  frames: Uint8Array;
  frameCount: number;
  vertexCount: number;
  animations: FGTAnimation[];
  uv: Uint8Array;
  indices: Uint8Array;
  indexCount: number;
}

interface TempFrame {
  positions: number[];
  normals: number[];
}

function decompressFrames(data: Uint8Array, vertexCount: number, frameCount: number) {
  const f = new BinaryReader(data.buffer);
  const frames: TempFrame[] = [];

  for (let fr = 0; fr < frameCount; fr++) {
    const ref = f.readShort();
    const positions: number[] = [];
    const normals: number[] = [];
    for (let i = 0; i < vertexCount; i++) {
      const x = ref === 0 ? f.readSignedShort() : f.readSignedByte();
      const y = ref === 0 ? f.readSignedShort() : f.readSignedByte();
      const z = ref === 0 ? f.readSignedShort() : f.readSignedByte();
      const lat = f.readByte();
      const lng = f.readByte();
      positions.push(x, y, z);
      normals.push(lat, lng);
    }
    if (ref !== 0) {
      for (let i = 0; i < vertexCount * 3; i++) {
        positions[i] += frames[ref - 1].positions[i];
      }
    }
    frames.push({
      positions,
      normals,
    });
  }

  const outData = new Uint8Array(vertexCount * frameCount * 8);
  const w = new BinaryWriter(outData.buffer);
  for (const frame of frames) {
    for (let i = 0; i < vertexCount; i++) {
      w.writeShort(frame.positions[i * 3]);
      w.writeShort(frame.positions[i * 3 + 1]);
      w.writeShort(frame.positions[i * 3 + 2]);
      w.writeByte(frame.normals[i * 2]);
      w.writeByte(frame.normals[i * 2 + 1]);
    }
  }

  return outData;
}

function readFrameData(f: BinaryReader, vertexCount: number, frameCount: number) {
  const flags = f.readByte();
  const compressed = (flags & 1) !== 0;
  const zstd = (flags & 2) !== 0;

  const len = f.readInt();
  let data = f.readArrayBytes(len);
  if (zstd) {
    data = ZstdSimple.decompress(data);
  }
  if (compressed) {
    data = decompressFrames(data, vertexCount, frameCount);
  }

  return data;
}

export function decodeFGT(data: ArrayBuffer): FGTModel {
  const f = new BinaryReader(data);
  f.offset += 4;

  const frameCount = f.readShort();
  const vertexCount = f.readShort();
  const frames = readFrameData(f, vertexCount, frameCount);

  const uv = f.readArrayBytes(vertexCount * 2 * 4);
  const indexCount = f.readShort();
  const indices = f.readArrayBytes(indexCount * 2);

  const numAnims = f.readShort();
  const animations: FGTAnimation[] = [];
  for (let i = 0; i < numAnims; i++) {
    const start = f.readShort();
    const length = f.readShort();
    const fps = f.readShort();
    animations[i] = { start, length, fps };
  }

  return {
    frames,
    animations,
    vertexCount,
    frameCount,
    uv,
    indices,
    indexCount,
  };
}
