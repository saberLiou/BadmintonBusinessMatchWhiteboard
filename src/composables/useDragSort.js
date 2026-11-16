// 以 Pointer Events 實作的拖曳排序（滑鼠與觸控皆可用）
import { ref } from 'vue'

/**
 * 依指標位置找出目標索引
 * @param {{ start: number, end: number }[]} spans 各項目在拖曳軸上的範圍（已排序）
 * @param {number} pos 指標在拖曳軸上的位置
 * @param {number} current 目前索引（指標不在任何項目上時沿用）
 */
export function findTargetIndex(spans, pos, current) {
  if (spans.length === 0) return current
  if (pos < spans[0].start) return 0
  if (pos >= spans[spans.length - 1].end) return spans.length - 1
  const i = spans.findIndex((s) => pos >= s.start && pos < s.end)
  return i === -1 ? current : i
}

const SELECTORS = { row: '[data-row]', col: '[data-col]' }

/**
 * @param {import('vue').Ref<HTMLElement|null>} containerRef 包含 [data-row] / [data-col] 的容器
 * @param {{ onMove: (type: 'row'|'col', from: number, to: number) => void }} options
 */
export function useDragSort(containerRef, { onMove }) {
  const drag = ref(null) // { type, index }

  function start(type, index, e) {
    if (e.button !== undefined && e.button !== 0) return
    drag.value = { type, index }
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // 合成事件或不支援時無法擷取指標，拖曳仍可運作
    }
  }

  function move(e) {
    if (!drag.value || !containerRef.value) return
    const { type, index } = drag.value
    const isRow = type === 'row'
    const spans = [...containerRef.value.querySelectorAll(SELECTORS[type])].map((el) => {
      const r = el.getBoundingClientRect()
      return isRow ? { start: r.top, end: r.bottom } : { start: r.left, end: r.right }
    })
    const target = findTargetIndex(spans, isRow ? e.clientY : e.clientX, index)
    if (target === index) return
    onMove(type, index, target)
    drag.value.index = target
  }

  function end() {
    drag.value = null
  }

  const isDragging = (type, i) => drag.value?.type === type && drag.value.index === i

  return { drag, start, move, end, isDragging }
}
