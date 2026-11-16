// 全域提示訊息
import { ref } from 'vue'

const toast = ref('')
let timer

function showToast(msg, duration = 2000) {
  toast.value = msg
  clearTimeout(timer)
  timer = setTimeout(() => (toast.value = ''), duration)
}

export function useToast() {
  return { toast, showToast }
}
