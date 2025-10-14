<template>
  <section>
    <h2 class="section-title">店面設定</h2>
    <div class="card content">
      <p class="muted">店面基本設定集中於 <b>「系統設定」</b>，請點下方前往。</p>
      <button class="btn" @click="$router.push('/settings')">前往 系統設定</button>
    </div>
  </section>
</template>

<script setup></script>

<style scoped>
.section-title{font-size:20px;margin:6px 0 10px}
.card.content{background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:16px}
.btn{padding:.6rem 1rem;border:none;border-radius:8px;background:#2563eb;color:#fff}
.muted{color:#64748b}
</style>
