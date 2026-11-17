import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { useBoard, DEFAULT_TITLE, STORAGE_KEY } from '../src/composables/useBoard'

function memoryStorage(initial = {}) {
  const data = { ...initial }
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => (data[k] = String(v)),
    data,
  }
}

let storage
beforeEach(() => {
  storage = memoryStorage()
})

describe('useBoard 預設值', () => {
  it('4 位選手、1 局空白、預設標題', () => {
    const b = useBoard({ storage })
    expect(b.players.value).toEqual(['選手A', '選手B', '選手C', '選手D'])
    expect(b.rows.value).toEqual([[null, null, null, null]])
    expect(b.title.value).toBe(DEFAULT_TITLE)
    expect(b.totals.value).toEqual([0, 0, 0, 0])
  })

  it('標題清空時 displayTitle 使用預設標題', () => {
    const b = useBoard({ storage })
    b.title.value = '   '
    expect(b.displayTitle.value).toBe(DEFAULT_TITLE)
    b.title.value = ' 週三球局 '
    expect(b.displayTitle.value).toBe('週三球局')
  })
})

describe('分數', () => {
  it('setScore 更新總分', () => {
    const b = useBoard({ storage })
    b.setScore(0, 0, 2)
    b.setScore(0, 1, -2)
    expect(b.totals.value).toEqual([2, -2, 0, 0])
  })

  it('填到最後一局時自動新增一局', () => {
    const b = useBoard({ storage })
    b.setScore(0, 0, 1)
    expect(b.rows.value).toHaveLength(2)
    b.setScore(0, 1, 1) // 非最後一局，不再新增
    expect(b.rows.value).toHaveLength(2)
  })

  it('清空最後一局的格子不會新增一局', () => {
    const b = useBoard({ storage })
    b.setScore(0, 0, null)
    expect(b.rows.value).toHaveLength(1)
  })

  it('clearScores 只保留 1 局空白、保留選手', () => {
    const b = useBoard({ storage })
    b.setScore(0, 0, 1)
    b.setScore(1, 0, 1)
    b.renamePlayer(0, '小明')
    b.clearScores()
    expect(b.rows.value).toEqual([[null, null, null, null]])
    expect(b.players.value[0]).toBe('小明')
  })
})

describe('局', () => {
  it('addRow / removeRow', () => {
    const b = useBoard({ storage })
    b.addRow()
    b.setScore(1, 0, 2)
    b.removeRow(0)
    expect(b.rows.value[0][0]).toBe(2)
  })

  it('刪光後仍保留 1 局', () => {
    const b = useBoard({ storage })
    b.removeRow(0)
    expect(b.rows.value).toEqual([[null, null, null, null]])
  })

  it('moveRow 調整局的順序', () => {
    const b = useBoard({ storage })
    b.rows.value = [
      [1, null, null, null],
      [2, null, null, null],
      [-1, null, null, null],
    ]
    b.moveRow(0, 2)
    expect(b.rows.value.map((r) => r[0])).toEqual([2, -1, 1])
  })
})

describe('選手', () => {
  it('addPlayer 為每局補上空格', () => {
    const b = useBoard({ storage })
    b.addRow()
    b.addPlayer()
    expect(b.players.value).toHaveLength(5)
    expect(b.players.value[4]).toBe('選手E')
    b.rows.value.forEach((row) => expect(row).toHaveLength(5))
  })

  it('removePlayer 同時移除該選手的分數', () => {
    const b = useBoard({ storage })
    b.rows.value = [[1, 2, -1, -2]]
    expect(b.removePlayer(1)).toBe(true)
    expect(b.players.value).toEqual(['選手A', '選手C', '選手D'])
    expect(b.rows.value).toEqual([[1, -1, -2]])
  })

  it('至少保留 2 位選手', () => {
    const b = useBoard({ storage })
    b.removePlayer(0)
    b.removePlayer(0)
    expect(b.removePlayer(0)).toBe(false)
    expect(b.players.value).toHaveLength(2)
  })

  it('movePlayer 連同分數一起移動', () => {
    const b = useBoard({ storage })
    b.rows.value = [[1, 2, -1, -2]]
    b.movePlayer(3, 0)
    expect(b.players.value).toEqual(['選手D', '選手A', '選手B', '選手C'])
    expect(b.rows.value).toEqual([[-2, 1, 2, -1]])
    expect(b.totals.value).toEqual([-2, 1, 2, -1])
  })

  it('renamePlayer', () => {
    const b = useBoard({ storage })
    b.renamePlayer(2, 'Kevin')
    expect(b.players.value[2]).toBe('Kevin')
  })
})

