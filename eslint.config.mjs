import antfu from '@antfu/eslint-config'

export default antfu(
  {
    type: 'app',
    ignores: [
      'coverage/**',
      'dist/**',
      'node_modules/**',
      'public/**',
      'docs/**',
      'README*.md',
      'src/auto-imports.d.ts',
      'src/components.d.ts',
      'src/stores/modules/*/index.ts',
      'src/stores/types.ts',
      '.eslintrc.js',
      '.stylelintrc.js',
      '.commitlintrc.js',
      '.cz-config.js',
    ],
    stylistic: {
      indent: 2,
      quotes: 'single',
      semi: false,
    },
    typescript: true,
    vue: true,
  },
  {
    files: ['**/*.{js,mjs,ts,vue}'],
    rules: {
      'antfu/top-level-function': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'ts/no-explicit-any': 'off',
      'ts/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'error',
    },
  },
  {
    files: ['src/utils/**/*.{ts,vue}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/views/**'],
              message: '通用工具层不得反向依赖具体 View。',
            },
          ],
        },
      ],
    },
  },
)
