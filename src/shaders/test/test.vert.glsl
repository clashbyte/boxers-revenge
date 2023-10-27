
in vec3 position;
in vec3 position2;
in vec2 uv;

uniform float uFrame;

out vec2 vUv;

void main() {
    vec3 pos = mix(position, position2, uFrame);

    vUv = uv;
    gl_Position = projMat * viewMat * modelMat * vec4(pos, 1.0);
}
