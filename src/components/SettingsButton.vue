<template>
  <div class="wrap">
    <button class="icon" title="設定" @click="$emit('open-settings')">
      <!-- 矢量齒輪 -->
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" stroke-width="1.8"/>
        <path d="M19 12a7 7 0 0 0-.13-1.31l1.86-1.45-1.8-3.12-2.24.57a7 7 0 0 0-2.27-1.31L14 2h-4l-.42 2.38a7 7 0 0 0-2.27 1.31l-2.24-.57-1.8 3.12 1.86 1.45A7 7 0 0 0 5 12c0 .44.05.87.13 1.31l-1.86 1.45 1.8 3.12 2.24-.57c.67.57 1.43 1 2.27 1.31L10 22h4l.42-2.38c.84-.3 1.6-.74 2.27-1.31l2.24.57 1.8-3.12-1.86-1.45c.08-.44.13-.87.13-1.31Z" stroke="currentColor" stroke-width="1.2"/>
      </svg>
    </button>
    <button class="text" @click="$emit('logout')">登出</button>
  </div>
</template>

<script setup></script>

<style scoped>
.wrap{display:flex;align-items:center;gap:10px}
.icon{width:36px;height:36px;display:grid;place-items:center;border-radius:10px;border:1px solid #e2e8f0;background:#fff}
.icon:hover{box-shadow:0 4px 14px rgba(0,0,0,.08);transform:translateY(-1px)}
.text{border:none;background:transparent;color:#64748b}
.text:hover{color:#111827;text-decoration:underline}
</style>
