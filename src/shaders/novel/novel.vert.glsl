
in vec2 position;
in vec2 uv;

uniform float uOffset;

out vec2 vUv;

void main() {
    vec3 pos = vec3(position.x, 0.0, -position.y);
    float dist = pow(1.0 - clamp(distance(uv, vec2(1.0, 0.0)), 0.0, 1.0), 2.0) * uOffset;

    pos.y += 0.8 * dist;
    pos.xz += vec2(-0.1, 0.1) * dist;

    vUv = uv;
    gl_Position = projMat * viewMat * modelMat * vec4(pos, 1.0);
}
