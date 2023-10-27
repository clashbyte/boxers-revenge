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

(async () => {
  const data = JSON.parse(fs.readFileSync(path.resolve('raw_data/fonts/font.json'), 'utf-8'));

  const fontSize = [1, 1];
  const size = [1, 1];
  const glyphs: Glyph[] = [];
  const kerns: Kerning[] = [];

  for (const f of data.chars) {
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
  }

  for (const f of data.kernings) {
    kerns.push({
      id: f.first as number,
      id2: f.second as number,
      a: f.amount as number,
    });
  }

  size[0] = data.common.scaleW;
  size[1] = data.common.scaleH;
  fontSize[0] = data.info.size;
  fontSize[1] = data.common.lineHeight;

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
