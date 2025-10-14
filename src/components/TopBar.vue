<template>
  <header class="card" style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px">
    <div style="display:flex;gap:10px;align-items:center">
      <div style="width:38px;height:38px;border-radius:50%;background:#e5e7eb"></div>
      <div>
        <div style="font-weight:700">某某餐飲店</div>
        <div style="font-size:.85rem;color:var(--muted)">ID: 123456789</div>
      </div>
    </div>
    <div style="display:flex;gap:10px;align-items:center">
      <RoleBadge />
      <button class="btn ghost" title="設定" @click="$emit('open-settings')" aria-label="設定">
        ⚙️
      </button>
      <button class="btn" @click="$emit('toggle-menu')" aria-label="開合選單">☰</button>
    </div>
  </header>
</template>
<script setup>
import RoleBadge from './RoleBadge.vue'
</script>
