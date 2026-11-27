import { describe, it, expect, vi, afterEach } from 'vitest'
import { findTargetIndex } from '../src/composables/useDragSort'
import { useConfirm } from '../src/composables/useConfirm'
import { useToast } from '../src/composables/useToast'
import { useLongPress, LONG_PRESS_MS, MOVE_TOLERANCE } from '../src/composables/useLongPress'
import { imageFileName } from '../src/utils/shareImage'

describe('findTargetIndex', () => {
  const spans = [
    { start: 0, end: 40 },
    { start: 40, end: 80 },
    { start: 80, end: 120 },
  ]

  it('指標落在哪一項就回傳該索引', () => {
    expect(findTargetIndex(spans, 10, 2)).toBe(0)
    expect(findTargetIndex(spans, 40, 0)).toBe(1)
    expect(findTargetIndex(spans, 119, 0)).toBe(2)
  })

  it('超出範圍時夾在頭尾', () => {
    expect(findTargetIndex(spans, -50, 2)).toBe(0)
    expect(findTargetIndex(spans, 500, 0)).toBe(2)
  })

  it('落在間隙時維持原索引', () => {
    const gapped = [
      { start: 0, end: 30 },
      { start: 50, end: 80 },
    ]
    expect(findTargetIndex(gapped, 40, 1)).toBe(1)
  })

  it('沒有項目時維持原索引', () => {
    expect(findTargetIndex([], 10, 3)).toBe(3)
  })
})

describe('useLongPress', () => {
  afterEach(() => vi.useRealTimers())
  const down = { button: 0, clientX: 10, clientY: 10 }

  it('按住超過時間才觸發，並帶入額外參數', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const lp = useLongPress(fn)
    lp.down(down, 'row', 3)
    vi.advanceTimersByTime(LONG_PRESS_MS - 1)
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledWith('row', 3)
  })

  it('小幅移動不取消，超過容許距離即取消', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const lp = useLongPress(fn)
    lp.down(down)
    lp.move({ clientX: 10 + MOVE_TOLERANCE - 1, clientY: 10 })
    vi.advanceTimersByTime(LONG_PRESS_MS)
    expect(fn).toHaveBeenCalledTimes(1)
    lp.down(down)
    lp.move({ clientX: 10, clientY: 10 + MOVE_TOLERANCE + 1 })
    vi.advanceTimersByTime(LONG_PRESS_MS)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('非主要按鍵不啟動', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    useLongPress(fn).down({ ...down, button: 2 })
    vi.advanceTimersByTime(LONG_PRESS_MS)
    expect(fn).not.toHaveBeenCalled()
  })

  it('長按後只吃掉一次 click，下次按下即重設', () => {
    vi.useFakeTimers()
    const lp = useLongPress(() => {})
    lp.down(down)
    vi.advanceTimersByTime(LONG_PRESS_MS)
    expect(lp.consumeClick()).toBe(true)
    expect(lp.consumeClick()).toBe(false)
    lp.down(down)
    vi.advanceTimersByTime(LONG_PRESS_MS)
    lp.down(down) // 長按後沒有 click，下一次按下不應被吃掉
    lp.cancel()
    expect(lp.consumeClick()).toBe(false)
  })
})

describe('useConfirm', () => {
  it('確認回傳 true、取消回傳 false', async () => {
    const { dialog, askConfirm, closeDialog } = useConfirm()
    const p1 = askConfirm({ title: '刪除？' })
    expect(dialog.value.title).toBe('刪除？')
    expect(dialog.value.confirmText).toBe('確定')
    closeDialog(true)
    await expect(p1).resolves.toBe(true)
    expect(dialog.value).toBeNull()

    const p2 = askConfirm({ title: '清除？' })
    closeDialog(false)
    await expect(p2).resolves.toBe(false)
  })

  it('開新彈窗時，前一個視為取消', async () => {
    const { askConfirm, closeDialog } = useConfirm()
    const first = askConfirm({ title: 'A' })
    const second = askConfirm({ title: 'B' })
    await expect(first).resolves.toBe(false)
    closeDialog(true)
    await expect(second).resolves.toBe(true)
  })
})

describe('useToast', () => {
  afterEach(() => vi.useRealTimers())

  it('顯示後自動消失', () => {
    vi.useFakeTimers()
    const { toast, showToast } = useToast()
    showToast('已清除')
    expect(toast.value).toBe('已清除')
    vi.advanceTimersByTime(1999)
    expect(toast.value).toBe('已清除')
    vi.advanceTimersByTime(1)
    expect(toast.value).toBe('')
  })

  it('新訊息會重新計時', () => {
    vi.useFakeTimers()
    const { toast, showToast } = useToast()
    showToast('A')
    vi.advanceTimersByTime(1500)
    showToast('B')
    vi.advanceTimersByTime(1500)
    expect(toast.value).toBe('B')
  })
})

describe('imageFileName', () => {
  it('標題加日期，並移除不合法字元', () => {
    expect(imageFileName('週三/球局:決賽?', new Date(2026, 0, 5))).toBe('週三球局決賽-20260105.png')
  })
})
