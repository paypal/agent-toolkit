import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/modelcontextprotocol/index.ts'],
  clean: true,
  dts: true,
  format: ['cjs', 'esm'],
  sourcemap: true,
  target: 'node18',
});