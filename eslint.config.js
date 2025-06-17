import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: [
    'dist', 
    'src/tebra-soap/**', 
    '!src/tebra-soap/tebraSoapClient.ts', 
    '!src/tebra-soap/__tests__/**',
    'coverage/**',
    'node_modules/**',
    'functions/node_modules/**',
    'tebra-proxy/**',
    '__mocks__/**',
    'tebra-php-api/vendor/**',
    'vendor/**',
    'src/utils/testTebra*.ts'
  ] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  }
);
