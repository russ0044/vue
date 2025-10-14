<template>
  <div v-if="error" class="card" style="padding:16px">
    <h3>發生錯誤</h3>
    <p class="muted">{{ error }}</p>
    <button class="btn" @click="error=''">我知道了</button>
  </div>
  <slot v-else />
</template>
<script setup>
import { ref, onErrorCaptured } from 'vue'
const error = ref('')
onErrorCaptured((err)=>{ error.value = err?.message || String(err); return false })
</script>
<style scoped>.muted{color:var(--muted)}</style>
