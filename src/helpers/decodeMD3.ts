import { BinaryReader } from './BinaryReader.ts';

export interface MD3Frame {
  position: Float32Array;
  normal: Float32Array;
  normalRaw: Uint16Array;
}

export interface MD3Surface {
  frames: MD3Frame[];
  uv: Float32Array;
  indices: Uint16Array;
}

const SCALE_FACTOR = 1.0 / 64.0;
const PI2 = Math.PI * 2;

function readVertexFrame(f: BinaryReader, vertexCount: number): MD3Frame {
  const position = new Float32Array(vertexCount * 3);
  const normal = new Float32Array(vertexCount * 3);
  const normalRaw = new Uint16Array(vertexCount);

  for (let i = 0; i < vertexCount; i++) {
    const p = i * 3;
    const vx = f.readSignedShort() * SCALE_FACTOR;
    const vy = f.readSignedShort() * SCALE_FACTOR;
    const vz = f.readSignedShort() * SCALE_FACTOR;
    const norm = f.readShort();
    const lat = (((norm >> 8) & 255) * PI2) / 255.0;
    const lon = ((norm & 255) * PI2) / 255.0;
    const nx = Math.cos(lat) * Math.sin(lon);
    const ny = Math.sin(lat) * Math.sin(lon);
    const nz = Math.cos(lon);

    position[p] = vx;
    position[p + 1] = vz;
    position[p + 2] = -vy;
    normal[p] = nx;
    normal[p + 1] = nz;
    normal[p + 2] = -ny;
    normalRaw[p] = norm;
  }

  return {
    position,
    normal,
    normalRaw,
  };
}

function readSurfaces(f: BinaryReader, surfaceCount: number) {
  const out: MD3Surface[] = [];
  for (let surfaceIndex = 0; surfaceIndex < surfaceCount; surfaceIndex++) {
    const baseOffset = f.offset;
    f.offset += 4 + 64 + 4;
    const frameCount = f.readUInt();
    f.offset += 4;
    const vertexCount = f.readUInt();
    const triangleCount = f.readUInt();
    const triangleOffset = f.readUInt() + baseOffset;
    f.offset += 4;
    const uvOffset = f.readUInt() + baseOffset;
    const vertexOffset = f.readUInt() + baseOffset;
    const frameEndOffset = f.readUInt() + baseOffset;

    // Чтение вершин-кадров
    const frames: MD3Frame[] = [];
    f.offset = vertexOffset;
    for (let i = 0; i < frameCount; i++) {
      frames[i] = readVertexFrame(f, vertexCount);
    }

    // Чтение UV
    const uv = new Float32Array(vertexCount * 2);
    f.offset = uvOffset;
    for (let i = 0; i < vertexCount * 2; i++) {
      uv[i] = f.readFloat();
    }

    // Чтение индексов
    const indices = new Uint16Array(triangleCount * 3);
    f.offset = triangleOffset;
    for (let i = 0; i < triangleCount * 3; i += 3) {
      indices[i] = f.readInt();
      indices[i + 2] = f.readInt();
      indices[i + 1] = f.readInt();
    }

    out[surfaceIndex] = {
      frames,
      uv,
      indices,
    };
    f.offset = frameEndOffset;
  }

  return out;
}

export function decodeMD3(rawFile: ArrayBuffer) {
  const f = new BinaryReader(rawFile);

  f.offset =
    4 + // Заголовок
    4 + // Версия
    64 + // Название модели
    4 + // Флаги
    4 + // Количество фреймов
    4; // Количество тегов

  const surfaceCount = f.readUInt();
  f.offset += 12;
  f.offset = f.readUInt();

  return readSurfaces(f, surfaceCount);
}
