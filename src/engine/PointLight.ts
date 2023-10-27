import { mat4, vec3 } from 'gl-matrix';
import { GL } from '../GL.ts';
import { Shader } from './Shader.ts';

export const SHADOW_SIZE = 512;

const CUBE_LOOK_DIR = [
  vec3.fromValues(1.0, 0.0, 0.0),
  vec3.fromValues(-1.0, 0.0, 0.0),
  vec3.fromValues(0.0, 0.0, 1.0),
  vec3.fromValues(0.0, 0.0, -1.0),
  vec3.fromValues(0.0, 1.0, 0.0),
  vec3.fromValues(0.0, -1.0, 0.0),
];

const CUBE_LOOK_UP = [
  vec3.fromValues(0.0, 1.0, 0.0),
  vec3.fromValues(0.0, 1.0, 0.0),
  vec3.fromValues(0.0, 1.0, 0.0),
  vec3.fromValues(0.0, 1.0, 0.0),
  vec3.fromValues(0.0, 0.0, 1.0),
  vec3.fromValues(0.0, 0.0, -1.0),
];

const CUBE_OFFSET: [number, number][] = [
  [2, 1],
  [0, 1],
  [3, 1],
  [1, 1],
  [3, 0],
  [1, 0],
];

export class PointLight {
  private static emptyTexture: WebGLTexture | null = null;

  private readonly framebuffer: WebGLFramebuffer;

  private readonly depthTexture: WebGLTexture;

  private readonly localPosition: vec3;

  private readonly localColor: vec3;

  private localRange: number;

  private readonly projMatrix: mat4;

  private readonly viewMatrix: mat4[];

  private dirtyView: boolean;

  private dirtyProj: boolean;

  public get position() {
    return vec3.clone(this.localPosition);
  }

  public set position(value: vec3) {
    if (!vec3.equals(value, this.localPosition)) {
      vec3.copy(this.localPosition, value);
      this.dirtyView = true;
    }
  }

  public get range() {
    return this.localRange;
  }

  public set range(value: number) {
    if (this.localRange !== value) {
      this.localRange = value;
      this.dirtyProj = true;
    }
  }

  public get color() {
    return vec3.clone(this.localColor);
  }

  public set color(value: vec3) {
    vec3.copy(this.localColor, value);
  }

  public constructor(position: vec3, range: number, color: vec3) {
    this.localPosition = vec3.clone(position);
    this.localRange = range;
    this.localColor = vec3.clone(color);

    this.projMatrix = mat4.create();
    this.viewMatrix = [
      mat4.create(),
      mat4.create(),
      mat4.create(),
      mat4.create(),
      mat4.create(),
      mat4.create(),
    ];

    if (!PointLight.emptyTexture) {
      const tex = GL.createTexture()!;
      GL.bindTexture(GL.TEXTURE_2D, tex);
      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);
      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST);
      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.NEAREST);
      GL.texStorage2D(GL.TEXTURE_2D, 1, GL.DEPTH_COMPONENT24, SHADOW_SIZE * 4, SHADOW_SIZE * 2);
      GL.bindTexture(GL.TEXTURE_2D, null);
      PointLight.emptyTexture = tex;
    }

    this.depthTexture = GL.createTexture()!;
    GL.bindTexture(GL.TEXTURE_2D, this.depthTexture);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
    GL.texStorage2D(GL.TEXTURE_2D, 1, GL.R16F, SHADOW_SIZE * 4, SHADOW_SIZE * 2);
    GL.bindTexture(GL.TEXTURE_2D, null);

    this.framebuffer = GL.createFramebuffer()!;
    GL.bindFramebuffer(GL.FRAMEBUFFER, this.framebuffer);
    GL.bindTexture(GL.TEXTURE_2D, PointLight.emptyTexture);
    GL.framebufferTexture2D(
      GL.FRAMEBUFFER,
      GL.COLOR_ATTACHMENT3,
      GL.TEXTURE_2D,
      this.depthTexture,
      0,
    );
    GL.bindTexture(GL.TEXTURE_2D, this.depthTexture);
    GL.framebufferTexture2D(
      GL.FRAMEBUFFER,
      GL.DEPTH_ATTACHMENT,
      GL.TEXTURE_2D,
      PointLight.emptyTexture,
      0,
    );
    GL.bindTexture(GL.TEXTURE_2D, null);
    GL.drawBuffers([GL.NONE, GL.NONE, GL.NONE, GL.COLOR_ATTACHMENT3]);
    GL.bindFramebuffer(GL.FRAMEBUFFER, null);

    this.dirtyProj = true;
    this.dirtyView = true;
  }

  public setup(shader: Shader) {
    GL.uniform3fv(shader.uniform('uLightPosition'), this.localPosition);
    GL.uniform3fv(shader.uniform('uLightColor'), this.localColor);
    GL.uniform1f(shader.uniform('uLightRange'), this.localRange);
    shader.setTexture('uShadowMap', this.depthTexture);
  }

  public setupShadowPass(index: number) {
    if (this.dirtyProj) {
      mat4.perspective(this.projMatrix, Math.PI * 0.5, 1, 0.05, this.localRange);
      this.dirtyProj = false;
    }
    if (this.dirtyView) {
      for (let i = 0; i < 6; i++) {
        mat4.lookAt(
          this.viewMatrix[i],
          this.localPosition,
          vec3.add(vec3.create(), this.localPosition, CUBE_LOOK_DIR[i]),
          CUBE_LOOK_UP[i],
        );
      }
      this.dirtyView = false;
    }

    const ox = CUBE_OFFSET[index][0] * SHADOW_SIZE;
    const oy = CUBE_OFFSET[index][1] * SHADOW_SIZE;
    GL.bindFramebuffer(GL.FRAMEBUFFER, this.framebuffer);
    GL.viewport(ox, oy, SHADOW_SIZE, SHADOW_SIZE);
    GL.scissor(ox, oy, SHADOW_SIZE, SHADOW_SIZE);
    GL.clear(GL.DEPTH_BUFFER_BIT);
    Shader.updateCamera(this.viewMatrix[index], this.projMatrix);
  }
}
