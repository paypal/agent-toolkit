export default {
    preset: "ts-jest",
    testEnvironment: "node",
    transform: {
        // Transpile only; type checking is left to tsc, which keeps test runs fast.
        "^.+\\.tsx?$": ["ts-jest", { tsconfig: { isolatedModules: true } }],
    },
};
