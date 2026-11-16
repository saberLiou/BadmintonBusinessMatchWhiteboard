// 將白板存成圖片並分享（不支援時改為下載）
import { renderBoardImage, canvasToFile } from './renderImage'

/** 例：羽球商業局小白板-20261116.png（移除檔名不允許的字元） */
export function imageFileName(title, date = new Date()) {
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
  return `${title.replace(/[\\/:*?"<>|]/g, '')}-${stamp}.png`
}

/**
 * @returns {Promise<'shared' | 'cancelled' | 'downloaded'>}
 */
export async function shareBoardImage({ title, players, rows, totals, dark }) {
  const canvas = renderBoardImage({ title, players, rows, totals, dark })
  const file = canvasToFile(canvas, imageFileName(title))

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title })
      return 'shared'
    } catch (e) {
      if (e.name === 'AbortError') return 'cancelled'
    }
  }

  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return 'downloaded'
}
