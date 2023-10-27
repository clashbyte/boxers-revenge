import { BinaryReader } from './BinaryReader.ts';

export interface LVLModel {
  geometry: Uint8Array;
  indices: Uint8Array;
  indexCount: number;
}

export function decodeLVL(data: ArrayBuffer): LVLModel {
  const f = new BinaryReader(data);
  f.offset += 4;

  const numVerts = f.readShort();
  const geometry = f.readArrayBytes(numVerts * 48);

  const indexCount = f.readShort();
  const indices = f.readArrayBytes(indexCount * 2);

  return {
    geometry,
    indices,
    indexCount,
  };
}
