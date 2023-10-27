
//struct Light {
//    vec3 color;
//    vec3 position;
//    int depthmap;
//    float range;
//};

uniform sampler2D uDiffuse;
uniform sampler2D uLightmap;
//uniform sampler2D uPosition;
//uniform sampler2D uNormal;
//uniform vec3 uCamera;
//uniform Light[8] uLights;
//uniform int uLightCount;


in vec2 vUv;

void main() {
    vec4 diffuse = texture(uDiffuse, vUv);
    vec4 lightmap = texture(uLightmap, vUv);

    /*
    vec4 position = texture(uPosition, vUv);
    vec4 normal = texture(uNormal, vUv);

    vec3 light = vec3(0.3);
    for (int i = 0; i < uLightCount; i++) {
        vec3 dir = uLights[i].position - position.xyz;
        float nDotl = 1.0 - pow(1.0 - max(dot(normalize(dir), normal.xyz), 0.0), 2.0);

        if(nDotl > 0.0) {
            float dist = length(dir);
            if (dist <= uLights[i].range) {
                float factor = 1.0 - (dist / uLights[i].range);
                if (uLights[i].depthmap >= 0) {
//                    factor = 0.5;
                }
                light += uLights[i].color * factor * nDotl;
            }
        }
    }

//    gl_FragColor = vec4(normal.rgb * 0.5 + 0.5, 1.0);
//    gl_FragColor = vec4(normal.rgb * 0.5 + 0.5, 1.0);
//    gl_FragColor = vec4(normal.rgb * 0.5 + 0.5, 1.0);
    gl_FragColor = vec4(diffuse.rgb * light, 1.0);
//    gl_FragColor = vec4(light, 1.0);
    */
    gl_FragColor = vec4(diffuse.rgb * lightmap.rgb, 1.0);

//    gl_FragColor = vec4(lightmap.rgb, 1.0);
}
