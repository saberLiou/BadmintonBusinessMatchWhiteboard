<script setup>
// 文字輸入框：輸入中右側顯示打勾按鈕，點擊即完成輸入（手機鍵盤不一定有「完成」鍵）
import { ref } from 'vue'
import { CheckIcon } from './icons'

defineOptions({ inheritAttrs: false })
defineProps({
  modelValue: { type: String, default: '' },
  /** 套用在外層容器上的樣式（版面配置用） */
  wrapperClass: { type: [String, Array, Object], default: '' },
  /** 套用在 input 上的樣式 */
  inputClass: { type: [String, Array, Object], default: '' },
})
const emit = defineEmits(['update:modelValue', 'done'])

const inputEl = ref(null)
const focused = ref(false)

defineExpose({ focus: () => inputEl.value?.focus() })

/**
 * Enter 結束輸入；但注音等輸入法選字時的 Enter 只是確認文字，不可結束。
 * Safari 會先送 compositionend 再送這個 Enter（isComposing 已是 false），只能靠 keyCode 229 判斷。
 */
function onEnter(e) {
  if (e.isComposing || e.keyCode === 229) return
  commit()
}

// 由 Enter 或完成鈕主動結束輸入時，done 事件的第二個參數為 true
let committing = false
function commit() {
  committing = true
  inputEl.value.blur()
}

function onBlur(e) {
  focused.value = false
  emit('done', e, committing)
  committing = false
}
</script>

<template>
  <div class="relative min-w-0" :class="wrapperClass">
    <input
      ref="inputEl"
      v-bind="$attrs"
      :value="modelValue"
      class="block"
      :class="[inputClass, focused && 'pr-8']"
      @input="emit('update:modelValue', $event.target.value)"
      @focus="focused = true"
      @blur="onBlur($event)"
      @keydown.enter="onEnter"
    />
    <!-- 按下時不讓輸入框失焦，才收得到 click -->
    <button
      v-show="focused"
      type="button"
      class="absolute inset-y-0 right-1 my-auto grid size-6 place-items-center rounded-md text-sky-600 hover:bg-sky-100 dark:text-sky-400 dark:hover:bg-sky-900/40"
      aria-label="完成輸入"
      title="完成"
      data-test="done-input"
      @pointerdown.prevent
      @mousedown.prevent
      @click="commit"
    >
      <CheckIcon class="size-4!" />
    </button>
  </div>
</template>
