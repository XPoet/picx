export default {
  extends: ['stylelint-config-standard'],
  ignoreFiles: ['coverage/**', 'dist/**', 'node_modules/**'],
  overrides: [
    {
      files: ['**/*.styl'],
      customSyntax: 'postcss-styl',
    },
    {
      files: ['**/*.vue'],
      customSyntax: 'postcss-html',
    },
  ],
  rules: {
    'alpha-value-notation': 'number',
    'at-rule-no-unknown': null,
    'color-function-alias-notation': null,
    'color-function-notation': 'legacy',
    'custom-property-empty-line-before': null,
    'custom-property-pattern': null,
    'declaration-block-no-redundant-longhand-properties': null,
    'declaration-empty-line-before': null,
    'declaration-property-value-no-unknown': null,
    'import-notation': null,
    'media-feature-range-notation': 'prefix',
    'media-query-no-invalid': null,
    'no-descending-specificity': null,
    'property-no-deprecated': null,
    'rule-empty-line-before': null,
    'selector-class-pattern': null,
    'selector-pseudo-class-no-unknown': [
      true,
      {
        ignorePseudoClasses: ['deep'],
      },
    ],
    'shorthand-property-no-redundant-values': null,
  },
}
