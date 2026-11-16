// 與分數相關的純函式（無 Vue 依賴，方便測試）

export const SCORE_OPTIONS = [2, 1, -1, -2]

/** 建立 n 局、每局 cols 位選手的空白分數表 */
export function makeRows(n, cols) {
  return Array.from({ length: n }, () => Array(cols).fill(null))
}

/** 單局加總（商業局通常輸贏相抵為 0） */
export function rowSum(row) {
  return row.reduce((s, v) => s + (v ?? 0), 0)
}

/** 此局是否已有任何分數 */
export function rowFilled(row) {
  return row.some((v) => v !== null)
}

/** 各選手總分 */
export function columnTotals(rows, cols) {
  return Array.from({ length: cols }, (_, c) => rows.reduce((sum, row) => sum + (row[c] ?? 0), 0))
}

/** 顯示用格式：+2 / -1 / 空字串 */
export function fmt(v) {
  if (v === null || v === undefined) return ''
  return v > 0 ? `+${v}` : `${v}`
}

/** 分數文字顏色 */
export function scoreClass(v) {
  if (v === null) return 'text-slate-300 dark:text-slate-600'
  if (v > 0) return 'text-emerald-600 dark:text-emerald-400'
  if (v < 0) return 'text-rose-600 dark:text-rose-400'
  return 'text-slate-500'
}

/** 就地移動陣列元素 */
export function moveItem(arr, from, to) {
  arr.splice(to, 0, arr.splice(from, 1)[0])
}
