const { chromium } = require('@playwright/test')

const port = 4174
// Usa o Chromium do Playwright para não depender de um Chrome instalado na máquina.
const chromePath = process.env.CHROME_PATH || chromium.executablePath()

module.exports = function createConfig(profile, settings = {}) {
  return {
    ci: {
      collect: {
        startServerCommand: `pnpm preview --port ${port} --strictPort`,
        startServerReadyPattern: 'Local',
        url: [`http://localhost:${port}/`, `http://localhost:${port}/nft/emerald-ape-042`],
        numberOfRuns: 3,
        chromePath,
        settings,
      },
      assert: {
        assertions: {
          'categories:performance': ['warn', { minScore: 0.9 }],
          'categories:accessibility': ['warn', { minScore: 0.95 }],
          'categories:best-practices': ['warn', { minScore: 0.95 }],
          'categories:seo': ['warn', { minScore: 0.9 }],
        },
      },
      upload: {
        target: 'filesystem',
        outputDir: `./lighthouse/reports/${profile}`,
      },
    },
  }
}
