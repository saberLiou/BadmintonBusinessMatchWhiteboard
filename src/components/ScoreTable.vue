<script setup>
// 白板表格：顯示選手、各局分數與總分
// - 短按局號／選手名稱：選取該局／選手，顯示刪除按鈕（選手同時可改名）
// - 長按（或右鍵）局號／選手名稱：進入排序模式，所有局與選手顯示拖曳把手
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { fmt, scoreClass, rowSum, rowFilled } from '../utils/score'
import { MIN_PLAYERS } from '../composables/useBoard'
import { useDragSort } from '../composables/useDragSort'
import { useLongPress } from '../composables/useLongPress'
import { GripIcon, TrashIcon, StrikeIcon } from './icons'
import DoneInput from './DoneInput.vue'

const props = defineProps({
  players: { type: Array, required: true },
  rows: { type: Array, required: true },
  totals: { type: Array, required: true },
  /** 各欄總分是否已劃掉 */
  struck: { type: Array, default: () => [] },
  /** 排序模式：顯示拖曳把手、鎖定分數格 */
  sorting: { type: Boolean, default: false },
  /** 目前選取中的格子 { r, c } */
  activeCell: { type: Object, default: null },
})

const emit = defineEmits([
  'pick', // (r, c)
  'rename', // (c, name)
  'add-player',
  'remove-player', // (c)
  'remove-row', // (r)
  'move-row', // (from, to)
  'move-player', // (from, to)
  'toggle-struck', // (c)
  'start-sorting',
])

const tableEl = ref(null)
const nameInputs = ref([])
const selected = ref(null) // { type: 'row' | 'col', index }

// ---------- 排序（拖曳與鍵盤） ----------
const { drag, start, move, end, isDragging } = useDragSort(tableEl, {
  onMove: (type, from, to) => emit(type === 'row' ? 'move-row' : 'move-player', from, to),
})

// 離開排序模式時中止拖曳
watch(
  () => props.sorting,
  (v) => {
    if (v) selected.value = null
    else end()
  },
)

/** 把手的方向鍵排序，移動後焦點跟著項目走 */
async function onGripKey(type, i, e) {
  const isRow = type === 'row'
  const step = { ArrowUp: -1, ArrowDown: 1, ArrowLeft: -1, ArrowRight: 1 }[e.key]
  if (!step || isRow !== (e.key === 'ArrowUp' || e.key === 'ArrowDown')) return
  e.preventDefault()
  const to = i + step
  const count = isRow ? props.rows.length : props.players.length
  if (to < 0 || to >= count) return
  emit(isRow ? 'move-row' : 'move-player', i, to)
  await nextTick()
  tableEl.value?.querySelectorAll(`[data-test="grip-${isRow ? 'row' : 'player'}"]`)[to]?.focus()
}

// ---------- 選取（短按） ----------
const isSelected = (type, i) => selected.value?.type === type && selected.value.index === i
const zoneKey = (type, i) => `${type}-${i}`

const longPress = useLongPress(startSorting)

function startSorting() {
  if (props.sorting) return
  longPress.cancel()
  document.activeElement?.blur?.()
  try {
    navigator.vibrate?.(10)
  } catch {
    // 不支援震動時略過
  }
  emit('start-sorting')
}

/** 右鍵／Android 長按：進入排序；但改名中的輸入框保留原生選單（選字、貼上） */
function onContextMenu(e) {
  if (e.target.tagName === 'INPUT') return
  e.preventDefault()
  startSorting()
}

function onPressDown(e) {
  // 輸入框保留原生的長按（選字、游標）；完成鈕與刪除鈕是按鈕，不當作長按起點
  if (props.sorting) return
  if (e.target.closest('input, [data-test="done-input"], [data-test="remove-row"]')) return
  longPress.down(e)
}

function selectRow(r) {
  if (longPress.consumeClick() || props.sorting) return
  selected.value = isSelected('row', r) ? null : { type: 'row', index: r }
}

function selectCol(c, e) {
  if (longPress.consumeClick() || props.sorting) return
  // 輸入框內的完成按鈕：結束輸入，不要再聚焦
  if (e.target.closest('button')) return
  selected.value = { type: 'col', index: c }
  // 在點擊事件內同步聚焦，手機才會叫出鍵盤
  nameInputs.value[c]?.focus()
}

