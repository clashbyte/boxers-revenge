import { mat4, quat, vec3 } from 'gl-matrix';
import { Shader } from './Shader';

const EMPTY_MATRIX = mat4.create();

/**
 * Class for camera handling
 */
export class Camera {
  /**
   * WebGL View matrix
   * @type {mat4}
   * @private
   */
  private static readonly viewMatrix: mat4 = mat4.identity(mat4.create());

  /**
   * Complete combined matrix
   * @type {mat4}
   * @private
   */
  private static readonly cameraMatrix: mat4 = mat4.identity(mat4.create());

  /**
   * Projection matrix
   * @type {mat4}
   * @private
   */
  private static readonly projMatrix: mat4 = mat4.identity(mat4.create());

  /**
   * UI matrix
   * @private
   */
  private static readonly uiProjMatrix: mat4 = mat4.identity(mat4.create());

  /**
   * Camera position
   * @type {vec3}
   * @private
   */
  private static readonly pos: vec3 = vec3.fromValues(0, 0, 0);

  /**
   * Camera rotation in Euler angles
   * @type {vec3}
   * @private
   */
  private static readonly rot: vec3 = vec3.fromValues(0, 0, 0);

  /**
   * Flag that position/rotation changed
   * @type {boolean}
   * @private
   */
  private static matrixDirty: boolean = true;

  /**
   * Get camera position vector
   * @returns {any}
   */
  public static get position() {
    return vec3.fromValues(this.pos[0], this.pos[1], this.pos[2]);
  }

  /**
   * Update camera position vector
   * @param {vec3} value
   */
  public static set position(value: vec3) {
    if (!vec3.equals(this.pos, value)) {
      vec3.copy(this.pos, value);
      this.matrixDirty = true;
    }
  }

  /**
   * Get camera angles
   * @returns {vec3}
   */
  public static get rotation() {
    return vec3.fromValues(this.rot[0], this.rot[1], this.rot[2]);
  }

  /**
   * Update camera rotation
   * @param {vec3} value
   */
  public static set rotation(value: vec3) {
    if (!vec3.equals(this.rot, value)) {
      vec3.copy(this.rot, value);
      this.matrixDirty = true;
    }
  }

  /**
   * Point camera to specific target
   * @param position
   * @param target
   */
  public static lookAt(position: vec3, target: vec3) {
    const diff = vec3.sub(vec3.create(), target, position);
    const len = Math.hypot(diff[2], diff[0]);
    if (len > 0) {
      const yaw = (Math.atan2(-diff[0], -diff[2]) * 180) / Math.PI;
      const pitch = (Math.atan2(diff[1], len) * 180) / Math.PI;
      this.rotation = [pitch, yaw, 0];
    }
    this.position = position;
  }

  /**
   * Update projection with screen aspect
   * @param {number} aspect
   */
  public static updateProjection(aspect: number) {
    mat4.perspective(this.projMatrix, 0.9, aspect, 0.05, 400);

    const sizeY = 768;
    const sizeX = sizeY * aspect;
    const diffX = (sizeX - 1024) / 2;

    mat4.ortho(this.uiProjMatrix, -diffX, sizeX - diffX, sizeY, 0, -1, 1);
  }

  /**
   * Updating matrix bindings for shaders
   */
  public static bindMatrices() {
    this.updateMatrices();
    Shader.updateCamera(this.viewMatrix, this.projMatrix);
  }

  /**
   * Interface camera
   */
  public static bindUIMatrices() {
    Shader.updateCamera(EMPTY_MATRIX, this.uiProjMatrix);
  }

  /**
   * Recalculate all matrices on changes
   * @private
   */
  private static updateMatrices() {
    if (this.matrixDirty) {
      mat4.fromRotationTranslation(
        this.cameraMatrix,
        quat.fromEuler(quat.create(), this.rot[0], this.rot[1], this.rot[2]),
        this.pos,
      );

      mat4.invert(this.viewMatrix, this.cameraMatrix);
      this.matrixDirty = false;
    }
  }
}
