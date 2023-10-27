
in vec2 position;
in vec2 uv;

out vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projMat * vec4(position, 0.0, 1.0);
}
