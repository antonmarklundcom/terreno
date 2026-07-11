import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

/**
 * Flat ESLint config. `next/core-web-vitals` + `next/typescript` are the same
 * rulesets create-next-app ships for Next 15; `prettier` disables formatting
 * rules so Prettier owns layout and ESLint owns correctness.
 */
const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript', 'prettier'),
  {
    ignores: ['.next/', 'node_modules/', 'next-env.d.ts'],
  },
];

export default eslintConfig;
