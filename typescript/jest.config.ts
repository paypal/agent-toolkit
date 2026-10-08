export default {
    preset: "ts-jest",
    testEnvironment: "node",
    // Transpile only: `tsup` builds without type-checking, and some shared files don't type-check yet.
    transform: { "^.+\\.tsx?$": ["ts-jest", { diagnostics: false }] },
};
