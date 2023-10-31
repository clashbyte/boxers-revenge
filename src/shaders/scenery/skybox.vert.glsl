
in vec2 position;

uniform mat4 rotationMat;

out vec2 vUv;

void main() {
    vec3 pos = vec3(position, -1.0);
    vUv = position * 0.5 + 0.5;
    vUv.y = 1.0 - vUv.y;

    gl_Position = projMat * rotationMat * modelMat * vec4(pos, 1.0);
}
