import fs from 'fs';
import path from 'node:path';

interface Glyph {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  ox: number;
  oy: number;
  a: number;
}

interface Kerning {
  id: number;
  id2: number;
  a: number;
}

function parseParams(line: string) {
  const out: { [key: string]: string | number } = {};
  const fields = line.split(' ');
  for (const field of fields) {
    const parts = field.split('=');
    if (parts.length === 2) {
      if (parts[1].includes('"')) {
        out[parts[0]] = parts[1].substring(1, parts[1].lastIndexOf('"'));
      } else {
        out[parts[0]] = Number.parseFloat(parts[1]);
      }
    } else {
      [out.type] = parts;
    }
  }

  return out;
}

(async () => {
  const lines = fs
    .readFileSync(path.resolve('raw_data/fonts/font.txt'), 'utf-8')
    .split('\n')
    .filter((ln) => ln.length > 0);

  const fontSize = [1, 1];
  const size = [1, 1];
  const glyphs: Glyph[] = [];
  const kerns: Kerning[] = [];

  for (const line of lines) {
    const f = parseParams(line);
    if (f.type === 'char') {
      glyphs.push({
        id: f.id as number,
        x: f.x as number,
        y: f.y as number,
        w: f.width as number,
        h: f.height as number,
        ox: f.xoffset as number,
        oy: f.yoffset as number,
        a: f.xadvance as number,
      });
    } else if (f.type === 'kerning') {
      kerns.push({
        id: f.first as number,
        id2: f.second as number,
        a: f.amount as number,
      });
    } else if (f.type === 'common') {
      size[0] = f.scaleW as number;
      size[1] = f.scaleH as number;
      fontSize[1] = f.lineHeight as number;
    } else if (f.type === 'info') {
      fontSize[0] = f.size as number;
    }
  }

  fs.writeFileSync(
    path.resolve('src/assets/font/font.json'),
    JSON.stringify({
      glyphs,
      kerns,
      size,
      fontSize,
    }),
    {
      encoding: 'utf-8',
    },
  );

  // eslint-disable-next-line no-console
  console.info('[INFO] Written font');
})();
