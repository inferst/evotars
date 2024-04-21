import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import pkg from './package.json' assert { type: 'json' };

export default defineConfig({
  plugins: [dts()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'evotars',
      fileName: 'evotars',
    },
    copyPublicDir: false,
    rollupOptions: {
      external: [...Object.keys(pkg.dependencies)],
      output: {
        globals: {
          'pixi.js': 'PIXI',
          tinycolor2: 'tinycolor',
          '@tweenjs/tween.js': 'TWEEN',
        },
      },
    },
  },
});
