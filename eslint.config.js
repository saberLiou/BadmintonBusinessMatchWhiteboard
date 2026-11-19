import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import pluginVitest from '@vitest/eslint-plugin'
import skipFormatting from 'eslint-config-prettier/flat'

export default defineConfig([
  {
    name: 'app/files-to-lint',
    files: ['**/*.{vue,js,mjs}'],
  },

  globalIgnores(['**/dist/**', '**/coverage/**', '.npm/**']),

  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },

  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],

  {
    ...pluginVitest.configs.recommended,
    files: ['tests/**'],
  },

  // 關閉與 Prettier 衝突的格式規則（需放在最後）
  skipFormatting,
])
