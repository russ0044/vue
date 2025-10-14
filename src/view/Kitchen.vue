<template>
  <div class="screen">
    <header class="topbar">
      <div class="title">中央廚房</div>
      <div class="actions">
        <button class="icon" @click="$router.push('/settings')">⚙</button>
        <button class="logout" @click="onLogout">登出</button>
      </div>
    </header>
    <main class="content"><router-view/></main>
  </div>
</template>

<script setup>
import { useAuth } from '@/store/auth'
const { logout } = useAuth()
function onLogout(){ logout(); location.href='/#/login' }
</script>

<style scoped>
.screen{max-width:1180px;margin:16px auto;background:#fff;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.06)}
.topbar{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid #e5e7eb}
.content{padding:16px}
.icon{border:1px solid #d1d5db;background:#fff;border-radius:50%;width:34px;height:34px}
.logout{background:#ef4444;color:#fff;border:none;border-radius:8px;padding:6px 12px}
</style>
