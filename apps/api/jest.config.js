/** Unit tests: pure logic, no database. */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: 'test/.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  testEnvironment: 'node',
  collectCoverageFrom: ['src/imports/**/*.ts', 'src/foods/**/*.ts'],
  coverageDirectory: 'coverage',
};
