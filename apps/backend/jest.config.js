/** @type {import('jest').Config} */
export default {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  roots: ["<rootDir>/tests", "<rootDir>/src"],
  extensionsToTreatAsEsm: [".ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: {
          isolatedModules: true,
        },
      },
    ],
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/server.ts",
    "!src/lambda.ts",
    "!src/middleware/tempCodeRunnerFile.ts",
    "!**/*.types.ts",
    "!**/types/**",
  ],
  coverageThreshold: {
    global: {
      lines: 85,
      functions: 85,
      branches: 70,
      statements: 85,
    },
  },
  testMatch: ["**/*.test.ts"],
  clearMocks: true,
};