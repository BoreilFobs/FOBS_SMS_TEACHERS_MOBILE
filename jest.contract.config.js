/**
 * Config for the live-backend contract suite.
 *
 * Runs in Node rather than under jest-expo: these tests exercise the repository
 * and mapper layer over real HTTP, with no React Native components involved, so a
 * node environment is both faster and closer to what is being asserted.
 *
 * Start the harness first — see docs/SOCIAL_API_MIGRATION.md.
 */
module.exports = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/social/contract/**/*.contract.test.ts"],
  setupFiles: ["<rootDir>/social/contract/jest.setup.js"],
  transform: {
    "^.+\\.(t|j)sx?$": ["babel-jest", { presets: ["babel-preset-expo"] }],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
};
