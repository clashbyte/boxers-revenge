
uniform sampler2D uDiffuse;

in vec2 vUv;

void main() {
    vec3 color = texture(uDiffuse, vUv).rgb;
    color.r = pow(color.r, 2.3);
    color.g = pow(color.g, 2.3);
    color.b = pow(color.b, 2.3);

    gl_FragColor = vec4(color, 0.0);
}
