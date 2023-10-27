import { mat4, quat } from 'gl-matrix';
import { Shader } from '../engine/Shader.ts';
import { GL } from '../GL.ts';
import { easeInCirc, easeInOutQuad, easeInQuad, easeOutCubic } from '../helpers/Easings.ts';
import { createIndexBuffer, createVertexBuffer } from '../helpers/GLHelpers.ts';

import { invLerp, lerp } from '../helpers/MathUtils.ts';
import NovelFrag from '@/shaders/novel/novel.frag.glsl?raw';
import NovelVert from '@/shaders/novel/novel.vert.glsl?raw';

export class NovelMesh {
  private static readonly DIVS_Y = 10;

  private static readonly DIVS_X = Math.floor((NovelMesh.DIVS_Y * 1024) / 768);

  private static shader: Shader;

  private static buffer: WebGLBuffer;

  private static indexBuffer: WebGLBuffer;

  private static indexCount: number;

  private static vao: WebGLVertexArrayObject;

  // private readonly angle: number;

  private readonly matrix: mat4;

  private bendOffset: number;

  private redOffset: number;

  private darkenOffset: number;

  public constructor(private readonly texture: WebGLTexture) {
    if (!NovelMesh.shader) {
      NovelMesh.shader = new Shader(NovelFrag, NovelVert);
    }
    if (!NovelMesh.buffer) {
      const xSize = 1024 / 768;
      const ySize = 1;
      const verts: number[] = [];
      for (let y = 0; y <= NovelMesh.DIVS_Y; y++) {
        for (let x = 0; x <= NovelMesh.DIVS_X; x++) {
          const u = x / NovelMesh.DIVS_X;
          const v = y / NovelMesh.DIVS_Y;
          verts.push(lerp(-xSize, xSize, u), lerp(ySize, -ySize, v), u, v);
        }
      }

      NovelMesh.buffer = createVertexBuffer(new Float32Array(verts));
    }
    if (!NovelMesh.indexBuffer) {
      const indices: number[] = [];
      const rowVerts = NovelMesh.DIVS_X + 1;

      for (let y = 1; y <= NovelMesh.DIVS_Y; y++) {
        for (let x = 1; x <= NovelMesh.DIVS_X; x++) {
          const idx = y * rowVerts + x;
          indices.push(idx - rowVerts, idx - rowVerts - 1, idx - 1, idx - rowVerts, idx - 1, idx);
        }
      }

      NovelMesh.indexBuffer = createIndexBuffer(new Uint16Array(indices));
      NovelMesh.indexCount = indices.length;
    }

    if (!NovelMesh.vao) {
      NovelMesh.vao = GL.createVertexArray()!;
      const { shader, vao, buffer } = NovelMesh;
      GL.bindVertexArray(vao);
      shader.bind();
      shader.setBuffer('position', buffer, 2, GL.FLOAT, false, 4 * 4, 0);
      shader.setBuffer('uv', buffer, 2, GL.FLOAT, false, 4 * 4, 2 * 4);
      GL.bindVertexArray(null);
      shader.unbind();
    }

    this.bendOffset = 0;
    this.redOffset = 0;
    this.darkenOffset = 0;
    // this.angle = 0;
    this.matrix = mat4.create();
  }

  public update(delta: number, angle: number, index: number) {
    const d = delta * 3;
    const shiftFactor = easeInQuad(invLerp(d, 0.1, 0.0));
    const bendFactor = easeInCirc(invLerp(d, 0.15, 0.05));
    const darkFactor = easeOutCubic(invLerp(delta, 1, 1.1));
    const redFactor = easeInOutQuad(invLerp(delta, 0.05, 0.2));

    const rot = quat.fromEuler(
      quat.create(),
      0,
      angle + shiftFactor * (index % 2 === 0 ? -1 : 1) * 50,
      0,
    );
    mat4.fromRotationTranslation(this.matrix, rot, [
      0,
      shiftFactor * 2 + index * 0.02,
      -shiftFactor * 1.5,
    ]);

    this.bendOffset = bendFactor;
    this.darkenOffset = darkFactor;
    this.redOffset = redFactor;
  }

  public render() {
    const { shader, vao, indexBuffer, indexCount } = NovelMesh;
    shader.updateMatrix(this.matrix);
    shader.bind();
    GL.bindVertexArray(vao);

    shader.setTexture('uDiffuse', this.texture);
    GL.uniform1f(shader.uniform('uDarken'), this.darkenOffset);
    GL.uniform1f(shader.uniform('uRed'), this.redOffset);
    GL.uniform1f(shader.uniform('uOffset'), this.bendOffset);

    shader.draw(indexBuffer, indexCount);
    GL.bindVertexArray(null);
    shader.unbind();
  }
}
