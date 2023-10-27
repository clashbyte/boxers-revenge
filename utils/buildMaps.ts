/* eslint no-await-in-loop: 0 */
import * as fs from 'fs';
import * as path from 'node:path';
import * as imagick from 'imagemagick';
import { decodeMS3D } from '../src/helpers/decodeMS3D.ts';
import { TextureAtlasFrame } from '../src/helpers/GLHelpers.ts';
import { BinaryWriter } from './BinaryWriter.ts';

async function loadTexture(index: number) {
  const prefix = path.resolve(`src/assets/levels/map${index + 1}`);
  const [width, height] = await new Promise<[number, number]>((resolve, reject) => {
    imagick.identify(`${prefix}.jpg`, (err, result: any) => {
      if (err) {
        reject();
      }
      resolve([result.width, result.height]);
    });
  });

  const rawFrames = JSON.parse(fs.readFileSync(`${prefix}.json`, 'utf-8'));
  const frames: TextureAtlasFrame[] = [];
  for (const frame of rawFrames) {
    frames.push({
      name: frame.name,
      x: frame.x / width,
      y: frame.y / height,
      width: frame.width / width,
      height: frame.height / height,
    });
  }

  return frames;
}

async function writeMap(f: BinaryWriter, index: number) {
  const frames = await loadTexture(index);
  const mapFile = fs.readFileSync(path.resolve(`raw_data/maps/${index + 1}/map.ms3d`)).buffer;
  const map = decodeMS3D(mapFile, frames);

  f.writeShort(map.position.length / 3);
  for (let i = 0; i < map.position.length / 3; i++) {
    const p3 = i * 3;
    const p2 = i * 2;

    f.writeFloat(map.position[p3]);
    f.writeFloat(map.position[p3 + 1]);
    f.writeFloat(map.position[p3 + 2]);

    f.writeFloat(map.normal[p3]);
    f.writeFloat(map.normal[p3 + 1]);
    f.writeFloat(map.normal[p3 + 2]);

    f.writeFloat(map.uv[p2]);
    f.writeFloat(map.uv[p2 + 1]);

    f.writeFloat(map.uvStart[p2]);
    f.writeFloat(map.uvStart[p2 + 1]);

    f.writeFloat(map.uvSize[p2]);
    f.writeFloat(map.uvSize[p2 + 1]);
  }

  f.writeShort(map.flatIndices.length);
  for (let i = 0; i < map.flatIndices.length; i++) {
    f.writeShort(map.flatIndices[i]);
  }
}

(async () => {
  for (let i = 0; i < 7; i++) {
    const buffer = new ArrayBuffer(20 * 1024 * 1024);
    const f = new BinaryWriter(buffer);

    f.writeFixedString('LEVL');
    await writeMap(f, i);

    const outBuffer = new DataView(buffer, 0, f.offset);
    await fs.writeFileSync(path.resolve(`src/assets/levels/level${i + 1}.lvl`), outBuffer, {});

    // eslint-disable-next-line no-console
    console.info(`[INFO] Written map ${i + 1}`);
  }
})();
