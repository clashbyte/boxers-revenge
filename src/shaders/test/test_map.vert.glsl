
in vec3 position;
in vec2 uv;
in vec2 uvStart;
in vec2 uvSize;

uniform float uFrame;

out vec2 vUv;
out vec2 vUvStart;
out vec2 vUvSize;

void main() {
    vec3 pos = position;

    vUv = uv;
    vUvStart = uvStart;
    vUvSize = uvSize;
    gl_Position = projMat * viewMat * modelMat * vec4(pos, 1.0);
}
