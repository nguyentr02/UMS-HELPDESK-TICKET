// eslint-config-next 16 ships native flat configs — import & spread them
// directly (FlatCompat is not needed and its eslintrc validator chokes on the
// flat-shaped react plugin).
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';

const eslintConfig = [
  // Replaces `ignorePatterns` from the old `.eslintrc.json`.
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.next/**',
      '.turbo/**',
      'coverage/**',
      '**/next-env.d.ts',
      'public/**', // static assets + the generated MSW worker
    ],
  },

  // next/core-web-vitals + next/typescript ≈ the old
  // (next/core-web-vitals + @typescript-eslint/recommended) pair.
  ...nextCoreWebVitals,
  ...nextTypescript,

  // Turn off formatting rules that conflict with Prettier (applied last).
  prettier,

  // Project rules (ported verbatim from `.eslintrc.json`).
  {
    files: ['**/*.{js,jsx,ts,tsx,mjs,cjs}'],
    plugins: {
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
    },
    rules: {
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],
      'simple-import-sort/imports': 'warn',
      'simple-import-sort/exports': 'warn',
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
      // React Compiler rules newly enabled by eslint-config-next 16. They flag
      // pre-existing, runtime-correct patterns (effect setState, react-hook-form
      // `watch()`) the prior config never enforced. Kept off to make this a 1:1
      // tooling migration; adopting + fixing them is a separate code-quality pass.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/incompatible-library': 'off',
    },
  },

  // Test fixtures aren't real Next pages — the page-link rule doesn't apply.
  {
    files: ['tests/**'],
    rules: {
      '@next/next/no-html-link-for-pages': 'off',
    },
  },
];

export default eslintConfig;