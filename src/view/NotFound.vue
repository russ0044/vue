<template>
  <div class="wrap">
    <div class="card">
      <h1>頁面不存在</h1>
      <p>請檢查網址或回登入頁</p>
      <button class="btn" @click="$router.push('/login')">返回登入</button>
    </div>
  </div>
</template>

<script setup></script>

<style scoped>
.wrap{min-height:100vh;display:grid;place-items:center;background:#f8fafc}
.card{background:#fff;padding:40px;border-radius:16px;box-shadow:0 8px 24px rgba(0,0,0,.08);text-align:center}
.btn{padding:.6rem 1rem;border:none;border-radius:8px;background:#2563eb;color:#fff}
</style>
