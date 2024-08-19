
#define PI_2 6.283185307179586

in vec3 position;
in vec3 position2;
in vec2 normal;
in vec2 normal2;

uniform float uFrame;

out vec3 vPosition;
out vec3 vNormal;

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

    vPosition = mix(position, position2, uFrame) / 64.0;
    vNormal = normalize(mix(norm1, norm2, uFrame));

    gl_Position = vec4(vPosition, 1.0);
}
