import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

import path, { resolve } from 'node:path';

export default defineConfig(() => {
  return {
    resolve: {
      alias: {
        '@local': path.resolve(__dirname, './src'),
      },
    },
    plugins: [
      dts({
        tsconfigPath: './tsconfig.json',
        outDir: './build',
        entryRoot: './src',
        compilerOptions: {
          rootDir: './src'
        },
        insertTypesEntry: true,
        logLevel: 'info'
      })
    ],
    publicDir: false,
    build: {
      sourcemap: true,
      outDir: './build',
      rootDir: './src',
      lib: {
        entry: {
          index: resolve(__dirname, 'src/index.ts'),
        },
        formats: ['es', 'cjs'],
        fileName: (format, name) => `${name}.${format}.js`,
      },
      rollupOptions: {
        // Add external dependencies that shouldn't be bundled into the library
        external: ['node:util'],
        output: {
          globals: {},
        },
      },
    },
  };
});
