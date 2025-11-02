<template>
  <!-- 路由頁面會吃到全域 CSS 變數，不用各頁再判斷主題 -->
  <router-view />
</template>

<script setup>
// 這裡暫時不需要任何腳本
</script>

<style>
html, body, #app { height: 100%; }
body { margin: 0; background: var(--bg); color: var(--text); }
</style>
