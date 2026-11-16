![Badminton Business Match Whiteboard logo](public/logo.svg)

# Badminton Business Match Whiteboard

A simple one-page whiteboard for recording badminton money-match results. Track each player’s win/loss, calculate totals, clear the board, and share results.

[Live demo](https://saberliou.github.io/BadmintonBusinessMatchWhiteboard/)

## Development

Requires [nvm](https://github.com/nvm-sh/nvm); the Node.js version is pinned in `.nvmrc`.

```sh
nvm use          # Switch to the Node.js version in .nvmrc (run `nvm install` first if missing)
npm install
npm run dev      # Start the dev server
npm run build    # Build to dist/ (relative paths, deployable to GitHub Pages or any static host)
npm test         # Run unit and component tests (Vitest)
npm run lint     # Lint with ESLint (`npm run lint:fix` to auto-fix)
npm run format   # Format with Prettier (`npm run format:check` to check only)
```

Tech stack: Vue 3 + Vite + Tailwind CSS v4, tested with Vitest + Vue Test Utils, linted with ESLint (`eslint-plugin-vue`) and formatted with Prettier.

## Project Structure

```
src/
├─ App.vue              # Page layout: header, whiteboard, bottom action bar
├─ components/          # ScoreTable, ScorePicker, ConfirmDialog, AppToast, icons
├─ composables/         # useBoard (data & persistence), useDragSort, useConfirm, useToast, useTheme
└─ utils/               # score (pure functions), renderImage, shareImage
tests/                  # Vitest tests
```

## Deployment

Every push to `main` is linted, tested, built, and deployed to GitHub Pages by GitHub Actions (`.github/workflows/deploy.yml`):
https://saberliou.github.io/BadmintonBusinessMatchWhiteboard
