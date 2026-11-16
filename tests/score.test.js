import { describe, it, expect } from 'vitest'
import {
  makeRows,
  rowSum,
  rowFilled,
  columnTotals,
  fmt,
  scoreClass,
  moveItem,
} from '../src/utils/score'

describe('score utils', () => {
  it('makeRows 建立指定大小的空白表', () => {
    expect(makeRows(2, 3)).toEqual([
      [null, null, null],
      [null, null, null],
    ])
  })

  it('makeRows 每列是獨立的陣列', () => {
    const rows = makeRows(2, 2)
    rows[0][0] = 1
    expect(rows[1][0]).toBeNull()
  })

  it('rowSum 忽略空格', () => {
    expect(rowSum([1, null, -2, 2])).toBe(1)
    expect(rowSum([null, null])).toBe(0)
  })

  it('rowFilled 判斷是否有任何分數', () => {
    expect(rowFilled([null, null])).toBe(false)
    expect(rowFilled([null, -1])).toBe(true)
  })

  it('columnTotals 計算各選手總分', () => {
    expect(
      columnTotals(
        [
          [1, -1, null],
          [2, null, -2],
        ],
        3,
      ),
    ).toEqual([3, -1, -2])
  })

  it('fmt 正數加上 + 號', () => {
    expect(fmt(2)).toBe('+2')
    expect(fmt(-1)).toBe('-1')
    expect(fmt(0)).toBe('0')
    expect(fmt(null)).toBe('')
  })

  it('scoreClass 依正負給顏色', () => {
    expect(scoreClass(1)).toContain('emerald')
    expect(scoreClass(-1)).toContain('rose')
    expect(scoreClass(null)).toContain('slate-300')
    expect(scoreClass(0)).toBe('text-slate-500')
  })

  it('moveItem 往前與往後移動', () => {
    const a = ['a', 'b', 'c', 'd']
    moveItem(a, 0, 2)
    expect(a).toEqual(['b', 'c', 'a', 'd'])
    moveItem(a, 3, 0)
    expect(a).toEqual(['d', 'b', 'c', 'a'])
  })
})
