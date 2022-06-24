module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json'
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:import/recommended',
    'airbnb-typescript/base',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended'
  ],
  root: true,
  env: {
    node: true,
    jest: true
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    'comma-dangle': ['error', 'never'],
    '@typescript-eslint/semi': ['error', 'always'],
    'import/no-extraneous-dependencies': 'off',
    'import/order': ['error', {
      'alphabetize': {
        'order': 'asc',
        'caseInsensitive': true
      },
      'newlines-between': 'never'
    }]
  }
};
