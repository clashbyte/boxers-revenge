
#define SUB 0.002

uniform sampler2D uDiffuse;
uniform vec3 uCameraPosition;

in vec2 vUv;
in vec2 vUvStart;
in vec2 vUvSize;
in vec3 vPosition;
in vec3 vNormal;
in vec3 vLocalPosition;

void main() {
    vec2 uv = (fract(vUv) * (1.0 - SUB * 2.0) + SUB) * vUvSize + vUvStart;

    vec3 diffuse = texture(uDiffuse, uv).rgb;

    fragDiffuse = vec4(diffuse, 1.0);
    fragPosition = vec4(vPosition, 1.0);
    fragNormal = vec4(vNormal, 1.0);
    fragDistance = vec4(length(vLocalPosition));
}
