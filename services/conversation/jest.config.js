/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testMatch: ['**/__tests__/**/*.test.ts'],
  clearMocks: true,
  forceExit: true,
  maxWorkers: 1,
  collectCoverageFrom: ['**/*.ts', '!**/__tests__/**', '!**/*.d.ts', '!server.ts'],
};
