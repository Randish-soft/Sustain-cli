import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  // Add these to ensure proper exports
  bundle: true,
  minify: false,
  skipNodeModulesBundle: true,
  target: 'node16',
  platform: 'node',
  // Ensure all exports are preserved
  noExternal: [],
  external: []
});