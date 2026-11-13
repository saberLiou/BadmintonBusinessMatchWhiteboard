# BadmintonBusinessMatchWhiteboard
A simple one-page whiteboard for recording badminton money-match results. Track each player’s win/loss, calculate totals, clear the board, and share results.

## 開發

```bash
npm install
npm run dev      # 開發伺服器
npm run build    # 產出 dist/（相對路徑，可直接部署到 GitHub Pages 等靜態空間）
```

技術：Vue 3 + Vite + Tailwind CSS v4

## 部署

推送到 `main` 後由 GitHub Actions（`.github/workflows/deploy.yml`）自動建置並部署到 GitHub Pages：
https://saberliou.github.io/BadmintonBusinessMatchWhiteboard/
