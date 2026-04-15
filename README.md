# Prosperity Visualizer

React + Vite app for exploring Prosperity / IMC backtest logs directly in the browser.

The app is fully client-side:
- upload a `.log` or `.json` file
- inspect price, PnL, book depth, trades, and custom indicators
- no backend or server storage required

## Local development

```bash
npm install
npm run dev
```

## GitHub Pages deployment

This repository now includes a GitHub Actions workflow at `.github/workflows/deploy.yml` that builds and publishes the site from `main`.

After pushing these changes to GitHub, do this once in the repository settings:

1. Open `Settings -> Pages`.
2. Under `Build and deployment`, set `Source` to `GitHub Actions`.
3. Push to `main` or run the workflow manually from the `Actions` tab.

Expected site URL:

```text
https://claviculars.github.io/Visualizer/
```

## Important note

If GitHub Pages is still configured to publish directly from a branch, it may serve the raw Vite source files instead of the built app. If you see `/src/main.jsx` in the published HTML, the Pages source is still pointing at a branch and should be switched to `GitHub Actions`.
