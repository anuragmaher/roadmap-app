module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
    // Code Quality Rules
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    
    // React Rules
    'react/self-closing-comp': 'error',
    'react/jsx-no-useless-fragment': 'error',
    
    // Best Practices
    'prefer-const': 'error',
    'no-var': 'error',
    'prefer-template': 'error',
    'eol-last': 'error',
    'comma-dangle': ['error', 'never'],
    'semi': ['error', 'always'],
    'quotes': ['error', 'single', { avoidEscape: true }],
    
    // Complexity Rules (gradually enforce smaller files and functions)
    'max-lines': ['warn', { max: 250, skipBlankLines: true, skipComments: true }],
    'max-lines-per-function': ['warn', { max: 80, skipBlankLines: true, skipComments: true }],
    
    // Basic DRY Rules
    'no-duplicate-imports': 'error'
  }
};