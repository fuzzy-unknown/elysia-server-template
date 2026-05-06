import antfu from '@antfu/eslint-config'

export default antfu({
  vue: true,
  ignores: ['.vscode', 'node_modules', 'README.md', 'drizzle'],
  rules: {
    'no-console': 'off',
    'node/prefer-global/process': 'off',
  },
})
