<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useBoard, DEFAULT_TITLE } from './composables/useBoard'
import { useTheme } from './composables/useTheme'
import { useConfirm } from './composables/useConfirm'
import { useToast } from './composables/useToast'
import { rowFilled } from './utils/score'
import { shareBoardImage } from './utils/shareImage'
import ScoreTable from './components/ScoreTable.vue'
import ScorePicker from './components/ScorePicker.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import AppToast from './components/AppToast.vue'
import DoneInput from './components/DoneInput.vue'
import { PencilIcon, CheckIcon } from './components/icons'

const board = useBoard()
const { title, players, rows, struck, totals, displayTitle } = board
const { isDark, toggleTheme } = useTheme()
const { dialog, askConfirm, closeDialog } = useConfirm()
const { showToast } = useToast()

const editing = ref(false) // 編輯模式：顯示拖曳與刪除
const picker = ref(null) // { r, c }

const playerLabel = (c) => players.value[c] || `選手${c + 1}`

watch(displayTitle, (t) => (document.title = t), { immediate: true })

// ---------- 分數 ----------
function openPicker(r, c) {
  if (!editing.value) picker.value = { r, c }
}
function selectScore(v) {
  if (!picker.value) return
  board.setScore(picker.value.r, picker.value.c, v)
  picker.value = null
}

// ---------- 編輯 ----------
function toggleEditing() {
  editing.value = !editing.value
  picker.value = null
}

async function removeRow(r) {
  const filled = rowFilled(rows.value[r])
  if (filled) {
    const ok = await askConfirm({
      title: `刪除第 ${r + 1} 局？`,
      message: '此局的所有分數將一併刪除。',
      confirmText: '刪除',
    })
    if (!ok) return
  }
  board.removeRow(r)
  if (filled) showToast(`已刪除第 ${r + 1} 局`)
}

async function removePlayer(c) {
  const name = playerLabel(c)
  const ok = await askConfirm({
    title: `移除「${name}」？`,
    message: '該選手的所有分數將一併刪除。',
    confirmText: '移除',
  })
  if (ok && board.removePlayer(c)) showToast(`已移除「${name}」`)
}

// ---------- 底部操作 ----------
async function clearBoard() {
  picker.value = null
  const ok = await askConfirm({
    title: '清除所有分數？',
    message: '選手名稱會保留，所有局數與分數將被清空。',
    confirmText: '清除',
  })
  if (!ok) return
  board.clearScores()
  showToast('已清除所有分數')
}

async function share() {
  picker.value = null
  const result = await shareBoardImage({
    title: displayTitle.value,
    players: players.value,
    rows: rows.value,
    totals: totals.value,
    dark: isDark.value,
  })
  if (result === 'downloaded') showToast('圖片已下載')
}

// ---------- 鍵盤 ----------
function onKeydown(e) {
  if (e.key !== 'Escape') return
  if (dialog.value) closeDialog(false)
  else picker.value = null
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

const pickerRound = computed(() => (picker.value ? picker.value.r + 1 : 0))
const pickerName = computed(() => (picker.value ? playerLabel(picker.value.c) : ''))
</script>

<template>
  <div class="mx-auto flex min-h-dvh flex-col px-3 pb-28 pt-4 sm:px-6 lg:max-w-3xl">
    <!-- 頁首 -->
    <header class="mb-4 flex items-center justify-between gap-3">
      <h1
        class="flex min-w-0 flex-1 items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl"
      >
        <span class="shrink-0 text-2xl">🏸</span>
        <DoneInput
          v-model="title"
          wrapper-class="-ml-1.5 flex-1"
          input-class="w-full rounded-lg bg-transparent px-1.5 py-1 outline-none placeholder:text-slate-400 hover:bg-slate-200/60 focus:bg-white focus:ring-2 focus:ring-sky-400 dark:hover:bg-slate-800/60 dark:focus:bg-slate-900"
          :placeholder="DEFAULT_TITLE"
          maxlength="30"
          aria-label="標題"
          @done="title = title.trim()"
        />
      </h1>
      <button
        class="grid size-10 shrink-0 place-items-center rounded-full border shadow-sm transition"
        :class="
          editing
            ? 'border-slate-900 bg-slate-900 text-white hover:bg-black dark:border-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200'
            : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
        "
        :aria-label="editing ? '完成編輯' : '編輯'"
        :title="editing ? '完成' : '編輯'"
        :aria-pressed="editing"
        @click="toggleEditing"
      >
        <CheckIcon v-if="editing" />
        <PencilIcon v-else />
      </button>
      <button
        class="grid size-10 shrink-0 place-items-center rounded-full border border-slate-300 bg-white text-lg shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
        :aria-label="isDark ? '切換為淺色模式' : '切換為深色模式'"
        :title="isDark ? '淺色模式' : '深色模式'"
        @click="toggleTheme"
      >
        {{ isDark ? '☀️' : '🌙' }}
      </button>
    </header>

    <!-- 白板 -->
    <ScoreTable
      :players="players"
      :rows="rows"
      :totals="totals"
      :struck="struck"
      :editing="editing"
      :active-cell="picker"
      @pick="openPicker"
      @rename="board.renamePlayer"
      @add-player="board.addPlayer"
      @remove-player="removePlayer"
      @remove-row="removeRow"
      @move-row="board.moveRow"
      @move-player="board.movePlayer"
      @toggle-struck="board.toggleStruck"
    />

    <button
      class="mt-3 self-center rounded-full px-4 py-1.5 text-sm text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
      @click="board.addRow"
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

    <ScorePicker
      :open="!!picker"
      :round="pickerRound"
      :player-name="pickerName"
      @select="selectScore"
      @close="picker = null"
    />
    <ConfirmDialog />
    <AppToast />
  </div>
</template>
