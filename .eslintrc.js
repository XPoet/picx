const path = require('path')
const fs = require('fs')

function parseAutoImportsDts(contents) {
  const matchResults = contents.matchAll(/^\s+const (\w+): typeof import/gm)
  return Array.from(matchResults, ([, word]) => word)
}

function dts2Globals() {
  const SRC = path.resolve(__dirname, './src/auto-imports.d.ts')
  const contents = fs.readFileSync(SRC, { encoding: 'utf-8' })
  const parsed = parseAutoImportsDts(contents)

  return parsed.reduce((acc, word) => {
    acc[word] = 'readonly'
    return acc
  }, {})
}

module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: ['plugin:vue/essential', 'airbnb-base', 'plugin:prettier/recommended'],
  parserOptions: {
    ecmaVersion: 12,
    parser: '@typescript-eslint/parser',
    sourceType: 'module'
  },
  plugins: ['vue', '@typescript-eslint'],
  rules: {
    'import/no-unresolved': 'off',
    'import/extensions': 'off',
    'import/no-absolute-path': 'off',
    'import/no-extraneous-dependencies': 'off',
    'vue/no-multiple-template-root': 'off',
    'no-console': 'off',
    'no-shadow': 'off',
    'import/prefer-default-export': 'off',
    camelcase: 'off',
    'no-param-reassign': 'off',
    'no-await-in-loop': 'off'
  },
  globals: {
    ...dts2Globals()
  }
}
