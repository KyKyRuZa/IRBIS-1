import globals from 'globals';
import js from '@eslint/js';
import prettierRecommended from 'eslint-config-prettier/flat';

export default [
  js.configs.recommended,
  prettierRecommended,
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2024,
      },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-undef': 'off',
    },
  },
  {
    ignores: ['node_modules/', 'uploads/', 'certs/', 'dist/', 'prisma/migrations/', 'tests/'],
  },
];
