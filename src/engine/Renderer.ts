import { mat4, quat } from 'gl-matrix';
import { GL, screenSize } from '../GL.ts';
import { buildSphere } from '../helpers/BuildSphere.ts';
import { createIndexBuffer, createVertexBuffer } from '../helpers/GLHelpers.ts';
import { Camera } from './Camera.ts';
import { PointLight, SHADOW_SIZE } from './PointLight.ts';
import { Shader } from './Shader.ts';

import ComposeFrag from '@/shaders/compose/compose.frag.glsl?raw';
import ComposeVert from '@/shaders/compose/compose.vert.glsl?raw';
import SphereFrag from '@/shaders/compose/light.frag.glsl?raw';
import SphereVert from '@/shaders/compose/light.vert.glsl?raw';

export class Renderer {
  private static diffuseTexture: WebGLTexture;

  private static positionTexture: WebGLTexture;

  private static normalTexture: WebGLTexture;

  private static depthTexture: WebGLTexture;

  private static composeBuffer: WebGLBuffer;

  private static composeIndexBuffer: WebGLBuffer;

  private static composeShader: Shader;

  private static offscreenBuffer: WebGLFramebuffer;

  private static lightMapBuffer: WebGLFramebuffer;

  private static lightMapTexture: WebGLTexture;

  private static lightSphereBuffer: WebGLBuffer;

  private static lightSphereIndexBuffer: WebGLBuffer;

  private static lightSphereIndexCount: number;

  private static lightSphereShader: Shader;

  public static init() {
    // Building offscreen target
    this.offscreenBuffer = GL.createFramebuffer()!;
    this.composeBuffer = createVertexBuffer(new Float32Array([-1, 1, 1, 1, -1, -1, 1, -1]));
    this.composeIndexBuffer = createIndexBuffer(new Uint16Array([0, 2, 1, 1, 2, 3]));
    this.composeShader = new Shader(ComposeFrag, ComposeVert);

    // Building light mapping target
    const sphere = buildSphere();
    this.lightSphereBuffer = createVertexBuffer(new Float32Array(sphere.vertices));
    this.lightSphereIndexBuffer = createIndexBuffer(new Uint16Array(sphere.indices));
    this.lightSphereIndexCount = sphere.indices.length;
    this.lightMapBuffer = GL.createFramebuffer()!;
    this.lightSphereShader = new Shader(SphereFrag, SphereVert);

    GL.getExtension('EXT_color_buffer_float');
    GL.getExtension('WEBGL_depth_texture');
    GL.depthFunc(GL.LEQUAL);
  }

  public static resize(width: number, height: number) {
    Camera.updateProjection(width / height);

    for (const tex of [
      this.diffuseTexture,
      this.positionTexture,
      this.normalTexture,
      this.depthTexture,
      this.lightMapTexture,
    ]) {
      if (tex) {
        GL.deleteTexture(tex);
      }
    }

    GL.bindFramebuffer(GL.FRAMEBUFFER, this.offscreenBuffer);
    this.diffuseTexture = this.createAttachment(GL.RGBA16F, GL.COLOR_ATTACHMENT0);
    this.positionTexture = this.createAttachment(GL.RGBA16F, GL.COLOR_ATTACHMENT1);
    this.normalTexture = this.createAttachment(GL.RGBA16F, GL.COLOR_ATTACHMENT2);
    this.depthTexture = this.createAttachment(GL.DEPTH_COMPONENT24, GL.DEPTH_ATTACHMENT);
    GL.drawBuffers([
      GL.COLOR_ATTACHMENT0, //
      GL.COLOR_ATTACHMENT1,
      GL.COLOR_ATTACHMENT2,
      GL.NONE,
    ]);

    GL.bindFramebuffer(GL.FRAMEBUFFER, this.lightMapBuffer);
    this.lightMapTexture = this.createAttachment(GL.RGBA8, GL.COLOR_ATTACHMENT0);
    GL.framebufferTexture2D(
      GL.FRAMEBUFFER,
      GL.DEPTH_ATTACHMENT,
      GL.TEXTURE_2D,
      this.depthTexture,
      0,
    );
    GL.drawBuffers([
      GL.COLOR_ATTACHMENT0, //
    ]);

    GL.bindFramebuffer(GL.FRAMEBUFFER, null);
  }

