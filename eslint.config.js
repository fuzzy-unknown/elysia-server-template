import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: ['.vscode', 'node_modules', 'README.md'],
  rules: {
    'no-console': 'off',
    'node/prefer-global/process': 'off',
  },
})
