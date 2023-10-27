
uniform sampler2D uDiffuse;

in vec2 vUv;

void main() {
    outColor = texture(uDiffuse, vUv);
}
