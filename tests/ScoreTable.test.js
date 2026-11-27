import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { LONG_PRESS_MS } from '../src/composables/useLongPress'
import ScoreTable from '../src/components/ScoreTable.vue'

const baseProps = {
  players: ['甲', '乙', '丙'],
  rows: [
    [1, -1, null],
    [2, null, null],
  ],
  totals: [3, -1, 0],
}

const mountTable = (props = {}, options = {}) =>
  mount(ScoreTable, { props: { ...baseProps, ...props }, ...options })

describe('ScoreTable', () => {
  it('顯示分數與總分', () => {
    const w = mountTable()
    const cells = w.findAll('[data-test="cell"]').map((c) => c.text())
    expect(cells).toEqual(['+1', '-1', '·', '+2', '·', '·'])
    expect(w.findAll('[data-test="total"]').map((c) => c.text())).toEqual(['+3', '-1', '0'])
  })

  it('輸贏未相抵的局顯示提示', () => {
    const w = mountTable()
    // 第 1 局 1 + (-1) = 0，第 2 局 = 2
    expect(w.findAll('[data-test="unbalanced"]')).toHaveLength(1)
  })

  it('一般模式不顯示拖曳與刪除', () => {
    const w = mountTable()
    expect(w.find('[data-test="grip-row"]').exists()).toBe(false)
    expect(w.find('[data-test="remove-row"]').exists()).toBe(false)
    expect(w.find('[data-test="remove-player"]').exists()).toBe(false)
  })

  it('點格子送出 pick', async () => {
    const w = mountTable()
    await w.findAll('[data-test="cell"]')[4].trigger('click')
    expect(w.emitted('pick')).toEqual([[1, 1]])
  })

  it('修改選手名稱送出 rename', async () => {
    const w = mountTable()
    await w.findAll('input')[1].setValue('阿華')
    expect(w.emitted('rename')).toEqual([[1, '阿華']])
  })

  it('新增選手', async () => {
    const w = mountTable()
    await w.find('[data-test="add-player"]').trigger('click')
    expect(w.emitted('add-player')).toHaveLength(1)
  })

  it('劃掉總分按鈕送出 toggle-struck，已劃掉的總分加上刪除線', async () => {
    const w = mountTable({ struck: [false, true, false] })
    const totals = w.findAll('[data-test="total"]')
    expect(totals[1].classes()).toContain('line-through')
    expect(totals[0].classes()).not.toContain('line-through')
    const toggles = w.findAll('[data-test="toggle-struck"]')
    expect(toggles).toHaveLength(3)
    expect(toggles[1].attributes('aria-pressed')).toBe('true')
    await toggles[2].trigger('click')
    expect(w.emitted('toggle-struck')).toEqual([[2]])
  })

  it('選手名稱輸入中顯示完成按鈕，點擊後結束輸入', async () => {
    const w = mountTable({}, { attachTo: document.body })
    const input = w.findAll('input')[0]
    const done = () => w.findAll('[data-test="done-input"]')[0]
    expect(done().isVisible()).toBe(false)
    input.element.focus()
    await input.trigger('focus')
    expect(done().isVisible()).toBe(true)
    await done().trigger('click')
    expect(document.activeElement).not.toBe(input.element)
    expect(done().isVisible()).toBe(false)
    w.unmount()
  })

  describe('短按選取', () => {
    it('點局號顯示該局的刪除按鈕，再點一次取消', async () => {
      const w = mountTable()
      await w.findAll('[data-test="row-number"]')[1].trigger('click')
      expect(w.findAll('[data-test="remove-row"]')).toHaveLength(1)
      await w.find('[data-test="remove-row"]').trigger('click')
      expect(w.emitted('remove-row')).toEqual([[1]])
      await w.findAll('[data-test="row-number"]')[1].trigger('click')
      expect(w.find('[data-test="remove-row"]').exists()).toBe(false)
    })

    it('點選手名稱顯示該選手的刪除按鈕並聚焦輸入框', async () => {
      const w = mountTable({}, { attachTo: document.body })
      await w.findAll('[data-test="player-cell"]')[2].trigger('click')
      expect(w.findAll('[data-test="remove-player"]')).toHaveLength(1)
      expect(document.activeElement).toBe(w.findAll('input')[2].element)
      await w.find('[data-test="remove-player"]').trigger('click')
      expect(w.emitted('remove-player')).toEqual([[2]])
      w.unmount()
    })

    it('改名後按完成，刪除按鈕一併收起', async () => {
      const w = mountTable({}, { attachTo: document.body })
      await w.findAll('[data-test="player-cell"]')[1].trigger('click')
      expect(w.find('[data-test="remove-player"]').exists()).toBe(true)
      await w.findAll('[data-test="done-input"]')[1].trigger('click')
      expect(document.activeElement).not.toBe(w.findAll('input')[1].element)
      expect(w.find('[data-test="remove-player"]').exists()).toBe(false)
      w.unmount()
    })

    it('在選取範圍外點擊即取消選取，但按下時版面不變', async () => {
      const w = mountTable({}, { attachTo: document.body })
      await w.findAll('[data-test="row-number"]')[0].trigger('click')
      const cell = w.findAll('[data-test="cell"]')[3]
      await cell.trigger('pointerdown')
      expect(w.find('[data-test="remove-row"]').exists()).toBe(true)
      await cell.trigger('pointerup')
      await cell.trigger('click')
      expect(w.find('[data-test="remove-row"]').exists()).toBe(false)
      w.unmount()
    })

    it('選取選手時點局號：按下不收起刪除列，點擊後改選該局', async () => {
      const w = mountTable({}, { attachTo: document.body })
      await w.findAll('[data-test="player-cell"]')[0].trigger('click')
      const num = w.findAll('[data-test="row-number"]')[1]
      await num.trigger('pointerdown', { button: 0 })
      w.findAll('input')[0].element.blur() // 按下別處時輸入框失焦
      await nextTick()
      expect(w.find('[data-test="remove-player"]').exists()).toBe(true)
      await num.trigger('pointerup')
      await num.trigger('click')
      expect(w.find('[data-test="remove-player"]').exists()).toBe(false)
      expect(w.findAll('[data-test="remove-row"]')).toHaveLength(1)
      w.unmount()
    })

    it('開始捲動（pointercancel）即取消選取', async () => {
      const w = mountTable({}, { attachTo: document.body })
      await w.findAll('[data-test="row-number"]')[0].trigger('click')
      const cell = w.findAll('[data-test="cell"]')[3]
      await cell.trigger('pointerdown')
      await cell.trigger('pointercancel')
      expect(w.find('[data-test="remove-row"]').exists()).toBe(false)
      w.unmount()
    })

    it('只剩 2 位選手時無法刪除選手', async () => {
      const w = mountTable({ players: ['甲', '乙'], rows: [[1, -1]], totals: [1, -1] })
      await w.findAll('[data-test="player-cell"]')[0].trigger('click')
      expect(w.find('[data-test="remove-player"]').attributes('disabled')).toBeDefined()
    })
  })

  describe('長按進入排序', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())

    it('長按局號送出 start-sorting，放開後的 click 不會選取', async () => {
      const w = mountTable()
      const num = w.findAll('[data-test="row-number"]')[0]
      await num.trigger('pointerdown', { button: 0, clientX: 0, clientY: 0 })
      vi.advanceTimersByTime(LONG_PRESS_MS)
      expect(w.emitted('start-sorting')).toHaveLength(1)
      await num.trigger('pointerup')
      await num.trigger('click')
      expect(w.find('[data-test="remove-row"]').exists()).toBe(false)
    })

    it('移動（捲動）或太快放開不會觸發', async () => {
      const w = mountTable()
      const cell = w.findAll('[data-test="player-cell"]')[0]
      await cell.trigger('pointerdown', { button: 0, clientX: 0, clientY: 0 })
      await cell.trigger('pointermove', { clientX: 0, clientY: 20 })
      vi.advanceTimersByTime(LONG_PRESS_MS)
      await cell.trigger('pointerdown', { button: 0, clientX: 0, clientY: 0 })
      vi.advanceTimersByTime(LONG_PRESS_MS - 100)
      await cell.trigger('pointerup')
      vi.advanceTimersByTime(200)
      expect(w.emitted('start-sorting')).toBeUndefined()
    })

    it('右鍵（contextmenu）也會進入排序', async () => {
      const w = mountTable()
      await w.findAll('[data-test="player-cell"]')[1].trigger('contextmenu')
      expect(w.emitted('start-sorting')).toHaveLength(1)
    })
  })

  describe('排序模式', () => {
    it('顯示每局與每位選手的拖曳把手，不顯示刪除', () => {
      const w = mountTable({ sorting: true })
      expect(w.findAll('[data-test="grip-row"]')).toHaveLength(2)
      expect(w.findAll('[data-test="grip-player"]')).toHaveLength(3)
      expect(w.find('[data-test="remove-row"]').exists()).toBe(false)
      expect(w.find('[data-test="remove-player"]').exists()).toBe(false)
    })

    it('分數格鎖定，點選手名稱不會選取', async () => {
      const w = mountTable({ sorting: true })
      w.findAll('[data-test="cell"]').forEach((c) => expect(c.attributes('disabled')).toBeDefined())
      await w.findAll('[data-test="player-cell"]')[0].trigger('click')
      expect(w.find('[data-test="remove-player"]').exists()).toBe(false)
    })

    it('方向鍵移動局與選手', async () => {
      const w = mountTable({ sorting: true })
      await w.findAll('[data-test="grip-row"]')[0].trigger('keydown', { key: 'ArrowDown' })
      await w.findAll('[data-test="grip-row"]')[0].trigger('keydown', { key: 'ArrowUp' })
      await w.findAll('[data-test="grip-player"]')[1].trigger('keydown', { key: 'ArrowLeft' })
      await w.findAll('[data-test="grip-player"]')[2].trigger('keydown', { key: 'ArrowRight' })
      // 第 1 局往上、最後一位往右都已到邊界，不送出
      expect(w.emitted('move-row')).toEqual([[0, 1]])
      expect(w.emitted('move-player')).toEqual([[1, 0]])
    })
  })
})
