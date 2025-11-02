<template>
  <span class="badge">{{ roleLabel }}</span>
</template>

<script setup>
import { computed } from 'vue'
import { useRoleStore } from '@/store/roleStore'
import { read } from '@/store/datasource'

/*
  🧩 功能：
  顯示目前登入者的角色標籤。
  - Boss → 老闆
  - Employee → 員工（或從設定讀取）
  - Kitchen → 中央廚房（或從設定讀取）
*/
const { state } = useRoleStore()

const roleLabel = computed(() => {
  const d = read() || {}
  const role = state.role

  if (role === 'Boss') return '老闆'
  if (role === 'Employee') {
    return d?.settings?.roles?.emp || '員工'
  }
  if (role === 'Kitchen') {
    return d?.settings?.roles?.kitchen || '中央廚房'
  }
  // fallback：若角色不在預設範圍內，直接回傳原字串
  return role || '未知角色'
})
</script>

<style scoped>
.badge {
  display: inline-block;
  background: #eef2ff; /* 淺藍底 */
  color: #1e3a8a;       /* 深藍字 */
  border: 1px solid #dbeafe;
  border-radius: 999px;
  padding: 0.25rem 0.65rem;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
  user-select: none;
  font-family: 'Noto Sans TC', 'Microsoft JhengHei', sans-serif;
}

/* 顏色模式補充（若系統有 dark mode 可覆寫） */
:global(.dark) .badge {
  background: #1e3a8a;
  color: #e0e7ff;
  border-color: #3b82f6;
}
</style>
