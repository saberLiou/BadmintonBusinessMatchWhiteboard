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

function onBlur() {
  focused.value = false
  emit('done')
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
      @blur="onBlur"
      @keydown.enter="inputEl.blur()"
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
      @click="inputEl.blur()"
    >
      <CheckIcon class="size-4!" />
    </button>
  </div>
</template>
