<p align="center">
  <img src="public/logo.svg" alt="Badminton Business Match Whiteboard logo" />
</p>

<h1 align="center">Badminton Business Match Whiteboard</h1>

<p align="center">
  A simple one-page whiteboard for recording badminton money-match results.<br />
  Live demo:
  <a href="https://saberliou.github.io/BadmintonBusinessMatchWhiteboard/">GitHub Pages</a> ·
  <a href="https://saberliou.gitlab.io/BadmintonBusinessMatchWhiteboard/">GitLab Pages</a>
</p>

## Features

- Record each round with a tap (+2, +1, -1, -2); totals update automatically, and a new round is added once the last one is filled.
- Rounds where wins and losses don't cancel out are flagged with ⚠.
- The player row stays pinned to the top while scrolling through rounds.
- A toggle under each total strikes it out, e.g. once that player has settled up.
- Text inputs show a ✓ button while typing, since mobile keyboards don't always have a "Done" key.
- Edit mode: add, remove, and drag to reorder players and rounds.
- Share the board as a PNG image (falls back to download when sharing isn't supported).
- Light and dark themes; everything is saved in the browser's localStorage.

## Development

Requires [nvm](https://github.com/nvm-sh/nvm); the Node.js version is pinned in `.nvmrc`. `npm install` fails on Node.js or npm older than `engines` in `package.json`, and on dependency install scripts not reviewed in `allowScripts`. To review the latter:

```sh
npm install --ignore-scripts      # Install without running scripts, as `ls` and `deny` only see installed packages
npm install-scripts ls            # List the unreviewed install scripts
npm install-scripts deny <pkg>    # Or `approve <pkg>`, only if the script is really needed
npm ci                            # Reinstall with the reviewed policy
```

Commands:

```sh
nvm use          # Switch to the Node.js version in .nvmrc (run `nvm install` first if missing)
npm install
npm run dev      # Start the dev server
npm run build    # Build to dist/ (relative paths, deployable to GitHub Pages, GitLab Pages, or any static host)
npm run preview  # Serve the built dist/ locally to check the production build
npm test         # Run unit and component tests (Vitest)
npm run lint     # Lint with ESLint (`npm run lint:fix` to auto-fix)
npm run format   # Format with Prettier (`npm run format:check` to check only)
```

Tech stack: Vue 3 + Vite + Tailwind CSS v4, tested with Vitest + Vue Test Utils, linted with ESLint (`eslint-plugin-vue`) and formatted with Prettier.

## Project Architecture

### Structure

```
src/
├─ App.vue              # Page layout: header, whiteboard, bottom action bar
├─ components/          # UI only, props in / emits out: ScoreTable, ScorePicker, DoneInput,
│                       #   ConfirmDialog, AppToast, icons
├─ composables/         # State & logic: useBoard (data & persistence), useDragSort,
│                       #   useConfirm, useToast, useTheme
└─ utils/               # Pure functions, no Vue: score, renderImage, shareImage
public/
├─ logo.svg             # Logo (README, favicon for modern browsers)
└─ logo.ico             # Favicon fallback (16–256px)
tests/                  # Vitest tests
```

### File dependencies

Arrows point from the importing file to the imported one.

```text
                               index.html
                                   │
                                main.js ───────▶ style.css
                                   │
                           ┌───────▼────────┐
                           │    App.vue     │      ← orchestrator: wires data to UI
                           └───────┬────────┘
     ┌─────────────┬─────────────┬─┴───────────┬─────────────┬─────────────┐
     │             │             │             │             │             │
     ▼             ▼             ▼             ▼             ▼             ▼
 ScoreTable ──▶ DoneInput   ScorePicker  ConfirmDialog   AppToast      useBoard ───┐
  │   │   │        │             │             │             │         useTheme    │
  │   │   │        ▼             │             ▼             ▼         shareImage  │
  │   │   └──▶ icons.js          │        useConfirm     useToast          │       │
  │   ▼                          │        (singleton)    (singleton)       ▼       │
  │ useDragSort                  │                                   renderImage   │
  ▼                              ▼                                                 │
 score.js ◀──────────────────────┴─────────────────────────────────────────────────┘
```

Omitted to keep the diagram readable: `App.vue` also imports `icons.js` and `score.js`, and `ScoreTable.vue` imports `MIN_PLAYERS` from `useBoard`.

### Data flow when entering a score

```text
  user taps a cell
       │
       ▼
 ┌────────────┐  emit pick(r,c)   ┌──────────┐   open    ┌─────────────┐
 │ ScoreTable │ ────────────────▶ │ App.vue  │ ────────▶ │ ScorePicker │
 └────────────┘                   └──────────┘           └──────┬──────┘
       ▲                               ▲   │                    │
       │                               └───┼── emit select(v) ──┘
       │ props: rows / totals              │ board.setScore()
       │                                   ▼
       │                          ┌─────────────────┐
       └───────────────────────── │    useBoard     │ ──┐ last round filled
                                  │  rows / totals  │ ◀─┘ → auto addRow
                                  └────────┬────────┘
                       computed totals     │     deep watch
                      ┌────────────────────┴───────────────────┐
                      ▼                                        ▼
               score.js                                localStorage
            columnTotals()                              "bbmw-state"
```

### Strike out a total

```text
  user taps the toggle under a total
       │
       ▼
 ┌────────────┐  emit toggle-struck(c)  ┌──────────┐  board.toggleStruck(c)  ┌─────────────┐
 │ ScoreTable │ ──────────────────────▶ │ App.vue  │ ──────────────────────▶ │  useBoard   │
 └────────────┘                         └──────────┘                         │   struck    │
       ▲                                                                     └──────┬──────┘
       │ props: struck → total gets a line-through                                  │
       └────────────────────────────────────────────────────────────────────────────┤
                                                                                    │ deep watch
                                                                                    ▼
                                                                              localStorage
```

`struck` follows players when they're added, removed, or reordered, and is reset by "Clear". It only affects the on-screen board; shared images always show plain totals.

### Delete and clear

```text
 delete (edit mode) / "Clear" button
             │
             ▼
     needs confirmation? ──── no (empty round) ───────┐
             │ yes                                    │
             ▼                                        │
   askConfirm() → Promise                             │
             │                                        │
             ▼                                        │
      ConfirmDialog                                   │
   confirm / cancel / Esc                             │
        │         │                                   │
     cancel    confirm                                │
        │         └──────────────┐                    │
        ▼                        ▼                    ▼
      abort         removeRow / removePlayer / clearScores
                                 │
                                 ▼
                      showToast → AppToast
```

### Share image

```text
 "Share" → shareBoardImage → renderBoardImage (Canvas) → canvasToFile (PNG)
                                                               │
                                                  navigator.canShare?
                                                    │              │
                                                   yes        no / failed
                                                    ▼              ▼
                                            Web Share API    <a download>
                                                          + toast "Image downloaded"
```

## Deployment

GitHub and GitLab run the same pipeline. Pull requests (GitHub) and merge requests (GitLab) only run the checks; pushes to the default branch (`main`) also deploy to Pages:

```text
 PR / MR   → npm ci → lint → format:check → vitest → vite build
 push main → npm ci → lint → format:check → vitest → vite build → Pages
```

| Host         | Pipeline                                        | URL                                                          |
| ------------ | ----------------------------------------------- | ------------------------------------------------------------ |
| GitHub Pages | GitHub Actions (`.github/workflows/deploy.yml`) | https://saberliou.github.io/BadmintonBusinessMatchWhiteboard |
| GitLab Pages | GitLab CI/CD (`.gitlab-ci.yml`)                 | https://saberliou.gitlab.io/BadmintonBusinessMatchWhiteboard |

The build uses relative paths (`base: './'`), so the same output works under either URL. Push to each remote to trigger its pipeline (e.g. `git push github main` and `git push gitlab main`).

## License

[MIT](LICENSE) © saberLiou
