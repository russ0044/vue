<template>
  <Teleport to="body">
    <transition name="fade">
      <div class="backdrop" @click.self="$emit('close')">
        <div class="panel">
          <header><slot name="title"></slot></header>
          <section class="content"><slot /></section>
          <footer class="actions"><slot name="actions"></slot></footer>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue'

// Esc 鍵關閉模態
function handleKey(e) {
  if (e.key === 'Escape') emitClose()
}
function emitClose() {
  const evt = new CustomEvent('close')
  window.dispatchEvent(evt)
}
onMounted(() => {
  window.addEventListener('keydown', handleKey)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKey)
})
</script>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: grid;
  place-items: center;
  padding: 16px;
  z-index: 50;
}
.panel {
  width: min(92vw, 560px);
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}
header {
  padding: 12px 14px;
  border-bottom: 1px solid #eef2f7;
  font-weight: 700;
}
.content {
  padding: 12px 14px;
}
.actions {
  padding: 10px 14px;
  border-top: 1px solid #eef2f7;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

/* 淡入淡出動畫 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
