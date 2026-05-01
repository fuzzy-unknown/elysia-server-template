import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: ['.vscode', 'node_modules'],
  rules: {
    'no-console': 'off',
    'node/prefer-global/process': 'off',
  },
})
