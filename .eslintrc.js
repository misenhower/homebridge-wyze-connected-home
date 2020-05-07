module.exports = {
  'root': true,
  'env': {
    'node': true,
  },
  'extends': [
    'eslint:recommended',
  ],
  'rules': {
    'no-unused-vars': [
      'error',
      {
        'vars': 'all',
        'args': 'none',
        'ignoreRestSiblings': false,
      },
    ],
    'no-empty': 'off',
    'indent': ['error', 2, { 'SwitchCase': 1 }],
    'comma-dangle': ['error', 'always-multiline'],
    'prefer-template': 'error',
    'template-curly-spacing': 'error',
    'template-tag-spacing': ['error', 'never'],
    'arrow-body-style': ['error', 'as-needed', { requireReturnForObjectLiteral: false }],
    'arrow-parens': ['error', 'as-needed', { requireForBlockBody: true }],
    'arrow-spacing': ['error', { before: true, after: true }],
    'no-var': 'error',
    'quotes': ['error', 'single', { avoidEscape: true }],
    'no-multi-spaces': 'error',
    'array-bracket-spacing': ['error', 'never'],
    'block-spacing': ['error', 'always'],
    'comma-spacing': ['error', { before: false, after: true }],
    'key-spacing': ['error', { beforeColon: false, afterColon: true }],
    'keyword-spacing': 'error',
    'lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: false }],
    'lines-around-directive': 'error',
    'no-lonely-if': 'error',
    'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }],
    'no-spaced-func': 'error',
    'no-whitespace-before-property': 'error',
    'object-curly-spacing': ['error', 'always'],
    'object-property-newline': ['error', { allowAllPropertiesOnSameLine: true }],
    'semi': ['error', 'always'],
    'semi-spacing': ['error', { before: false, after: true }],
    'semi-style': ['error', 'last'],
    'space-before-blocks': 'error',
    'space-before-function-paren': ['error', {
      anonymous: 'always',
      named: 'never',
      asyncArrow: 'always'
    }],
    'space-in-parens': ['error', 'never'],
    'space-infix-ops': 'error',
    'switch-colon-spacing': ['error', { after: true, before: false }],
  },
  "parserOptions": {
    "ecmaVersion": 2018
  },
  "env": {
    "es6": true,
    'node': true,
  }
}
