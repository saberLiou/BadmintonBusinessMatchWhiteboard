// 全域確認彈窗：askConfirm() 回傳 Promise<boolean>
import { ref } from 'vue'

const dialog = ref(null) // { title, message, confirmText, resolve }

function askConfirm({ title, message = '', confirmText = '確定' }) {
  // 若已有開啟中的彈窗，視為取消
  dialog.value?.resolve(false)
  return new Promise((resolve) => {
    dialog.value = { title, message, confirmText, resolve }
  })
}

function closeDialog(ok) {
  dialog.value?.resolve(ok)
  dialog.value = null
}

export function useConfirm() {
  return { dialog, askConfirm, closeDialog }
}
