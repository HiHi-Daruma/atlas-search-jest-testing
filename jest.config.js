module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/*.test.ts"],
  globalSetup: "./setup-testcontainer.js",
  globalTeardown: "./teardown-testcontainer.js",
};
