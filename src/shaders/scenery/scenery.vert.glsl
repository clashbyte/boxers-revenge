
in vec3 position;
in vec3 normal;
in vec2 uv;
in vec2 uvStart;
in vec2 uvSize;

uniform float uFrame;

out vec2 vUv;
out vec2 vUvStart;
out vec2 vUvSize;
out vec3 vPosition;
out vec3 vNormal;
out vec3 vLocalPosition;

void main() {
    vec3 pos = position;

    vNormal = normal;
    vUv = uv;
    vUvStart = uvStart;
    vUvSize = uvSize;

    vec4 vert = modelMat * vec4(pos, 1.0);
    vPosition = vert.xyz;
    vert = viewMat * vert;
    vLocalPosition = vert.xyz;
    gl_Position = projMat * vert;
}