describe('劃掉總分', () => {
  it('預設皆未劃掉，toggleStruck 切換', () => {
    const b = useBoard({ storage })
    expect(b.struck.value).toEqual([false, false, false, false])
    b.toggleStruck(1)
    expect(b.struck.value).toEqual([false, true, false, false])
    b.toggleStruck(1)
    expect(b.struck.value[1]).toBe(false)
  })

  it('隨選手新增、移除、移動', () => {
    const b = useBoard({ storage })
    b.toggleStruck(0)
    b.movePlayer(0, 2)
    expect(b.struck.value).toEqual([false, false, true, false])
    b.addPlayer()
    expect(b.struck.value).toHaveLength(5)
    b.removePlayer(2)
    expect(b.struck.value).toEqual([false, false, false, false])
  })

  it('clearScores 一併重設', () => {
    const b = useBoard({ storage })
    b.toggleStruck(3)
    b.clearScores()
    expect(b.struck.value).toEqual([false, false, false, false])
  })

  it('保存與載入，舊資料沒有 struck 時預設未劃掉', async () => {
    const b = useBoard({ storage })
    b.toggleStruck(2)
    await nextTick()
    expect(useBoard({ storage }).struck.value).toEqual([false, false, true, false])

    storage = memoryStorage({
      [STORAGE_KEY]: JSON.stringify({ players: ['甲', '乙'], rows: [[1, -1]] }),
    })
    expect(useBoard({ storage }).struck.value).toEqual([false, false])
  })
})

describe('保存', () => {
  it('變更後寫入 storage', async () => {
    const b = useBoard({ storage })
    b.title.value = '週三球局'
    b.setScore(0, 0, 1)
    await nextTick()
    const saved = JSON.parse(storage.data[STORAGE_KEY])
    expect(saved.title).toBe('週三球局')
    expect(saved.rows[0][0]).toBe(1)
  })

  it('從 storage 載入', () => {
    storage = memoryStorage({
      [STORAGE_KEY]: JSON.stringify({ title: 'T', players: ['甲', '乙'], rows: [[1, -1]] }),
    })
    const b = useBoard({ storage })
    expect(b.title.value).toBe('T')
    expect(b.players.value).toEqual(['甲', '乙'])
    expect(b.totals.value).toEqual([1, -1])
  })

  it('修正長度不一致的局', () => {
    storage = memoryStorage({
      [STORAGE_KEY]: JSON.stringify({ players: ['甲', '乙', '丙'], rows: [[1], [2, -2, 0, 9]] }),
    })
    const b = useBoard({ storage })
    expect(b.rows.value).toEqual([
      [1, null, null],
      [2, -2, 0],
    ])
  })

  it.each([
    ['損毀的 JSON', '{oops'],
    ['選手不足', JSON.stringify({ players: ['甲'], rows: [[1]] })],
    ['沒有局', JSON.stringify({ players: ['甲', '乙'], rows: [] })],
  ])('%s 時使用預設值', (_, raw) => {
    storage = memoryStorage({ [STORAGE_KEY]: raw })
    const b = useBoard({ storage })
    expect(b.players.value).toHaveLength(4)
    expect(b.rows.value).toHaveLength(1)
  })

  it('沒有 storage 也能運作', () => {
    const b = useBoard({ storage: null })
    b.setScore(0, 0, 1)
    expect(b.totals.value[0]).toBe(1)
  })
})
