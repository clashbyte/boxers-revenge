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

export function decodeFGT(data: ArrayBuffer): FGTModel {
  const f = new BinaryReader(data);
  f.offset += 4;

  const frameCount = f.readShort();
  const vertexCount = f.readShort();
  const frames = f.readArrayBytes(vertexCount * 8 * frameCount);

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
