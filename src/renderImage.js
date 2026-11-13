// 將白板繪製成 PNG（直接用 Canvas 繪製，不依賴 DOM 截圖）

const FONT = `system-ui, -apple-system, 'PingFang TC', 'Noto Sans TC', 'Microsoft JhengHei', sans-serif`

const THEMES = {
  light: {
    bg: '#f1f5f9',
    card: '#ffffff',
    head: '#f8fafc',
    border: '#e2e8f0',
    strong: '#cbd5e1',
    text: '#0f172a',
    muted: '#94a3b8',
    pos: '#059669',
    neg: '#e11d48',
  },
  dark: {
    bg: '#020617',
    card: '#0f172a',
    head: '#1e293b',
    border: '#1e293b',
    strong: '#334155',
    text: '#f1f5f9',
    muted: '#64748b',
    pos: '#34d399',
    neg: '#fb7185',
  },
}

const fmt = (v) => (v > 0 ? `+${v}` : `${v}`)

/**
 * @param {{ title: string, players: string[], rows: (number|null)[][], totals: number[], dark: boolean }} opts
 * @returns {HTMLCanvasElement}
 */
export function renderBoardImage({ title, players, rows, totals, dark }) {
  const c = dark ? THEMES.dark : THEMES.light
  const scale = 2
  const pad = 24
  const numW = 48
  const rowH = 44
  const headH = 48
  const footH = 56
  const titleH = 72

  const names = players.map((n, i) => n || `選手${i + 1}`)
  const games = rows
    .filter((row) => row.some((v) => v !== null))
    .map((row, i) => ({ row, no: i + 1 }))

  // 依名稱寬度決定欄寬
  const measure = document.createElement('canvas').getContext('2d')
  measure.font = `600 15px ${FONT}`
  const colW = Math.max(84, ...names.map((n) => Math.ceil(measure.measureText(n).width) + 28))

  const tableW = numW + colW * names.length
  const tableH = headH + rowH * Math.max(games.length, 1) + footH
  measure.font = `700 22px ${FONT}`
  const titleW = Math.ceil(measure.measureText(`🏸 ${title}`).width)
  const W = Math.max(tableW, titleW) + pad * 2
  const H = titleH + tableH + pad * 2

  const canvas = document.createElement('canvas')
  canvas.width = W * scale
  canvas.height = H * scale
  const ctx = canvas.getContext('2d')
  ctx.scale(scale, scale)
  ctx.textBaseline = 'middle'

  // 背景
  ctx.fillStyle = c.bg
  ctx.fillRect(0, 0, W, H)

  // 標題與日期
  const now = new Date()
  const date = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`
  ctx.fillStyle = c.text
  ctx.textAlign = 'left'
  ctx.font = `700 22px ${FONT}`
  ctx.fillText(`🏸 ${title}`, pad, pad + 20)
  ctx.fillStyle = c.muted
  ctx.font = `400 13px ${FONT}`
  ctx.fillText(`${date} · 共 ${games.length} 局`, pad, pad + 48)

  // 表格卡片
  const x0 = (W - tableW) / 2
  const y0 = pad + titleH
  ctx.save()
  roundRect(ctx, x0, y0, tableW, tableH, 16)
  ctx.fillStyle = c.card
  ctx.fill()
  ctx.clip()

  // 表頭
  ctx.fillStyle = c.head
  ctx.fillRect(x0, y0, tableW, headH)
  ctx.textAlign = 'center'
  ctx.fillStyle = c.muted
  ctx.font = `500 12px ${FONT}`
  ctx.fillText('局', x0 + numW / 2, y0 + headH / 2)
  ctx.fillStyle = c.text
  ctx.font = `600 15px ${FONT}`
  names.forEach((n, i) => ctx.fillText(n, x0 + numW + colW * i + colW / 2, y0 + headH / 2))

  // 各局
  let y = y0 + headH
  if (games.length === 0) {
    ctx.fillStyle = c.muted
    ctx.font = `400 14px ${FONT}`
    ctx.fillText('尚無記錄', x0 + tableW / 2, y + rowH / 2)
    y += rowH
  }
  for (const { row, no } of games) {
    line(ctx, x0, y, x0 + tableW, y, c.border)
    ctx.fillStyle = c.muted
    ctx.font = `400 12px ${FONT}`
    ctx.fillText(String(no), x0 + numW / 2, y + rowH / 2)
    ctx.font = `700 18px ${FONT}`
    row.forEach((v, i) => {
      ctx.fillStyle = v === null ? c.strong : v > 0 ? c.pos : c.neg
      ctx.fillText(v === null ? '·' : fmt(v), x0 + numW + colW * i + colW / 2, y + rowH / 2)
    })
    y += rowH
  }

  // 總分
  ctx.fillStyle = c.head
  ctx.fillRect(x0, y, tableW, footH)
  line(ctx, x0, y, x0 + tableW, y, c.strong, 2)
  ctx.fillStyle = c.muted
  ctx.font = `500 12px ${FONT}`
  ctx.fillText('總分', x0 + numW / 2, y + footH / 2)
  ctx.font = `800 22px ${FONT}`
  totals.forEach((t, i) => {
    ctx.fillStyle = t > 0 ? c.pos : t < 0 ? c.neg : c.muted
    ctx.fillText(t === 0 ? '0' : fmt(t), x0 + numW + colW * i + colW / 2, y + footH / 2)
  })

  // 直線
  for (let i = 0; i < names.length; i++) {
    const x = x0 + numW + colW * i
    line(ctx, x, y0, x, y0 + tableH, c.border)
  }
  ctx.restore()

  // 外框
  roundRect(ctx, x0 + 0.5, y0 + 0.5, tableW - 1, tableH - 1, 16)
  ctx.strokeStyle = c.border
  ctx.lineWidth = 1
  ctx.stroke()

  return canvas
}

/** 同步轉成 File，讓 navigator.share 仍在使用者手勢內呼叫 */
export function canvasToFile(canvas, filename) {
  const dataUrl = canvas.toDataURL('image/png')
  const bin = atob(dataUrl.split(',')[1])
  const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0))
  return new File([bytes], filename, { type: 'image/png' })
}

function line(ctx, x1, y1, x2, y2, color, width = 1) {
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.stroke()
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}
