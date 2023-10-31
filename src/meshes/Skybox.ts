import { mat4, quat } from 'gl-matrix';
import { Camera } from '../engine/Camera.ts';
import { Shader } from '../engine/Shader.ts';
import { GL } from '../GL.ts';
import { createIndexBuffer, createVertexBuffer, loadTexture } from '../helpers/GLHelpers.ts';

import TexLeft from '@/assets/skybox/negx.jpg';
import TexRight from '@/assets/skybox/posx.jpg';
import TexTop from '@/assets/skybox/posy.jpg';
import TexFront from '@/assets/skybox/posz.jpg';
import SkyboxFrag from '@/shaders/scenery/skybox.frag.glsl?raw';
import SkyboxVert from '@/shaders/scenery/skybox.vert.glsl?raw';

const TEXTURE_FILES: string[] = [TexFront, TexLeft, TexRight, TexTop];

export class Skybox {
  private static buffer: WebGLBuffer;

  private static indexBuffer: WebGLBuffer;

  private static textures: WebGLTexture[];

  private static shader: Shader;

  private static readonly matrices: mat4[] = [
    mat4.create(),
    mat4.fromRotation(mat4.create(), Math.PI * 0.5, [0, 1, 0]),
    mat4.fromRotation(mat4.create(), Math.PI * -0.5, [0, 1, 0]),
    mat4.fromRotation(mat4.create(), Math.PI * 0.5, [1, 0, 0]),
  ];

  public static async preload() {
    if (!this.textures) {
      this.textures = await Promise.all(TEXTURE_FILES.map((url) => loadTexture(url, false)));
    }
    if (!this.shader) {
      this.shader = new Shader(SkyboxFrag, SkyboxVert);
    }
  }

  public static render() {
    if (!this.buffer) {
      this.buildMesh();
    }

    const r = Camera.rotation;
    const rotQuat = quat.fromEuler(quat.create(), r[0], r[1], r[2]);

    const subMat = mat4.create();
    mat4.fromQuat(subMat, rotQuat);
    mat4.invert(subMat, subMat);

    this.shader.bind();
    this.shader.setBuffer('position', this.buffer, 2, GL.FLOAT);
    GL.uniformMatrix4fv(this.shader.uniform('rotationMat'), false, subMat);

    for (let i = 0; i < this.matrices.length; i++) {
      GL.uniformMatrix4fv(this.shader.uniform('modelMat'), false, this.matrices[i]);
      this.shader.setTexture('uDiffuse', this.textures[i]);
      this.shader.draw(this.indexBuffer, 6);
    }

    this.shader.unbind();
  }

  private static buildMesh() {
    this.buffer = createVertexBuffer(
      new Float32Array([-1, 1, 1, 1, -1, -1, 1, -1]),
      GL.STATIC_DRAW,
    );
    this.indexBuffer = createIndexBuffer(new Uint16Array([0, 1, 2, 1, 3, 2]));
  }
}
