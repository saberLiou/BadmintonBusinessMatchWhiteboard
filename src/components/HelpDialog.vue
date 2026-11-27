<script setup>
// 操作說明彈窗（右上角說明按鈕開啟；第一次使用時自動顯示）
defineProps({
  open: { type: Boolean, default: false },
})
const emit = defineEmits(['close'])

const items = [
  ['點分數格', '輸入該局分數'],
  ['點局號', '顯示刪除這局的按鈕'],
  ['點選手名稱', '修改名稱，並顯示移除選手的按鈕'],
  [
    '長按局號或選手名稱',
    '進入排序模式，拖曳 ⠿ 調整順序，按右上角 ✓ 完成（電腦可按右鍵，鍵盤可用方向鍵移動）',
  ],
  ['⚠', '這局的輸贏沒有相抵'],
  ['總分下方按鈕', '劃掉總分，例如已結清'],
]
</script>

<template>
  <Transition name="fade">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-title"
      data-test="help-dialog"
      @click.self="emit('close')"
    >
      <div class="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
        <h2 id="help-title" class="text-center text-lg font-bold">操作說明</h2>
        <dl class="mt-4 space-y-3 text-sm">
          <div v-for="[term, desc] in items" :key="term">
            <dt class="font-semibold">{{ term }}</dt>
            <dd class="text-slate-500 dark:text-slate-400">{{ desc }}</dd>
          </div>
        </dl>
        <button
          class="mt-5 w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-black dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          data-test="help-close"
          @click="emit('close')"
        >
          知道了
        </button>
      </div>
    </div>
  </Transition>
</template>
