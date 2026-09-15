export default {
    preset: "ts-jest",
    testEnvironment: "node",
    testMatch: ["**/__tests__/**/*.test.ts"],
    collectCoverageFrom: [
        "src/shared/functions.ts",
        "src/shared/payloadUtils.ts",
        "src/shared/parameters.ts",
        "src/shared/llmError.ts",
    ],
    // The repo has pre-existing type errors in unrelated code paths (e.g. a missing
    // listDisputesParameters import in payloadUtils.ts) that predate this test suite.
    // isolatedModules skips full type-checking during transpilation so importing a
    // file doesn't fail on unrelated type errors elsewhere in that same file.
    transform: {
        "^.+\\.tsx?$": ["ts-jest", { isolatedModules: true }],
    },
};
