// 深色模式（初始值由 index.html 的內嵌腳本先行套用，避免閃爍）
import { ref, watch } from 'vue'

export const THEME_KEY = 'bbmw-theme'

export function useTheme() {
  const isDark = ref(document.documentElement.classList.contains('dark'))

  watch(isDark, (v) => {
    document.documentElement.classList.toggle('dark', v)
    try {
      localStorage.setItem(THEME_KEY, v ? 'dark' : 'light')
    } catch {
      // 無法保存時僅影響下次開啟的預設主題
    }
  })

  function toggleTheme() {
    isDark.value = !isDark.value
  }

  return { isDark, toggleTheme }
}
