<template>
  <span class="badge">{{ label }}</span>
</template>

<script setup>
import { computed } from 'vue'
import { useRoleStore } from '@/store/roleStore'
import { read } from '@/store/datasource'

const { state } = useRoleStore()
const label = computed(()=>{
  if(state.role==='Boss') return '老闆'
  const d = read()
  return state.role==='Employee' ? (d?.settings?.roles?.emp || '員工')
       : state.role==='Kitchen'  ? (d?.settings?.roles?.kitchen || '中央廚房')
       : state.role
})
</script>

<style scoped>
.badge{display:inline-block;background:#eef2ff;color:#1e3a8a;border:1px solid #dbeafe;border-radius:999px;padding:.2rem .6rem;font-size:12px}
</style>
