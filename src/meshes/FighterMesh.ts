import { mat3, mat4, quat, vec3 } from 'gl-matrix';
import { Shader } from '../engine/Shader.ts';
import { GL } from '../GL.ts';
import { FGTModel } from '../helpers/decodeFGT.ts';
import { createIndexBuffer, createVertexBuffer } from '../helpers/GLHelpers.ts';

import TestFrag from '@/shaders/fighter/fighter.frag.glsl?raw';
import TestVert from '@/shaders/fighter/fighter.vert.glsl?raw';

export class FighterMesh {
  private readonly mesh: FGTModel;

  private readonly vertexBuffer: WebGLBuffer;

  private readonly uvBuffer: WebGLBuffer;

  private readonly indexBuffer: WebGLBuffer;

  private static shader: Shader;

  private readonly texture: WebGLTexture;

  private frame1: number = 0;

  private frame2: number = 1;

  private frameDelta: number = 0;

  private readonly frameSize: number;

  private readonly matrix: mat4;

  private readonly normalMatrix: mat3;

  public constructor(mesh: FGTModel, texture: WebGLTexture) {
    this.mesh = mesh;

    this.frameSize = mesh.vertexCount * 8;
    this.vertexBuffer = createVertexBuffer(mesh.frames);
    this.uvBuffer = createVertexBuffer(mesh.uv);
    this.indexBuffer = createIndexBuffer(new Uint16Array(mesh.indices.buffer));
    this.texture = texture;

    if (!FighterMesh.shader) {
      FighterMesh.shader = new Shader(TestFrag, TestVert, true);
    }

    this.matrix = mat4.fromRotationTranslationScale(
      mat4.create(),
      quat.create(),
      vec3.fromValues(0, -1.9, 0),
      vec3.fromValues(0.06, 0.06, 0.06),
    );
    this.normalMatrix = mat3.identity(mat3.create());
  }

  public setPosition(position: number, rotated: boolean | number = false) {
    const angle = typeof rotated === 'number' ? rotated : rotated ? 180 : 0;
    const rot = quat.fromEuler(quat.create(), 0, angle, 0);
    mat3.fromQuat(this.normalMatrix, rot);
    mat4.fromRotationTranslationScale(
      this.matrix,
      rot,
      vec3.fromValues(position, -1.85, 0),
      vec3.fromValues(0.06, 0.06, 0.06),
    );
  }

  public setFrame(frame1: number, frame2: number, delta: number) {
    this.frameDelta = delta;
    this.frame1 = frame1;
    this.frame2 = frame2;
  }

  public render() {
    const { shader } = FighterMesh;
    shader.updateMatrix(this.matrix);

    shader.bind();
    shader.setBuffer(
      'position',
      this.vertexBuffer,
      3,
      GL.SHORT,
      false,
      8,
      this.frameSize * this.frame1,
    );
    shader.setBuffer(
      'position2',
      this.vertexBuffer,
      3,
      GL.SHORT,
      false,
      8,
      this.frameSize * this.frame2,
    );
    shader.setBuffer(
      'normal',
      this.vertexBuffer,
      2,
      GL.UNSIGNED_BYTE,
      false,
      8,
      this.frameSize * this.frame1 + 6,
    );
    shader.setBuffer(
      'normal2',
      this.vertexBuffer,
      2,
      GL.UNSIGNED_BYTE,
      false,
      8,
      this.frameSize * this.frame2 + 6,
    );
    shader.setBuffer('uv', this.uvBuffer, 2, GL.FLOAT);

    shader.setTexture('uDiffuse', this.texture);
    GL.uniform1f(shader.uniform('uFrame'), this.frameDelta);
    GL.uniformMatrix3fv(shader.uniform('normalMat'), false, this.normalMatrix);

    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    GL.drawElements(GL.TRIANGLES, this.mesh.indexCount, GL.UNSIGNED_SHORT, 0);

    shader.unbind();
  }
}
