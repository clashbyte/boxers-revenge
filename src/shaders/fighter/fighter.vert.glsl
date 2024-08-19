
in vec3 position;
in vec3 normal;
in vec2 uv;

uniform mat3 normalMat;
uniform float uFrame;

out vec2 vUv;
out vec3 vPosition;
out vec3 vNormal;
out vec4 vLocalPosition;

void main() {
    vNormal = normalMat * normal;
    vUv = uv;

    vec4 vert = modelMat * vec4(position, 1.0);
    vPosition = vert.xyz;
    vert = viewMat * vert;
    vLocalPosition = vert;
    gl_Position = projMat * vert;
}
