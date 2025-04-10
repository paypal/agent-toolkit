import { defineConfig } from 'tsup';

export default defineConfig([{ // Define multiple entry points
    entry: ["src/ai-sdk/index.ts"],
    outDir: "ai-sdk",
    format: ["cjs", "esm"], // Output both CommonJS and ESM
    dts: true,
    clean: true, // Clean dist before building
    bundle: true, // Bundle dependencies;
    splitting: false, // Prevent code splitting for simplicity
    minify: true, // Minify output files
},
{
    entry: ['src/modelcontextprotocol/index.ts'],
    outDir: "mcp",
    clean: true,
    dts: true,
    format: ['cjs', 'esm'],
    sourcemap: true,
    target: 'node18',
}
]);