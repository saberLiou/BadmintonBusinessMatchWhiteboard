import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
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

  describe('編輯模式', () => {
    it('顯示每局與每位選手的拖曳與刪除', () => {
      const w = mountTable({ editing: true })
      expect(w.findAll('[data-test="grip-row"]')).toHaveLength(2)
      expect(w.findAll('[data-test="remove-row"]')).toHaveLength(2)
      expect(w.findAll('[data-test="grip-player"]')).toHaveLength(3)
      expect(w.findAll('[data-test="remove-player"]')).toHaveLength(3)
    })

    it('分數格鎖定', () => {
      const w = mountTable({ editing: true })
      w.findAll('[data-test="cell"]').forEach((c) => expect(c.attributes('disabled')).toBeDefined())
    })

    it('刪除局與選手送出事件', async () => {
      const w = mountTable({ editing: true })
      await w.findAll('[data-test="remove-row"]')[1].trigger('click')
      await w.findAll('[data-test="remove-player"]')[2].trigger('click')
      expect(w.emitted('remove-row')).toEqual([[1]])
      expect(w.emitted('remove-player')).toEqual([[2]])
    })

    it('只剩 2 位選手時無法刪除選手', () => {
      const w = mountTable({
        editing: true,
        players: ['甲', '乙'],
        rows: [[1, -1]],
        totals: [1, -1],
      })
      w.findAll('[data-test="remove-player"]').forEach((b) =>
        expect(b.attributes('disabled')).toBeDefined(),
      )
    })
  })
})
