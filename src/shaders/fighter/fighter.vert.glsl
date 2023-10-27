
#define PI_2 6.283185307179586

in vec3 position;
in vec3 position2;
in vec2 normal;
in vec2 normal2;
in vec2 uv;

uniform mat3 normalMat;
uniform float uFrame;

out vec2 vUv;
out vec3 vPosition;
out vec3 vNormal;
out vec4 vLocalPosition;

void main() {
    vec2 angles1 = normal / 255.0 * PI_2;
    vec2 angles2 = normal2 / 255.0 * PI_2;

    vec3 norm1 = vec3(
        cos(angles1.x) * sin(angles1.y),
        cos(angles1.y),
        sin(angles1.x) * sin(angles1.y)
    );
    vec3 norm2 = vec3(
        cos(angles2.x) * sin(angles2.y),
        cos(angles2.y),
        sin(angles2.x) * sin(angles2.y)
    );

    vec3 pos = mix(position, position2, uFrame) / 64.0;
    vec3 norm = normalize(mix(norm1, norm2, uFrame));

    vNormal = normalMat * norm;
    vUv = uv;

    vec4 vert = modelMat * vec4(pos, 1.0);
    vPosition = vert.xyz;
    vert = viewMat * vert;
    vLocalPosition = vert;
    gl_Position = projMat * vert;
}
