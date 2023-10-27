
uniform sampler2D uDiffuse;

in vec2 vUv;

void main() {
    gl_FragColor = vec4(texture(uDiffuse, vUv).rgb, 1.0);
}
