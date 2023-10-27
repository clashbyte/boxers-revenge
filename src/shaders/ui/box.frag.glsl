
uniform vec2 uSize;
uniform vec4 uColor;
uniform float uThickness;

in vec2 vUv;

void main() {
    vec4 color = uColor;
    if (uThickness > 0.0) {
        color.a *= 1.0 - (
            step(uThickness, vUv.x) *
            step(uThickness, vUv.y) *
            step(uThickness, uSize.x - vUv.x) *
            step(uThickness, uSize.y - vUv.y)
        );
    }

    outColor = color;
}
