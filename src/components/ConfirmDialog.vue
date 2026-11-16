<script setup>
// 確認彈窗（搭配 useConfirm().askConfirm 使用）
import { useConfirm } from '../composables/useConfirm'

const { dialog, closeDialog } = useConfirm()
</script>

<template>
  <Transition name="fade">
    <div
      v-if="dialog"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
      role="dialog"
      aria-modal="true"
      @click.self="closeDialog(false)"
    >
      <div class="w-full max-w-xs rounded-2xl bg-white p-5 text-center shadow-xl dark:bg-slate-900">
        <h2 class="text-lg font-bold">{{ dialog.title }}</h2>
        <p v-if="dialog.message" class="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {{ dialog.message }}
        </p>
        <div class="mt-5 grid grid-cols-2 gap-2">
          <button
            class="rounded-xl bg-slate-100 py-3 text-sm font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            @click="closeDialog(false)"
          >
            取消
          </button>
          <button
            class="rounded-xl bg-rose-600 py-3 text-sm font-semibold text-white hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-400"
            @click="closeDialog(true)"
          >
            {{ dialog.confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>
