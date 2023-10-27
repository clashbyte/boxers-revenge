/* eslint no-await-in-loop: 0 */
import * as fs from 'fs';
import * as path from 'node:path';
import * as imagick from 'imagemagick';
import { decodeMD3 } from '../src/helpers/decodeMD3.ts';
import { BinaryWriter } from './BinaryWriter.ts';

async function recompressTexture(index: number) {
  const srcImage = path.resolve(`raw_data/textures/tex${index + 30}.bmp`);
  const destImage = path.resolve(`src/assets/fighters/fighter${index + 1}.jpg`);

  await new Promise((resolve, reject) => {
    imagick.convert([srcImage, destImage], (err: Error) => {
      if (err) {
        reject();
      }
      resolve(undefined);
    });
  });
}

async function writeAnimations(f: BinaryWriter, index: number) {
  const lines = fs
    .readFileSync(path.resolve(`raw_data/fighters/${index + 1}_animation.cfg`), 'utf-8')
    .split('\n')
    .filter((ln) => ln.length > 0);

  f.writeShort(lines.length);
  for (const line of lines) {
    const [start, count, , speed] = line.split('\t');
    f.writeShort(parseInt(start));
    f.writeShort(parseInt(count));
    f.writeShort(parseInt(speed));
  }
}

async function writeMesh(f: BinaryWriter, index: number) {
  const modelFile = fs.readFileSync(
    path.resolve(`raw_data/fighters/${index + 1}_lower.bhm`),
  ).buffer;
  const rawModel = decodeMD3(modelFile)[0];

  f.writeShort(rawModel.frames.length);
  f.writeShort(rawModel.uv.length / 2);
  for (const frame of rawModel.frames) {
    for (let i = 0; i < frame.position.length; i += 3) {
      for (let j = i; j < i + 3; j++) {
        f.writeSignedShort(Math.round(frame.position[j] * 64.0));
      }

      const nx = frame.normal[i];
      const ny = frame.normal[i + 1];
      const nz = frame.normal[i + 2];
      if (nx === 0 && nz === 0) {
        f.writeByte(0);
        f.writeByte(ny < 0 ? 128 : 0);
      } else {
        const lat = Math.round((Math.acos(ny) * 255) / (Math.PI * 2));
        const lng = Math.round((Math.atan2(nz, nx) * 255) / (Math.PI * 2));
        f.writeByte(lng);
        f.writeByte(lat);
      }
    }
  }
  for (let i = 0; i < rawModel.uv.length; i++) {
    f.writeFloat(rawModel.uv[i]);
  }

  f.writeShort(rawModel.indices.length);
  for (let i = 0; i < rawModel.indices.length; i++) {
    f.writeShort(rawModel.indices[i]);
  }
}

(async () => {
  for (let i = 0; i < 8; i++) {
    const buffer = new ArrayBuffer(20 * 1024 * 1024);
    const f = new BinaryWriter(buffer);

    f.writeFixedString('FGTR');
    await writeMesh(f, i);
    await writeAnimations(f, i);

    const outBuffer = new DataView(buffer, 0, f.offset);
    await fs.writeFileSync(path.resolve(`src/assets/fighters/fighter${i + 1}.fgt`), outBuffer, {});

    await recompressTexture(i);

    // eslint-disable-next-line no-console
    console.info(`[INFO] Written fighter ${i + 1}`);
  }
})();
