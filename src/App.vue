<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { renderBoardImage, canvasToFile } from './renderImage'

const STORAGE_KEY = 'bbmw-state'
const DEFAULT_TITLE = '羽球商業局小白板'
const THEME_KEY = 'bbmw-theme'
const SCORE_OPTIONS = [2, 1, -1, -2]

// ---------- 狀態 ----------
const title = ref(DEFAULT_TITLE)
const players = ref(['選手A', '選手B', '選手C', '選手D'])
const rows = ref(makeRows(1, 4))
const isDark = ref(document.documentElement.classList.contains('dark'))
const picker = ref(null) // { r, c }
const toast = ref('')
const dialog = ref(null) // { title, message, confirmText, resolve }

function makeRows(n, cols) {
  return Array.from({ length: n }, () => Array(cols).fill(null))
}

// ---------- 計算 ----------
const totals = computed(() =>
  players.value.map((_, c) => rows.value.reduce((sum, row) => sum + (row[c] ?? 0), 0)),
)

// 每局各選手分數加總不為 0 時提示（商業局通常輸贏相抵）
function rowSum(row) {
  return row.reduce((s, v) => s + (v ?? 0), 0)
}
function rowFilled(row) {
  return row.some((v) => v !== null)
}

function fmt(v) {
  if (v === null || v === undefined) return ''
  return v > 0 ? `+${v}` : `${v}`
}

function scoreClass(v) {
  if (v === null) return 'text-slate-300 dark:text-slate-600'
  if (v > 0) return 'text-emerald-600 dark:text-emerald-400'
  if (v < 0) return 'text-rose-600 dark:text-rose-400'
  return 'text-slate-500'
}

// ---------- 操作 ----------
function openPicker(r, c) {
  picker.value = { r, c }
}
function setScore(v) {
  if (!picker.value) return
  const { r, c } = picker.value
  rows.value[r][c] = v
  picker.value = null
  // 填到最後一列時自動補一列
  if (r === rows.value.length - 1 && v !== null) addRow()
}

function addRow() {
  rows.value.push(Array(players.value.length).fill(null))
}
async function removeRow(r) {
  const filled = rowFilled(rows.value[r])
  if (filled && !(await askConfirm({ title: `刪除第 ${r + 1} 局？`, message: '此局的所有分數將一併刪除。', confirmText: '刪除' })))
    return
  rows.value.splice(r, 1)
  if (rows.value.length === 0) addRow()
  if (filled) showToast(`已刪除第 ${r + 1} 局`)
}
function addPlayer() {
  players.value.push(`選手${String.fromCharCode(65 + (players.value.length % 26))}`)
  rows.value.forEach((row) => row.push(null))
}
async function removePlayer(c) {
  if (players.value.length <= 2) return
  const name = players.value[c] || `第 ${c + 1} 位選手`
  if (!(await askConfirm({ title: `移除「${name}」？`, message: '該選手的所有分數將一併刪除。', confirmText: '移除' })))
    return
  players.value.splice(c, 1)
  rows.value.forEach((row) => row.splice(c, 1))
  showToast(`已移除「${name}」`)
}

async function clearBoard() {
  if (!(await askConfirm({ title: '清除所有分數？', message: '選手名稱會保留，所有局數與分數將被清空。', confirmText: '清除' })))
    return
  rows.value = makeRows(1, players.value.length)
  showToast('已清除所有分數')
}

function toggleTheme() {
  isDark.value = !isDark.value
}
watch(isDark, (v) => {
  document.documentElement.classList.toggle('dark', v)
  try {
    localStorage.setItem(THEME_KEY, v ? 'dark' : 'light')
  } catch {}
})

function showToast(msg) {
  toast.value = msg
  clearTimeout(showToast.t)
  showToast.t = setTimeout(() => (toast.value = ''), 2000)
}

// 確認彈窗，回傳 Promise<boolean>
function askConfirm({ title, message = '', confirmText = '確定' }) {
  picker.value = null
  dialog.value?.resolve(false)
  return new Promise((resolve) => {
    dialog.value = { title, message, confirmText, resolve }
  })
}
function closeDialog(ok) {
  dialog.value?.resolve(ok)
  dialog.value = null
}

// ---------- 分享（存成圖片） ----------
async function share() {
  picker.value = null
  const canvas = renderBoardImage({
    title: displayTitle.value,
    players: players.value,
    rows: rows.value,
    totals: totals.value,
    dark: isDark.value,
  })
  const d = new Date()
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const file = canvasToFile(canvas, `${displayTitle.value.replace(/[\\/:*?"<>|]/g, '')}-${stamp}.png`)

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: displayTitle.value })
      return
    } catch (e) {
      if (e.name === 'AbortError') return
    }
  }
  // 不支援分享檔案時改為下載
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  showToast('圖片已下載')
}

