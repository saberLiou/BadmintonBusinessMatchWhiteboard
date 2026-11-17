<script setup>
// 白板表格：顯示選手、各局分數與總分；編輯模式下提供拖曳排序與刪除
import { ref, watch } from 'vue'
import { fmt, scoreClass, rowSum, rowFilled } from '../utils/score'
import { MIN_PLAYERS } from '../composables/useBoard'
import { useDragSort } from '../composables/useDragSort'
import { GripIcon, RemoveIcon, StrikeIcon } from './icons'
import DoneInput from './DoneInput.vue'

const props = defineProps({
  players: { type: Array, required: true },
  rows: { type: Array, required: true },
  totals: { type: Array, required: true },
  /** 各欄總分是否已劃掉 */
  struck: { type: Array, default: () => [] },
  editing: { type: Boolean, default: false },
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
])

const tableEl = ref(null)
const { drag, start, move, end, isDragging } = useDragSort(tableEl, {
  onMove: (type, from, to) => emit(type === 'row' ? 'move-row' : 'move-player', from, to),
})

// 離開編輯模式時中止拖曳
watch(
  () => props.editing,
  (v) => !v && end(),
)

const dragCellClass = 'bg-sky-50 dark:bg-sky-900/30'
const colClass = (c) => isDragging('col', c) && dragCellClass

const gripClass =
  'grid size-7 cursor-grab touch-none place-items-center rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-700 active:cursor-grabbing dark:hover:bg-slate-700 dark:hover:text-slate-200'
const removeClass =
  'grid size-7 place-items-center rounded-md text-slate-400 hover:bg-rose-500/15 hover:text-rose-600 disabled:pointer-events-none disabled:opacity-30 dark:hover:text-rose-400'
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
        <!-- 編輯模式：選手的刪除與拖曳 -->
        <tr v-if="editing">
          <th></th>
          <th
            v-for="(_, c) in players"
            :key="c"
            data-col
            class="border-l border-slate-200 px-1 pt-1 dark:border-slate-800"
            :class="colClass(c)"
          >
            <div class="flex items-center justify-center gap-2">
              <button
                :class="removeClass"
                :disabled="players.length <= MIN_PLAYERS"
                :title="
                  players.length <= MIN_PLAYERS ? `至少需要 ${MIN_PLAYERS} 位選手` : '移除選手'
                "
                aria-label="移除選手"
                data-test="remove-player"
                @click="emit('remove-player', c)"
              >
                <RemoveIcon />
              </button>
              <button
                :class="gripClass"
                title="拖曳排序"
                aria-label="拖曳排序選手"
                data-test="grip-player"
                @pointerdown="start('col', c, $event)"
                @pointermove="move"
                @pointerup="end"
                @pointercancel="end"
              >
                <GripIcon horizontal />
              </button>
            </div>
          </th>
          <th class="border-l border-slate-200 dark:border-slate-800"></th>
        </tr>
        <tr>
          <th
            class="px-1.5 py-2 text-xs font-medium text-slate-400"
            :class="editing ? 'w-24' : 'w-10'"
          >
            局
          </th>
          <th
            v-for="(name, c) in players"
            :key="c"
            class="min-w-16 border-l border-slate-200 px-1 py-1 dark:border-slate-800"
            :class="colClass(c)"
          >
            <DoneInput
              :model-value="name"
              input-class="w-full rounded-md bg-transparent px-1 py-1.5 text-center text-sm font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-sky-400 dark:focus:bg-slate-900"
              :placeholder="`選手${c + 1}`"
              :aria-label="`選手${c + 1}名稱`"
              maxlength="10"
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
          :class="isDragging('row', r) && dragCellClass"
        >
          <td class="px-1 text-xs tabular-nums text-slate-400">
            <!-- 編輯模式：局的刪除與拖曳 -->
            <div v-if="editing" class="flex items-center justify-between gap-1">
              <button
                :class="removeClass"
                :title="`刪除第 ${r + 1} 局`"
                :aria-label="`刪除第 ${r + 1} 局`"
                data-test="remove-row"
                @click="emit('remove-row', r)"
              >
                <RemoveIcon />
              </button>
              <span>{{ r + 1 }}</span>
              <button
                :class="gripClass"
                title="拖曳排序"
                :aria-label="`拖曳排序第 ${r + 1} 局`"
                data-test="grip-row"
                @pointerdown="start('row', r, $event)"
                @pointermove="move"
                @pointerup="end"
                @pointercancel="end"
              >
                <GripIcon />
              </button>
            </div>
            <template v-else>{{ r + 1 }}</template>
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
                editing && 'opacity-50',
                activeCell?.r === r && activeCell?.c === c && 'bg-sky-100 dark:bg-sky-900/40',
              ]"
              :disabled="editing"
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
