import { Shader } from '../engine/Shader.ts';
import { GL } from '../GL.ts';
import { LVLModel } from '../helpers/decodeLVL.ts';
import { createIndexBuffer, createVertexBuffer } from '../helpers/GLHelpers.ts';

import SceneryFrag from '@/shaders/scenery/scenery.frag.glsl?raw';
import SceneryVert from '@/shaders/scenery/scenery.vert.glsl?raw';

export class SceneryMesh {
  private readonly mesh: LVLModel;

  private readonly geometryBuffer: WebGLBuffer;

  private readonly indexBuffer: WebGLBuffer;

  private readonly shader: Shader;

  private readonly texture: WebGLTexture;

  private readonly vao: WebGLVertexArrayObject;

  public constructor(mesh: LVLModel, texture: WebGLTexture) {
    this.mesh = mesh;

    this.geometryBuffer = createVertexBuffer(mesh.geometry);
    this.indexBuffer = createIndexBuffer(new Uint16Array(mesh.indices.buffer));
    this.texture = texture;

    this.shader = new Shader(SceneryFrag, SceneryVert, true);

    this.vao = GL.createVertexArray()!;
    this.shader.bind();
    GL.bindVertexArray(this.vao);
    this.shader.setBuffer('position', this.geometryBuffer, 3, GL.FLOAT, false, 48, 0);
    this.shader.setBuffer('normal', this.geometryBuffer, 3, GL.FLOAT, true, 48, 12);
    this.shader.setBuffer('uv', this.geometryBuffer, 2, GL.FLOAT, false, 48, 24);
    this.shader.setBuffer('uvStart', this.geometryBuffer, 2, GL.FLOAT, false, 48, 32);
    this.shader.setBuffer('uvSize', this.geometryBuffer, 2, GL.FLOAT, false, 48, 40);
    GL.bindVertexArray(null);
    this.shader.unbind();
  }

  public render() {
    this.shader.bind();
    GL.bindVertexArray(this.vao);
    this.shader.setTexture('uDiffuse', this.texture);
    this.shader.draw(this.indexBuffer, this.mesh.indexCount);
    this.shader.unbind();
    GL.bindVertexArray(null);
  }
}