/** 以 Tab 聚焦名稱輸入框時也視為選取該選手 */
function onNameFocus(c) {
  if (!props.sorting) selected.value = { type: 'col', index: c }
}

/**
 * 結束改名即取消選取：
 * - Enter／完成鈕（committed）一律取消
 * - 以 Tab 移到同一欄的刪除按鈕時保留
 * - 因按下別處而失焦時，交給點擊完成後再取消（見下方），避免按下與放開之間版面位移
 */
function onNameDone(c, e, committed) {
  if (!committed) {
    if (e?.relatedTarget?.closest?.(`[data-select-zone="${zoneKey('col', c)}"]`)) return
    if (isPressing()) return
  }
  if (isSelected('col', c)) selected.value = null
}

/** 刪除按鈕按下時不讓輸入框失焦（否則會先取消選取），點擊後才收起鍵盤再送出 */
function removePlayer(c) {
  document.activeElement?.blur?.()
  emit('remove-player', c)
}

// 在目前選取範圍外點擊、開始捲動，或按 Esc，即取消選取。
// 不在按下時就取消：取消會收起表頭的刪除列、改變欄寬，使放開時指標落在別的格子上而點不到。
// 是否有指標按著。iOS 在輸入框長按後可能不送 pointerup／pointercancel，
// 所以按下超過 PRESS_STALE_MS 就不再視為按著，避免狀態卡住
const PRESS_STALE_MS = 1000
let pressedAt = 0
const isPressing = () => pressedAt > 0 && Date.now() - pressedAt < PRESS_STALE_MS
function clearIfOutside(e) {
  if (!selected.value) return
  const zone = e.target.closest?.('[data-select-zone]')?.dataset.selectZone
  if (zone !== zoneKey(selected.value.type, selected.value.index)) selected.value = null
}
const onDocPointerDown = () => (pressedAt = Date.now())
const onDocPointerUp = () => (pressedAt = 0)
function onDocPointerCancel(e) {
  pressedAt = 0
  clearIfOutside(e) // 捲動不會產生 click
}
function onDocKeydown(e) {
  if (e.key === 'Escape') selected.value = null
}
const docListeners = [
  ['pointerdown', onDocPointerDown],
  ['pointerup', onDocPointerUp],
  ['pointercancel', onDocPointerCancel],
  ['click', clearIfOutside], // 捕獲階段：先取消舊選取，目標的點擊處理再設定新選取
  ['keydown', onDocKeydown],
]
onMounted(() => docListeners.forEach(([t, fn]) => document.addEventListener(t, fn, true)))
onUnmounted(() => {
  docListeners.forEach(([t, fn]) => document.removeEventListener(t, fn, true))
  longPress.cancel()
})

// 局或選手增減後索引會位移，取消選取
watch(
  () => [props.rows.length, props.players.length],
  () => (selected.value = null),
)

// ---------- 樣式 ----------
const dragCellClass = 'bg-sky-50 dark:bg-sky-900/30'
const selectedCellClass = 'bg-sky-50/70 dark:bg-sky-900/20'
const colClass = (c) =>
  (isDragging('col', c) && dragCellClass) || (isSelected('col', c) && selectedCellClass)
const rowClass = (r) =>
  (isDragging('row', r) && dragCellClass) || (isSelected('row', r) && selectedCellClass)

/** 可長按的區域：不觸發選字與 iOS 長按選單，但保留捲動 */
const pressZoneClass = 'select-none [-webkit-touch-callout:none]'

const gripClass =
  'grid size-7 cursor-grab touch-none place-items-center rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-sky-400 active:cursor-grabbing dark:hover:bg-slate-700 dark:hover:text-slate-200'
const removeClass =
  'grid size-7 place-items-center rounded-md text-slate-400 hover:bg-rose-500/15 hover:text-rose-600 disabled:pointer-events-none disabled:opacity-30 dark:hover:text-rose-400'

const showColTools = () => props.sorting || selected.value?.type === 'col'
const wideFirstCol = () => props.sorting || selected.value?.type === 'row'
</script>

