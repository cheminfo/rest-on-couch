'use strict';

const reactRefresh = require('@vitejs/plugin-react-refresh');
const { defineConfig } = require('vite');

module.exports = defineConfig({
  plugins: [reactRefresh()],
  base: './',
  server: {
    host: '127.0.0.1',
  },
});
