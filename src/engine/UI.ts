import { vec4 } from 'gl-matrix';
import { GL, screenSize } from '../GL.ts';
import { createIndexBuffer, loadTexture } from '../helpers/GLHelpers.ts';
import { Shader } from './Shader.ts';

import FontData from '@/assets/font/font.json';
import FontImage from '@/assets/font/font.png';

import BoxFrag from '@/shaders/ui/box.frag.glsl?raw';
import BoxVert from '@/shaders/ui/box.vert.glsl?raw';
import FontFrag from '@/shaders/ui/font.frag.glsl?raw';
import FontVert from '@/shaders/ui/font.vert.glsl?raw';
import QuadFrag from '@/shaders/ui/quad.frag.glsl?raw';
import QuadVert from '@/shaders/ui/quad.vert.glsl?raw';

interface FontDef {
  glyphs: {
    id: number;
    x: number;
    y: number;
    w: number;
    h: number;
    ox: number;
    oy: number;
    a: number;
  }[];
  kerns: {
    id: number;
    id2: number;
    a: number;
  }[];
  size: [number, number];
  fontSize: [number, number];
}

export enum TextAlign {
  Start,
  Middle,
  End,
}

export class UI {
  private static quadBuffer: WebGLBuffer;

  private static quadIndexBuffer: WebGLBuffer;

  private static fontBuffer: WebGLBuffer;

  private static fontIndexBuffer: WebGLBuffer;

  private static quadShader: Shader;

  private static boxShader: Shader;

  private static fontShader: Shader;

  private static fontDef: FontDef;

  private static fontTexture: WebGLTexture;

  public static async load() {
    this.fontTexture = await loadTexture(FontImage, false);
    this.fontDef = FontData as FontDef;
  }

