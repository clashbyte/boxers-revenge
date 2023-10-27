
uniform sampler2D uDiffuse;
uniform vec4 uColor;

in vec2 vUv;

float median(float r, float g, float b) {
    return max(min(r, g), min(max(r, g), b));
}

void main() {
    vec3 s = texture(uDiffuse, vUv).rgb;
    float sigDist = median(s.r, s.g, s.b) - 0.5;
    float afwidth = 1.4142135623730951 / 2.0;
    float alpha = clamp(sigDist / fwidth(sigDist) + 0.5, 0.0, 1.0);

    outColor = vec4(uColor.rgb, uColor.a * alpha);
}