  public static renderScene(renderCallback: () => void, lights: PointLight[]) {
    // Shadows pass - compute depth maps
    GL.enable(GL.SCISSOR_TEST);
    for (const light of lights) {
      for (let i = 0; i < 6; i++) {
        light.setupShadowPass(i);
        GL.colorMask(true, true, true, true);
        GL.depthMask(true);
        GL.disable(GL.BLEND);
        GL.enable(GL.DEPTH_TEST);
        GL.depthFunc(GL.LEQUAL);
        renderCallback();
      }
    }
    GL.disable(GL.SCISSOR_TEST);

    // G-buffer pass
    GL.bindFramebuffer(GL.FRAMEBUFFER, this.offscreenBuffer);
    this.setupViewport();
    GL.clearColor(0.0, 0.0, 0.0, 1.0);
    GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
    GL.disable(GL.BLEND);
    GL.enable(GL.DEPTH_TEST);
    GL.enable(GL.CULL_FACE);
    GL.cullFace(GL.BACK);
    renderCallback();

    // Lights pass - render point lights
    GL.bindFramebuffer(GL.FRAMEBUFFER, this.lightMapBuffer);
    this.setupViewport();
    GL.clearColor(0.15, 0.15, 0.2, 1.0);
    GL.clear(GL.COLOR_BUFFER_BIT);
    GL.depthMask(false);
    GL.cullFace(GL.FRONT);
    GL.enable(GL.BLEND);
    GL.blendFunc(GL.ONE, GL.ONE);
    GL.depthFunc(GL.GEQUAL);
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.lightSphereIndexBuffer);
    const rot = quat.identity(quat.create());
    for (const light of lights) {
      const mat = mat4.fromRotationTranslationScale(mat4.create(), rot, light.position, [
        light.range,
        light.range,
        light.range,
      ]);
      this.lightSphereShader.updateMatrix(mat);

      this.lightSphereShader.bind();
      this.lightSphereShader.setBuffer('position', this.lightSphereBuffer, 3, GL.FLOAT);
      this.lightSphereShader.setTexture('uPosition', this.positionTexture);
      this.lightSphereShader.setTexture('uNormal', this.normalTexture);
      light.setup(this.lightSphereShader);

      GL.drawElements(GL.TRIANGLES, this.lightSphereIndexCount, GL.UNSIGNED_SHORT, 0);
      this.lightSphereShader.unbind();
    }
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, null);
    GL.depthMask(true);
    GL.cullFace(GL.BACK);
    GL.disable(GL.BLEND);
    GL.depthFunc(GL.LEQUAL);

    // Composition pass
    GL.bindFramebuffer(GL.FRAMEBUFFER, null);
    GL.disable(GL.DEPTH_TEST);

    this.composeShader.bind();
    this.composeShader.setBuffer('position', this.composeBuffer, 2, GL.FLOAT, false);

    this.composeShader.setTexture('uDiffuse', this.diffuseTexture);
    this.composeShader.setTexture('uLightmap', this.lightMapTexture);

    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.composeIndexBuffer);
    GL.drawElements(GL.TRIANGLES, 6, GL.UNSIGNED_SHORT, 0);
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, null);
    this.composeShader.unbind();
  }

  public static renderDirect() {
    GL.bindFramebuffer(GL.FRAMEBUFFER, null);
    this.setupViewport();
    GL.clearColor(0.0, 0.0, 0.0, 1.0);
    GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
    GL.disable(GL.BLEND);
    GL.enable(GL.DEPTH_TEST);
    GL.enable(GL.CULL_FACE);
    GL.cullFace(GL.BACK);
  }

  public static setupUI() {
    const w = screenSize[0];
    const h = screenSize[1];

    GL.bindFramebuffer(GL.FRAMEBUFFER, null);
    GL.viewport(0, 0, w, h);
    GL.disable(GL.SCISSOR_TEST);
    GL.disable(GL.DEPTH_TEST);
    GL.disable(GL.CULL_FACE);
    GL.enable(GL.BLEND);
    GL.blendFunc(GL.SRC_ALPHA, GL.ONE_MINUS_SRC_ALPHA);
    Camera.bindUIMatrices();
  }

  private static setupViewport() {
    const w = screenSize[0];
    const h = screenSize[1];

    GL.viewport(0, 0, w, h);
    Camera.bindMatrices();
  }

  private static createAttachment(type: GLenum, attachment: GLenum, shadow: boolean = false) {
    const w = shadow ? SHADOW_SIZE : screenSize[0];
    const h = shadow ? SHADOW_SIZE : screenSize[1];

    const tex = GL.createTexture()!;
    GL.bindTexture(GL.TEXTURE_2D, tex);
    GL.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, false);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.NEAREST);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);
    GL.texStorage2D(GL.TEXTURE_2D, 1, type, w, h);
    GL.framebufferTexture2D(GL.FRAMEBUFFER, attachment, GL.TEXTURE_2D, tex, 0);
    GL.bindTexture(GL.TEXTURE_2D, null);

    return tex;
  }
}
