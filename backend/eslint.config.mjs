// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import quality from './eslint-rules/index.cjs';

export default tseslint.config(
  {
    ignores: [
      'eslint.config.mjs',
      'eslint-rules/**/*.cjs',
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '**/*.tsbuildinfo',
      'package-lock.json',
      'prisma/**/*.ts',
      'prisma/**/*.js',
      'prisma/**/*.d.ts',
      'scripts/**/*.js',
      'scripts/**/*.mjs',
      'scripts/**/*.cjs',
      'scripts/temp/**',
      'types/**',
      'test/**/*.ts',
      'test/**/*.ts',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { quality },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
      'quality/max-lines': ['error', { max: 350 }],
      'quality/no-direct-console': ['error', { logger: 'the project logging helper' }],
    },
  },
  {
    files: ['src/prisma/prisma.service.ts'],
    rules: {
      'quality/no-direct-console': 'off',
    },
  },
  {
    files: ['src/types/express.ts'],
    rules: {
      '@typescript-eslint/no-namespace': 'off',
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', '**/{__tests__,__mocks__,fixtures,mocks}/**/*.{ts,tsx}'],
    rules: {
      'quality/max-lines': ['warn', { max: 350, includeTests: true }],
      'quality/no-direct-console': 'off',
    },
  },
  {
    files: ['eslint-rules/**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { module: 'readonly', require: 'readonly' },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
);
