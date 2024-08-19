import { fileURLToPath, URL } from "url";
import { defineConfig } from "vite";
import glsl from 'vite-plugin-glsl';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    glsl({
      include: [                   // Glob pattern, or array of glob patterns to import
        '**/*.glsl',
      ],
      warnDuplicatedImports: true,
      defaultExtension: 'glsl',
      watch: true,
      compress: true,
      root: '/src/shaders/'
    })
  ],
  resolve: {
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
    ],
  },
});
