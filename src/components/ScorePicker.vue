<script setup>
// 分數選擇面板（手機由下方滑出，桌機置中）
import { SCORE_OPTIONS, fmt } from '../utils/score'

defineProps({
  open: { type: Boolean, default: false },
  round: { type: Number, default: 0 },
  playerName: { type: String, default: '' },
})
const emit = defineEmits(['select', 'close'])
</script>

<template>
  <Transition name="fade">
    <div
      v-if="open"
      class="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center"
      @click.self="emit('close')"
    >
      <div
        class="w-full max-w-sm rounded-t-2xl bg-white p-4 shadow-xl sm:rounded-2xl dark:bg-slate-900"
      >
        <p class="mb-3 text-center text-sm text-slate-500">
          第 {{ round }} 局 ·
          <span class="font-semibold text-slate-800 dark:text-slate-200">{{ playerName }}</span>
        </p>
        <div class="grid grid-cols-4 gap-2">
          <button
            v-for="opt in SCORE_OPTIONS"
            :key="opt"
            class="rounded-xl py-4 text-2xl font-extrabold tabular-nums transition active:scale-95"
            :class="
              opt > 0
                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-900/70'
                : 'bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:hover:bg-rose-900/70'
            "
            @click="emit('select', opt)"
          >
            {{ fmt(opt) }}
          </button>
        </div>
        <div class="mt-2 grid grid-cols-2 gap-2">
          <button
            class="rounded-xl bg-slate-100 py-3 text-sm font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            @click="emit('select', null)"
          >
            清空此格
          </button>
          <button
            class="rounded-xl py-3 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            @click="emit('close')"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>
