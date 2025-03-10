module.exports = {
  presets: ['next/babel'],
  env: {
    production: {
      plugins: [
        [
          'transform-remove-console',
          {
            exclude: ['error', 'warn'], // Keep error and warning logs
          },
        ],
      ],
    },
  },
}; 