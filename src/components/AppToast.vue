<script setup>
// 提示訊息（搭配 useToast().showToast 使用）
import { useToast } from '../composables/useToast'

const { toast } = useToast()
</script>

<template>
  <Transition
    enter-from-class="opacity-0 translate-y-2"
    leave-to-class="opacity-0"
    enter-active-class="transition duration-200"
    leave-active-class="transition duration-200"
  >
    <div
      v-if="toast"
      class="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-900 px-4 py-2 text-sm text-white shadow-lg dark:bg-white dark:text-slate-900"
      role="status"
    >
      {{ toast }}
    </div>
  </Transition>
</template>
