// 白板資料：標題、選手、各局分數，以及所有修改操作與 localStorage 保存
import { ref, computed, watch } from 'vue'
import { makeRows, moveItem, columnTotals } from '../utils/score'

export const DEFAULT_TITLE = '羽球商業局小白板'
export const STORAGE_KEY = 'bbmw-state'
export const MIN_PLAYERS = 2
const DEFAULT_PLAYERS = ['選手A', '選手B', '選手C', '選手D']

function defaultStorage() {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

/**
 * @param {{ storage?: Storage | null, key?: string }} [options]
 */
export function useBoard({ storage = defaultStorage(), key = STORAGE_KEY } = {}) {
  const title = ref(DEFAULT_TITLE)
  const players = ref([...DEFAULT_PLAYERS])
  const rows = ref(makeRows(1, players.value.length))

  load()

  const displayTitle = computed(() => title.value.trim() || DEFAULT_TITLE)
  const totals = computed(() => columnTotals(rows.value, players.value.length))

  // ---------- 分數 ----------
  function setScore(r, c, v) {
    rows.value[r][c] = v
    // 填到最後一局時自動補一局
    if (r === rows.value.length - 1 && v !== null) addRow()
  }

  function clearScores() {
    rows.value = makeRows(1, players.value.length)
  }

  // ---------- 局 ----------
  function addRow() {
    rows.value.push(Array(players.value.length).fill(null))
  }

  function removeRow(r) {
    rows.value.splice(r, 1)
    if (rows.value.length === 0) addRow()
  }

  function moveRow(from, to) {
    moveItem(rows.value, from, to)
  }

  // ---------- 選手 ----------
  function addPlayer() {
    players.value.push(`選手${String.fromCharCode(65 + (players.value.length % 26))}`)
    rows.value.forEach((row) => row.push(null))
  }

  /** @returns {boolean} 是否成功移除（至少保留 MIN_PLAYERS 位） */
  function removePlayer(c) {
    if (players.value.length <= MIN_PLAYERS) return false
    players.value.splice(c, 1)
    rows.value.forEach((row) => row.splice(c, 1))
    return true
  }

  function movePlayer(from, to) {
    moveItem(players.value, from, to)
    rows.value.forEach((row) => moveItem(row, from, to))
  }

  function renamePlayer(c, name) {
    players.value[c] = name
  }

  // ---------- 保存 ----------
  function load() {
    try {
      const saved = storage?.getItem(key)
      if (!saved) return
      const data = JSON.parse(saved)
      if (!Array.isArray(data.players) || data.players.length < MIN_PLAYERS) return
      if (!Array.isArray(data.rows) || data.rows.length === 0) return
      players.value = data.players.map(String)
      // 修正每局長度與選手數不一致的資料
      rows.value = data.rows.map((row) =>
        players.value.map((_, c) => (typeof row?.[c] === 'number' ? row[c] : null)),
      )
      if (typeof data.title === 'string') title.value = data.title
    } catch {
      // 資料損毀時沿用預設值
    }
  }

  watch(
    [title, players, rows],
    () => {
      try {
        storage?.setItem(
          key,
          JSON.stringify({ title: title.value, players: players.value, rows: rows.value }),
        )
      } catch {
        // 無痕模式或空間已滿時無法保存，不影響使用
      }
    },
    { deep: true },
  )

  return {
    title,
    players,
    rows,
    displayTitle,
    totals,
    setScore,
    clearScores,
    addRow,
    removeRow,
    moveRow,
    addPlayer,
    removePlayer,
    movePlayer,
    renamePlayer,
  }
}
