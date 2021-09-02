'use strict';

const reactRefresh = require('@vitejs/plugin-react-refresh');
const { defineConfig } = require('vite');

module.exports = defineConfig({
  plugins: [reactRefresh()],
  base: './',
});
