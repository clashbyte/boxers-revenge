
uniform sampler2D uDiffuse;

in vec2 vUv;
in vec2 vUvStart;
in vec2 vUvSize;

void main() {
    vec2 uv = fract(vUv) * vUvSize + vUvStart;

    gl_FragColor = vec4(texture(uDiffuse, uv).rgb, 1.0);
}