  public static drawQuad(
    texture: WebGLTexture,
    x: number,
    y: number,
    width: number,
    height: number,
    srcX: number = 0,
    srcY: number = 0,
    srcWidth: number = 1,
    srcHeight: number = 1,
  ) {
    this.checkQuadBuffer();
    if (!this.quadShader) {
      this.quadShader = new Shader(QuadFrag, QuadVert);
    }

    const data = new Float32Array([
      x,
      y,
      srcX,
      srcY,
      x + width,
      y,
      srcX + srcWidth,
      srcY,
      x,
      y + height,
      srcX,
      srcY + srcHeight,
      x + width,
      y + height,
      srcX + srcWidth,
      srcY + srcHeight,
    ]);

    this.quadShader.bind();
    GL.bindBuffer(GL.ARRAY_BUFFER, this.quadBuffer);
    GL.bufferData(GL.ARRAY_BUFFER, data, GL.STREAM_DRAW);
    this.quadShader.setTexture('uDiffuse', texture);
    this.quadShader.setBuffer('position', this.quadBuffer, 2, GL.FLOAT, false, 4 * 4, 0);
    this.quadShader.setBuffer('uv', this.quadBuffer, 2, GL.FLOAT, false, 4 * 4, 2 * 4);
    GL.bindBuffer(GL.ARRAY_BUFFER, null);

    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.quadIndexBuffer);
    GL.drawElements(GL.TRIANGLES, 6, GL.UNSIGNED_SHORT, 0);
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, null);
    this.quadShader.unbind();
  }

  public static drawBox(
    color: vec4,
    x: number,
    y: number,
    width: number,
    height: number,
    thickness: number = 0,
  ) {
    this.checkQuadBuffer();
    if (!this.boxShader) {
      this.boxShader = new Shader(BoxFrag, BoxVert);
    }

    const data = new Float32Array([
      x,
      y,
      0,
      0,
      x + width,
      y,
      width,
      0,
      x,
      y + height,
      0,
      height,
      x + width,
      y + height,
      width,
      height,
    ]);

    this.boxShader.bind();
    GL.bindBuffer(GL.ARRAY_BUFFER, this.quadBuffer);
    GL.bufferData(GL.ARRAY_BUFFER, data, GL.STREAM_DRAW);
    this.boxShader.setBuffer('position', this.quadBuffer, 2, GL.FLOAT, false, 4 * 4, 0);
    this.boxShader.setBuffer('uv', this.quadBuffer, 2, GL.FLOAT, false, 4 * 4, 2 * 4);
    GL.bindBuffer(GL.ARRAY_BUFFER, null);

    GL.uniform1f(this.boxShader.uniform('uThickness'), thickness);
    GL.uniform4fv(this.boxShader.uniform('uColor'), color);
    GL.uniform2f(this.boxShader.uniform('uSize'), width, height);

    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.quadIndexBuffer);
    GL.drawElements(GL.TRIANGLES, 6, GL.UNSIGNED_SHORT, 0);
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, null);
    this.boxShader.unbind();
  }

  public static drawText(
    text: string,
    x: number,
    y: number,
    size: number,
    color: vec4,
    italic: boolean = false,
    horizontal: TextAlign = TextAlign.Start,
    vertical: TextAlign = TextAlign.Start,
  ) {
    const vertexData: number[] = [];
    const s = size / this.fontDef.fontSize[0];
    const tsx = 1.0 / this.fontDef.size[0];
    const tsy = 1.0 / this.fontDef.size[1];

    let px = 0;
    const py = 0;
    let quads: number = 0;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (let i = 0; i < text.length; i++) {
      const ch = text.charCodeAt(i);
      const d = this.fontDef.glyphs.find((gl) => gl.id === ch);
      if (d) {
        if (i < text.length - 1) {
          const nch = text.charCodeAt(i + 1);
          const dd = this.fontDef.kerns.find((kr) => kr.id === ch && kr.id2 === nch);
          if (dd) {
            px += dd.a * s;
          }
        }

        const sx = d.ox * s + px;
        const sy = d.oy * s + py;
        const ex = (d.ox + d.w) * s + px;
        const ey = (d.oy + d.h) * s + py;
        const su = d.x * tsx;
        const sv = d.y * tsy;
        const eu = (d.x + d.w) * tsx;
        const ev = (d.y + d.h) * tsy;

        const its = italic ? (1.0 - d.oy / this.fontDef.fontSize[0] - 0.5) * 8 * s : 0;
        const ite = italic ? (1.0 - (d.oy + d.h) / this.fontDef.fontSize[0] - 0.5) * 8 * s : 0;

        minX = Math.min(sx + its, minX);
        minY = Math.min(minY, 0);
        maxX = Math.max(ex + ite, maxX);
        maxY = Math.max(maxY, this.fontDef.fontSize[0] * s);

        vertexData.push(
          sx + its,
          sy,
          su,
          sv,
          ex + its,
          sy,
          eu,
          sv,
          sx + ite,
          ey,
          su,
          ev,
          ex + ite,
          ey,
          eu,
          ev,
        );
        quads++;
        px += d.a * s;
      }
    }

    const indexData: number[] = [];
    for (let i = 0; i < quads; i++) {
      const v = i * 4;
      indexData.push(v, v + 1, v + 2, v + 1, v + 3, v + 2);
    }

    if (!this.fontShader) {
      this.fontShader = new Shader(FontFrag, FontVert);
    }
    if (!this.fontBuffer) {
      this.fontBuffer = GL.createBuffer()!;
    }
    if (!this.fontIndexBuffer) {
      this.fontIndexBuffer = GL.createBuffer()!;
    }

    GL.bindBuffer(GL.ARRAY_BUFFER, this.fontBuffer);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(vertexData), GL.STREAM_DRAW);
    GL.bindBuffer(GL.ARRAY_BUFFER, null);

    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.fontIndexBuffer);
    GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), GL.STREAM_DRAW);
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, null);

    this.fontShader.bind();
    this.fontShader.setBuffer('position', this.fontBuffer, 2, GL.FLOAT, false, 4 * 4, 0);
    this.fontShader.setBuffer('uv', this.fontBuffer, 2, GL.FLOAT, false, 4 * 4, 2 * 4);
    this.fontShader.setTexture('uDiffuse', this.fontTexture);
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.fontIndexBuffer);

    GL.uniform2f(
      this.fontShader.uniform('uPosition'),
      x - maxX * (horizontal / 2),
      y - maxY * (vertical / 2),
    );
    GL.uniform4fv(this.fontShader.uniform('uColor'), color);
    GL.drawElements(GL.TRIANGLES, quads * 6, GL.UNSIGNED_SHORT, 0);

    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, null);
    this.fontShader.unbind();
  }

  public static drawFade(fill: number) {
    const w = screenSize[0];
    const h = screenSize[1];
    const off = (768 / h) * w * 0.5;
    this.drawBox([0, 0, 0, fill], -off, 0, 1024 + off * 2, 768);
  }

  private static checkQuadBuffer() {
    if (!this.quadBuffer) {
      this.quadBuffer = GL.createBuffer()!;
    }
    if (!this.quadIndexBuffer) {
      this.quadIndexBuffer = createIndexBuffer(new Uint16Array([0, 1, 2, 1, 3, 2]));
    }
  }
}
