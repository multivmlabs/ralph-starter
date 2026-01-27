export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat',     // New feature
      'fix',      // Bug fix
      'docs',     // Documentation only
      'refactor', // Code change that doesn't fix a bug or add a feature
      'test',     // Adding tests
      'chore',    // Maintenance tasks
      'perf',     // Performance improvements
      'ci',       // CI/CD changes
      'build',    // Build system changes
    ]],
    'subject-case': [0], // Allow any case in subject
    'body-max-line-length': [0], // Disable body line length limit
  }
};
