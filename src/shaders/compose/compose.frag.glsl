

uniform sampler2D uDiffuse;
uniform sampler2D uLightmap;
uniform float uBlackWhite;

in vec2 vUv;

vec3 czm_luminance(vec3 rgb) {
    // Algorithm from Chapter 10 of Graphics Shaders.
    const vec3 W = vec3(0.2125, 0.7154, 0.0721);
    return vec3(dot(rgb, W));
}

void main() {
    vec4 diffuse = texture(uDiffuse, vUv);
    vec4 lightmap = texture(uLightmap, vUv);
    vec3 final = diffuse.rgb * mix(vec3(1.0), lightmap.rgb, diffuse.a);
    final = mix(final, czm_luminance(final) * 1.5, uBlackWhite);

    gl_FragColor = vec4(final, 1.0);
}