// ---------- 持久化 ----------
onMounted(() => {
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return
    if (dialog.value) closeDialog(false)
    else picker.value = null
  })
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const data = JSON.parse(saved)
      if (Array.isArray(data.players) && Array.isArray(data.rows) && data.rows.length) {
        players.value = data.players
        rows.value = data.rows
        if (typeof data.title === 'string') title.value = data.title
      }
    }
  } catch {}
})

const displayTitle = computed(() => title.value.trim() || DEFAULT_TITLE)
watch(displayTitle, (t) => (document.title = t), { immediate: true })

watch(
  [title, players, rows],
  () => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ title: title.value, players: players.value, rows: rows.value }),
      )
    } catch {}
  },
  { deep: true },
)
</script>

<template>
  <div class="mx-auto flex min-h-dvh flex-col px-3 pb-28 pt-4 sm:px-6 lg:max-w-3xl">
    <!-- 頁首 -->
    <header class="mb-4 flex items-center justify-between gap-3">
      <h1 class="flex min-w-0 flex-1 items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
        <span class="shrink-0 text-2xl">🏸</span>
        <input
          v-model="title"
          class="min-w-0 flex-1 rounded-lg bg-transparent px-1.5 py-1 -ml-1.5 outline-none placeholder:text-slate-400 hover:bg-slate-200/60 focus:bg-white focus:ring-2 focus:ring-sky-400 dark:hover:bg-slate-800/60 dark:focus:bg-slate-900"
          :placeholder="DEFAULT_TITLE"
          maxlength="30"
          aria-label="標題"
          @blur="title = title.trim()"
          @keydown.enter="$event.target.blur()"
        />
      </h1>
      <button
        class="grid size-10 place-items-center rounded-full border border-slate-300 bg-white text-lg shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
        :aria-label="isDark ? '切換為淺色模式' : '切換為深色模式'"
        :title="isDark ? '淺色模式' : '深色模式'"
        @click="toggleTheme"
      >
        {{ isDark ? '☀️' : '🌙' }}
      </button>
    </header>

    <!-- 白板 -->
    <div
      class="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <table class="w-full border-collapse text-center">
        <thead>
          <tr class="bg-slate-50 dark:bg-slate-800/60">
            <th class="w-10 px-1 py-2 text-xs font-medium text-slate-400">局</th>
            <th
              v-for="(name, c) in players"
              :key="c"
              class="group relative min-w-20 border-l border-slate-200 px-1 py-1 dark:border-slate-800"
            >
              <input
                v-model="players[c]"
                class="w-full rounded-md bg-transparent px-1 py-1.5 text-center text-sm font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-sky-400 dark:focus:bg-slate-900"
                :placeholder="`選手${c + 1}`"
                maxlength="10"
              />
              <button
                v-if="players.length > 2"
                class="absolute -right-0.5 -top-0.5 hidden size-5 place-items-center rounded-full bg-slate-300 text-xs leading-none text-white group-hover:grid group-focus-within:grid hover:bg-rose-500 dark:bg-slate-600"
                aria-label="移除選手"
                @click="removePlayer(c)"
              >
                ×
              </button>
            </th>
            <th class="w-10 border-l border-slate-200 dark:border-slate-800">
              <button
                class="mx-auto grid size-8 place-items-center rounded-full text-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                title="新增選手"
                aria-label="新增選手"
                @click="addPlayer"
              >
                +
              </button>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="(row, r) in rows"
            :key="r"
            class="border-t border-slate-100 dark:border-slate-800"
          >
            <td class="p-0">
              <button
                class="group/num grid h-11 w-full place-items-center text-xs tabular-nums text-slate-400 hover:text-rose-500"
                :title="`刪除第 ${r + 1} 局`"
                :aria-label="`刪除第 ${r + 1} 局`"
                @click="removeRow(r)"
              >
                <span class="group-hover/num:hidden">{{ r + 1 }}</span>
                <span class="hidden text-base group-hover/num:inline">×</span>
              </button>
            </td>
            <td
              v-for="(v, c) in row"
              :key="c"
              class="border-l border-slate-100 p-0 dark:border-slate-800"
            >
              <button
                class="h-11 w-full text-lg font-bold tabular-nums transition hover:bg-sky-50 dark:hover:bg-slate-800"
                :class="[
                  scoreClass(v),
                  picker && picker.r === r && picker.c === c ? 'bg-sky-100 dark:bg-sky-900/40' : '',
                ]"
                @click="openPicker(r, c)"
              >
                {{ v === null ? '·' : fmt(v) }}
              </button>
            </td>
            <td class="border-l border-slate-100 dark:border-slate-800">
              <span
                v-if="rowFilled(row) && rowSum(row) !== 0"
                class="text-xs text-amber-500"
                :title="`本局加總為 ${fmt(rowSum(row))}，輸贏未相抵`"
              >
                ⚠
              </span>
            </td>
          </tr>
        </tbody>

        <tfoot>
          <tr class="border-t-2 border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60">
            <td class="whitespace-nowrap px-1.5 py-3 text-xs font-medium text-slate-500">總分</td>
            <td
              v-for="(t, c) in totals"
              :key="c"
              class="border-l border-slate-200 py-3 text-xl font-extrabold tabular-nums dark:border-slate-700"
              :class="scoreClass(t === 0 ? 0 : t)"
            >
              {{ t === 0 ? '0' : fmt(t) }}
            </td>
            <td class="border-l border-slate-200 dark:border-slate-700"></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <button
      class="mt-3 self-center rounded-full px-4 py-1.5 text-sm text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
      @click="addRow"
    >
      ＋ 新增一局
    </button>

    <!-- 底部操作列 -->
    <div
      class="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90"
      style="padding-bottom: env(safe-area-inset-bottom)"
    >
      <div class="flex gap-3 px-3 py-3 sm:px-6 lg:mx-auto lg:max-w-3xl">
        <button
          class="flex-1 rounded-xl border border-rose-300 py-3 font-semibold text-rose-600 transition hover:bg-rose-50 active:scale-[.98] dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/40"
          @click="clearBoard"
        >
          清除
        </button>
        <button
          class="flex-1 rounded-xl bg-slate-900 py-3 font-semibold text-white shadow-sm transition hover:bg-black active:scale-[.98] dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          @click="share"
        >
          分享
        </button>
      </div>
    </div>

    <!-- 分數選擇面板 -->
    <Transition
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
      enter-active-class="transition duration-150"
      leave-active-class="transition duration-150"
    >
      <div v-if="picker" class="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center" @click.self="picker = null">
        <div class="w-full max-w-sm rounded-t-2xl bg-white p-4 shadow-xl sm:rounded-2xl dark:bg-slate-900">
          <p class="mb-3 text-center text-sm text-slate-500">
            第 {{ picker.r + 1 }} 局 ·
            <span class="font-semibold text-slate-800 dark:text-slate-200">{{ players[picker.c] || `選手${picker.c + 1}` }}</span>
          </p>
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="opt in SCORE_OPTIONS"
              :key="opt"
              class="rounded-xl py-4 text-2xl font-extrabold tabular-nums transition active:scale-95"
              :class="
                opt > 0
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-900/70'
                  : 'bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:hover:bg-rose-900/70'
              "
              @click="setScore(opt)"
            >
              {{ fmt(opt) }}
            </button>
          </div>
          <div class="mt-2 grid grid-cols-2 gap-2">
            <button
              class="rounded-xl bg-slate-100 py-3 text-sm font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              @click="setScore(null)"
            >
              清空此格
            </button>
            <button
              class="rounded-xl py-3 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              @click="picker = null"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 確認彈窗 -->
    <Transition
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
      enter-active-class="transition duration-150"
      leave-active-class="transition duration-150"
    >
      <div
        v-if="dialog"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
        role="dialog"
        aria-modal="true"
        @click.self="closeDialog(false)"
      >
        <div class="w-full max-w-xs rounded-2xl bg-white p-5 text-center shadow-xl dark:bg-slate-900">
          <h2 class="text-lg font-bold">{{ dialog.title }}</h2>
          <p v-if="dialog.message" class="mt-2 text-sm text-slate-500 dark:text-slate-400">{{ dialog.message }}</p>
          <div class="mt-5 grid grid-cols-2 gap-2">
            <button
              class="rounded-xl bg-slate-100 py-3 text-sm font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              @click="closeDialog(false)"
            >
              取消
            </button>
            <button
              class="rounded-xl bg-rose-600 py-3 text-sm font-semibold text-white hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-400"
              @click="closeDialog(true)"
            >
              {{ dialog.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 提示訊息 -->
    <Transition
      enter-from-class="opacity-0 translate-y-2"
      leave-to-class="opacity-0"
      enter-active-class="transition duration-200"
      leave-active-class="transition duration-200"
    >
      <div
        v-if="toast"
        class="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-900 px-4 py-2 text-sm text-white shadow-lg dark:bg-white dark:text-slate-900"
      >
        {{ toast }}
      </div>
    </Transition>
  </div>
</template>
