// ESLint flat config (ESLint 9+)
// Orden crítico: tseslint primero, prettier SIEMPRE al final para apagar reglas conflictivas.

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  // 1. Ignorar rutas generadas / externas
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.next/**',
      '**/prisma/migrations/**',
    ],
  },

  // 2. Reglas base JS recomendadas
  js.configs.recommended,

  // 3. Reglas recomendadas de TypeScript (incluye parser + plugin)
  ...tseslint.configs.recommended,

  // 4. Nuestras reglas custom (alinean con CLAUDE.md)
  {
    files: ['**/*.{ts,tsx,js,mjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // ====== REGLA NO NEGOCIABLE (CLAUDE.md) ======
      // `any` NO está permitido. Usa `unknown` + narrowing.
      '@typescript-eslint/no-explicit-any': 'error',

      // ====== Variables no usadas (permitir prefijo _) ======
      'no-unused-vars': 'off', // desactivar la regla base en favor de la de TS
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // ====== console en backend ======
      // Permitir warn y error (útiles en producción), prohibir console.log.
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],

      // ====== Calidad y seguridad ======
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'], // === en vez de ==
      curly: ['error', 'all'], // siempre llaves en if/else/for/while
      'no-throw-literal': 'error', // siempre `throw new Error(...)`, nunca `throw 'mensaje'`

      // ====== TypeScript-específicas ======
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-non-null-assertion': 'warn', // evita `x!`, fuerza manejar null
    },
  },

  // 5. Overrides para archivos de tests (más permisivo con console y any de mocks)
  {
    files: ['**/*.test.ts', '**/*.spec.ts', '**/__tests__/**/*.ts'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },

  // 6. Prettier SIEMPRE al final (apaga reglas de ESLint que chocan con Prettier)
  prettierConfig,
);
