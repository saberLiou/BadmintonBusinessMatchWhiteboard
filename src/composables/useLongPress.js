// 長按偵測（Pointer Events）：按住不動超過指定時間即觸發；移動、放開或取消則中止
export const LONG_PRESS_MS = 450
/** 移動超過此距離（px）視為捲動，取消長按 */
export const MOVE_TOLERANCE = 8

/**
 * @param {(...args: any[]) => void} onLongPress 長按成立時呼叫，參數為 down() 傳入的額外參數
 * @param {{ delay?: number }} [options]
 */
export function useLongPress(onLongPress, { delay = LONG_PRESS_MS } = {}) {
  let timer = null
  let origin = null
  let fired = false

  function down(e, ...args) {
    if (e.button !== undefined && e.button !== 0) return
    cancel()
    fired = false // 每次按下都重設，避免長按後沒有 click 時吃掉下一次點擊
    origin = { x: e.clientX, y: e.clientY }
    timer = setTimeout(() => {
      timer = null
      fired = true
      onLongPress(...args)
    }, delay)
  }

  function move(e) {
    if (!timer || !origin) return
    if (Math.hypot(e.clientX - origin.x, e.clientY - origin.y) > MOVE_TOLERANCE) cancel()
  }

  function cancel() {
    clearTimeout(timer)
    timer = null
  }

  /** 長按成立後，放開時的 click 不應再當作短按；回傳 true 表示這次 click 應忽略 */
  function consumeClick() {
    const f = fired
    fired = false
    return f
  }

  return { down, move, cancel, consumeClick }
}
