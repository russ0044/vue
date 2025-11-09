<template>
  <div class="wrap">
    <div class="card">
      <h1>頁面不存在</h1>
      <p class="muted">請檢查網址是否正確，或返回登入頁</p>
      <button class="btn" @click="$router.push('/login')">返回登入</button>
    </div>
  </div>
</template>

<script setup></script>

<style scoped>
.wrap {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: var(--bg, #f8fafc);
  color: var(--text, #1e293b);
  font-family: "Noto Sans TC", "Microsoft JhengHei", sans-serif;
}

.card {
  background: var(--card-bg, #fff);
  border: 1px solid var(--border, #e2e8f0);
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  text-align: center;
}

h1 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: var(--text, #111827);
}

.muted {
  color: var(--muted, #64748b);
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}

.btn {
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 8px;
  background: var(--primary, #2563eb);
  color: #fff;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.25s, transform 0.15s;
}

.btn:hover {
  background: #1d4ed8;
  transform: translateY(-1px);
}
</style>
