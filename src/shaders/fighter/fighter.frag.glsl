
uniform sampler2D uDiffuse;
uniform vec3 uCameraPosition;

in vec2 vUv;
in vec3 vPosition;
in vec3 vNormal;
in vec4 vLocalPosition;

void main() {
    vec3 diffuse = texture(uDiffuse, vUv).rgb;

    fragDiffuse = vec4(diffuse, 1.0);
    fragPosition = vec4(vPosition, 1.0);
    fragNormal = vec4(vNormal, 1.0);
    fragDistance = vec4(length(vLocalPosition.xyz / vLocalPosition.w));
}
