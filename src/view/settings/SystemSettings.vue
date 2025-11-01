<template>
  <section class="card settings">
    <div class="header">
      <h2>系統設置</h2>
      <button class="btn ghost" title="返回主頁" @click="goHome">返回主頁</button>
    </div>

    <h3>主題</h3>
    <div class="row">
      <label><input type="radio" v-model="theme" value="light" /> 亮色</label>
      <label><input type="radio" v-model="theme" value="dark"  /> 暗色</label>
      <label><input type="radio" v-model="theme" value="auto"  /> 自動</label>
      <button class="btn" @click="applyTheme">套用</button>
    </div>

    <h3 class="mt">資料來源</h3>
    <div class="row">
      <label><input type="radio" v-model="mode" value="mock" /> 假資料（seedData）</label>
      <label><input type="radio" v-model="mode" value="firebase" /> Firebase（Firestore）</label>
    </div>

    <div v-if="mode==='firebase'" class="mt">
      <p class="muted">請貼上 Firebase Web Config（JSON）：</p>
      <textarea v-model="cfg" class="input" rows="8" placeholder='{"apiKey":"...","projectId":"..."}'></textarea>
      <div class="row mt">
        <button class="btn" @click="saveFirebase">儲存並切換</button>
      </div>
    </div>

    <div v-else class="mt">
      <button class="btn" @click="switchToMock">切換為假資料</button>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { setMode } from '@/store/datasource'

const storedTheme = localStorage.getItem('theme') || 'auto'
const theme = ref(storedTheme)
const mode = ref(localStorage.getItem('ds-mode') || 'mock')
const cfg = ref(localStorage.getItem('firebase-config') || '')

function applyTheme() {
  if (theme.value === 'auto') {
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
    document.documentElement.classList.toggle('theme-dark', prefersDark)
    localStorage.removeItem('theme')
  } else {
    const isDark = theme.value === 'dark'
    document.documentElement.classList.toggle('theme-dark', isDark)
    localStorage.setItem('theme', theme.value)
  }
  alert('主題已套用')
}

async function saveFirebase() {
  try {
    const obj = JSON.parse(cfg.value)
    localStorage.setItem('firebase-config', JSON.stringify(obj))
    await setMode('firebase')
    localStorage.setItem('ds-mode', 'firebase')
    mode.value = 'firebase'
    alert('已切換為 Firebase（請確認 Firestore 集合：stores、inventory、thresholds、settings）')
  } catch {
    alert('JSON 解析失敗，請檢查格式')
  }
}

async function switchToMock() {
  await setMode('mock')
  localStorage.setItem('ds-mode', 'mock')
  mode.value = 'mock'
  alert('已切換為假資料（seedData）')
}

/** 返回主頁（相容有/無 router） */
function goHome(){
  try {
    // 若專案有 router，可直接使用
    // eslint-disable-next-line no-eval
    const r = (eval('window.__app_router__')) || null
    if (r?.push) { r.push('/'); return }
  } catch {}
  if (location.hash !== '#/') location.hash = '#/'
}
</script>

<style scoped>
.settings { padding: 16px; max-width: 840px; margin: 16px auto; }
.header { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:8px; }
.row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.input { width: 100%; padding: 8px 10px; border: 1px solid var(--border); border-radius: 8px; background: var(--card-bg); color: var(--text); }
.btn { padding: 8px 12px; background:#2563eb; color:#fff; border:none; border-radius:8px; cursor:pointer; }
.btn.ghost { background:#fff; color:#334155; border:1px solid #e6eaf2; }
.mt { margin-top: 12px; }
.muted { color: var(--muted); }
</style>
