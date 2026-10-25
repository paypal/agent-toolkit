export default {
    preset: "ts-jest",
    testEnvironment: "node",
    // tsup builds without type-checking and src has pre-existing type errors
    // (src/shared/payloadUtils.ts), so tests transpile only; `npm run typecheck` covers types.
    transform: { "^.+\\.ts$": ["ts-jest", { diagnostics: false }] },
};
