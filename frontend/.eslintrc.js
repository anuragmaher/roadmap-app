module.exports = {
  extends: [
    'react-app',
    'react-app/jest',
    '@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended'
  ],
  plugins: [
    '@typescript-eslint',
    'react-hooks',
    'jsx-a11y',
    'import'
  ],
  rules: {
    // Code Quality Rules
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'no-unused-vars': 'off', // Turn off base rule as it conflicts with TypeScript
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    
    // React Rules
    'react/jsx-no-bind': ['error', { allowArrowFunctions: true }],
    'react/jsx-boolean-value': ['error', 'never'],
    'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],
    'react/self-closing-comp': 'error',
    'react/jsx-no-useless-fragment': 'error',
    
    // React Hooks Rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // TypeScript Rules
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-empty-function': 'warn',
    '@typescript-eslint/prefer-const': 'error',
    '@typescript-eslint/no-var-requires': 'error',
    
    // Import Rules
    'import/order': ['error', {
      groups: [
        'builtin',
        'external',
        'internal',
        'parent',
        'sibling',
        'index'
      ],
      'newlines-between': 'always',
      alphabetize: { order: 'asc', caseInsensitive: true }
    }],
    'import/no-duplicate-imports': 'error',
    'import/newline-after-import': 'error',
    
    // Best Practices
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',
    'prefer-arrow-callback': 'error',
    'arrow-spacing': 'error',
    'no-multiple-empty-lines': ['error', { max: 1 }],
    'eol-last': 'error',
    'comma-dangle': ['error', 'never'],
    'semi': ['error', 'always'],
    'quotes': ['error', 'single', { avoidEscape: true }],
    
    // Complexity Rules
    'max-lines': ['warn', { max: 300, skipBlankLines: true, skipComments: true }],
    'max-lines-per-function': ['warn', { max: 50, skipBlankLines: true, skipComments: true }],
    'complexity': ['warn', 10],
    'max-depth': ['warn', 4],
    'max-params': ['warn', 4],
    
    // Accessibility Rules
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/anchor-has-content': 'error',
    'jsx-a11y/anchor-is-valid': 'error',
    'jsx-a11y/click-events-have-key-events': 'error',
    'jsx-a11y/label-has-associated-control': 'error'
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
};