<template>
  <div
    class="board-scroll overflow-auto overscroll-contain rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
  >
    <table ref="tableEl" class="w-full border-collapse text-center" :class="drag && 'select-none'">
      <!-- 表頭固定置頂（以外層容器為捲動範圍） -->
      <thead
        class="sticky top-0 z-10 bg-slate-50 shadow-[0_1px_0_var(--color-slate-200)] dark:bg-slate-800 dark:shadow-[0_1px_0_var(--color-slate-700)]"
      >
        <!-- 排序模式：所有選手的拖曳把手；選取選手時：該選手的刪除按鈕 -->
        <tr v-if="showColTools()">
          <th></th>
          <th
            v-for="(_, c) in players"
            :key="c"
            data-col
            :data-select-zone="zoneKey('col', c)"
            class="border-l border-slate-200 px-1 pt-1 dark:border-slate-800"
            :class="colClass(c)"
          >
            <div class="flex h-7 items-center justify-center">
              <button
                v-if="sorting"
                :class="gripClass"
                title="拖曳排序（或用左右方向鍵）"
                :aria-label="`拖曳排序選手${c + 1}`"
                data-test="grip-player"
                @pointerdown="start('col', c, $event)"
                @pointermove="move"
                @pointerup="end"
                @pointercancel="end"
                @keydown="onGripKey('col', c, $event)"
              >
                <GripIcon horizontal />
              </button>
              <button
                v-else-if="isSelected('col', c)"
                :class="removeClass"
                :disabled="players.length <= MIN_PLAYERS"
                :title="
                  players.length <= MIN_PLAYERS ? `至少需要 ${MIN_PLAYERS} 位選手` : '移除選手'
                "
                aria-label="移除選手"
                data-test="remove-player"
                @pointerdown.prevent
                @mousedown.prevent
                @click="removePlayer(c)"
              >
                <TrashIcon />
              </button>
            </div>
          </th>
          <th class="border-l border-slate-200 dark:border-slate-800"></th>
        </tr>
        <tr>
          <th
            class="px-1.5 py-2 text-xs font-medium text-slate-400"
            :class="wideFirstCol() ? 'w-16' : 'w-10'"
          >
            局
          </th>
          <th
            v-for="(name, c) in players"
            :key="c"
            :data-select-zone="zoneKey('col', c)"
            class="min-w-16 border-l border-slate-200 px-1 py-1 dark:border-slate-800"
            :class="[colClass(c), pressZoneClass, !sorting && 'cursor-pointer']"
            data-test="player-cell"
            @click="selectCol(c, $event)"
            @pointerdown="onPressDown"
            @pointermove="longPress.move"
            @pointerup="longPress.cancel"
            @pointercancel="longPress.cancel"
            @pointerleave="longPress.cancel"
            @contextmenu="onContextMenu"
          >
            <!-- 未選取時輸入框不接收指標，讓整格可長按；選取後才可直接點選文字 -->
            <DoneInput
              ref="nameInputs"
              :model-value="name"
              :input-class="[
                'w-full rounded-md bg-transparent px-1 py-1.5 text-center text-sm font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-sky-400 dark:focus:bg-slate-900',
                !isSelected('col', c) && 'pointer-events-none',
              ]"
              :placeholder="`選手${c + 1}`"
              :aria-label="`選手${c + 1}名稱`"
              :tabindex="sorting ? -1 : undefined"
              maxlength="10"
              @focus="onNameFocus(c)"
              @done="(e, committed) => onNameDone(c, e, committed)"
              @update:model-value="emit('rename', c, $event)"
            />
          </th>
          <th class="w-10 border-l border-slate-200 dark:border-slate-800">
            <button
              class="mx-auto grid size-8 place-items-center rounded-full text-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
              title="新增選手"
              aria-label="新增選手"
              data-test="add-player"
              @click="emit('add-player')"
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
          data-row
          class="border-t border-slate-100 dark:border-slate-800"
          :class="rowClass(r)"
        >
          <td
            class="px-1 text-xs tabular-nums text-slate-400"
            :class="pressZoneClass"
            :data-select-zone="zoneKey('row', r)"
            @pointerdown="onPressDown"
            @pointermove="longPress.move"
            @pointerup="longPress.cancel"
            @pointercancel="longPress.cancel"
            @pointerleave="longPress.cancel"
            @contextmenu="onContextMenu"
          >
            <!-- 排序模式：局號與拖曳把手 -->
            <div v-if="sorting" class="flex items-center justify-between gap-1">
              <button
                :class="gripClass"
                title="拖曳排序（或用上下方向鍵）"
                :aria-label="`拖曳排序第 ${r + 1} 局`"
                data-test="grip-row"
                @pointerdown="start('row', r, $event)"
                @pointermove="move"
                @pointerup="end"
                @pointercancel="end"
                @keydown="onGripKey('row', r, $event)"
              >
                <GripIcon />
              </button>
              <span class="pr-1">{{ r + 1 }}</span>
            </div>
            <!-- 選取時：刪除按鈕與局號 -->
            <div v-else-if="isSelected('row', r)" class="flex items-center justify-between gap-1">
              <button
                :class="removeClass"
                :title="`刪除第 ${r + 1} 局`"
                :aria-label="`刪除第 ${r + 1} 局`"
                data-test="remove-row"
                @click="emit('remove-row', r)"
              >
                <TrashIcon />
              </button>
              <button
                class="h-11 flex-1 pr-1 text-right"
                :aria-label="`取消選取第 ${r + 1} 局`"
                aria-pressed="true"
                data-test="row-number"
                @click="selectRow(r)"
              >
                {{ r + 1 }}
              </button>
            </div>
            <button
              v-else
              class="h-11 w-full cursor-pointer"
              :aria-label="`選取第 ${r + 1} 局`"
              aria-pressed="false"
              data-test="row-number"
              @click="selectRow(r)"
            >
              {{ r + 1 }}
            </button>
          </td>
          <td
            v-for="(v, c) in row"
            :key="c"
            class="border-l border-slate-100 p-0 dark:border-slate-800"
            :class="colClass(c)"
          >
            <button
              class="h-11 w-full text-lg font-bold tabular-nums transition-[background-color] enabled:hover:bg-sky-50 disabled:cursor-default dark:enabled:hover:bg-slate-800"
              :class="[
                scoreClass(v),
                sorting && 'opacity-50',
                activeCell?.r === r && activeCell?.c === c && 'bg-sky-100 dark:bg-sky-900/40',
              ]"
              :disabled="sorting"
              data-test="cell"
              @click="emit('pick', r, c)"
            >
              {{ v === null ? '·' : fmt(v) }}
            </button>
          </td>
          <td class="border-l border-slate-100 dark:border-slate-800">
            <span
              v-if="rowFilled(row) && rowSum(row) !== 0"
              class="text-xs text-amber-500"
              :title="`本局加總為 ${fmt(rowSum(row))}，輸贏未相抵`"
              data-test="unbalanced"
            >
              ⚠
            </span>
          </td>
        </tr>
      </tbody>

      <tfoot>
        <tr
          class="border-t-2 border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60"
        >
          <td class="whitespace-nowrap px-1.5 py-3 text-xs font-medium text-slate-500">總分</td>
          <td
            v-for="(t, c) in totals"
            :key="c"
            class="border-l border-slate-200 py-3 text-xl font-extrabold tabular-nums transition-opacity dark:border-slate-700"
            :class="[
              scoreClass(t),
              colClass(c),
              struck[c] && 'line-through decoration-2 opacity-40',
            ]"
            data-test="total"
          >
            {{ t === 0 ? '0' : fmt(t) }}
          </td>
          <td class="border-l border-slate-200 dark:border-slate-700"></td>
        </tr>
        <!-- 劃掉各欄總分（例如已結清） -->
        <tr class="bg-slate-50 dark:bg-slate-800/60">
          <td></td>
          <td
            v-for="(_, c) in totals"
            :key="c"
            class="border-l border-slate-200 pb-2 dark:border-slate-700"
            :class="colClass(c)"
          >
            <button
              class="mx-auto grid size-8 place-items-center rounded-lg transition"
              :class="
                struck[c]
                  ? 'bg-slate-900 text-white hover:bg-black dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200'
                  : 'text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200'
              "
              :aria-pressed="!!struck[c]"
              :aria-label="struck[c] ? '取消劃掉總分' : '劃掉總分'"
              :title="struck[c] ? '取消劃掉' : '劃掉總分'"
              data-test="toggle-struck"
              @click="emit('toggle-struck', c)"
            >
              <StrikeIcon />
            </button>
          </td>
          <td class="border-l border-slate-200 dark:border-slate-700"></td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>
