<template>
  <section class="settings-shell">
    <!-- 頂部列 -->
    <header class="settings-header card-row">
      <div class="left">
        <h2 class="title">系統設置</h2>
        <div class="subtitle">介面外觀、資料來源、通知偏好</div>
      </div>

      <div class="spacer"></div>

      <button class="btn ghost" title="返回主頁" @click="goHome">返回主頁</button>
    </header>

    <!-- 主內容卡片 -->
    <main class="settings-body card-block">
      <!-- 外觀主題 ------------------------------------------------>
      <section class="block">
        <div class="block-head">
          <h3 class="block-title">外觀與主題</h3>
          <div class="block-desc">切換淺色 / 深色 / 自動（跟隨系統）</div>
        </div>

        <div class="row">
          <label class="radio-line">
            <input type="radio" v-model="theme" value="light" />
            <span>亮色模式</span>
          </label>
          <label class="radio-line">
            <input type="radio" v-model="theme" value="dark" />
            <span>暗色模式</span>
          </label>
          <label class="radio-line">
            <input type="radio" v-model="theme" value="auto" />
            <span>自動</span>
          </label>

          <button class="btn" @click="applyTheme">套用</button>
        </div>
      </section>

      <hr class="divider" />

      <!-- 顯示偏好 ------------------------------------------------>
      <section class="block">
        <div class="block-head">
          <h3 class="block-title">介面偏好</h3>
          <div class="block-desc">僅保存在本機，不影響其他使用者</div>
        </div>

        <div class="pref-grid">
          <!-- 語言 -->
          <div class="pref-item">
            <div class="pref-label">顯示語言</div>
            <div class="pref-desc muted">僅影響此瀏覽器</div>
            <select class="input" v-model="lang">
              <option value="zh-TW">繁體中文</option>
              <option value="en-US">English (美式英文)</option>
            </select>
          </div>

          <!-- 介面密度 -->
          <div class="pref-item">
            <div class="pref-label">畫面密度</div>
            <div class="pref-desc muted">控制列表 / 表格的間距</div>
            <select class="input" v-model="density">
              <option value="normal">一般</option>
              <option value="compact">緊湊</option>
            </select>
          </div>

          <!-- 通知設定 -->
          <div class="pref-item">
            <div class="pref-label">桌面通知</div>
            <div class="pref-desc muted">例如「低庫存」、「訂單已出貨」</div>

            <label class="toggle-line">
              <input type="checkbox" v-model="notifyStock" />
              <span>庫存警報</span>
            </label>

            <label class="toggle-line">
              <input type="checkbox" v-model="notifyDelivery" />
              <span>配送進度</span>
            </label>
          </div>
        </div>

        <div class="row mt">
          <button class="btn ghost small" @click="savePrefs">儲存顯示偏好</button>
        </div>
      </section>

      <hr class="divider" />

      <!-- 資料來源 ------------------------------------------------>
      <section class="block">
        <div class="block-head">
          <h3 class="block-title">資料來源</h3>
          <div class="block-desc">
            假資料（seedData）僅存在本機記憶體；Firebase 模式則讀取 Firestore。
          </div>
        </div>

        <div class="row wrap">
          <label class="radio-line">
            <input type="radio" v-model="mode" value="mock" />
            <span>假資料（seedData）</span>
          </label>

          <label class="radio-line">
            <input type="radio" v-model="mode" value="firebase" />
            <span>Firebase（Firestore）</span>
          </label>
        </div>

        <!-- Firebase 設定 -->
        <div v-if="mode==='firebase'" class="mt">
          <p class="muted small">
            請貼上 Firebase Web Config（JSON 內容）：
          </p>

          <textarea
            v-model="cfg"
            class="input codebox"
            rows="8"
            placeholder='{"apiKey":"...","projectId":"..."}'
          ></textarea>

          <div class="row mt">
            <button class="btn" @click="saveFirebase">儲存並切換</button>
          </div>
        </div>

        <!-- 假資料模式 -->
        <div v-else class="mt">
          <button class="btn" @click="switchToMock">切換為假資料</button>
        </div>
      </section>
    </main>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRoleStore } from '@/store/roleStore'
import { setMode } from '@/store/datasource'
import * as ds from '@/store/datasource'

/* -------------------------------------------------
   狀態：主題 / 資料來源 / 偏好
------------------------------------------------- */
const storedTheme = localStorage.getItem('theme') || 'auto'
const theme = ref(storedTheme)

// 初始化資料來源模式：優先 datasource.getMode() → localStorage → 'mock'
function initialDsMode() {
  try {
    const fromModule = ds?.getMode?.()
    if (fromModule === 'mock' || fromModule === 'firebase') return fromModule
  } catch {}
  try {
    const fromLs = localStorage.getItem('settings.datasource.mode')
    if (fromLs === 'mock' || fromLs === 'firebase') return fromLs
  } catch {}
  return 'mock'
}
const mode = ref(initialDsMode())

const cfg = ref(localStorage.getItem('firebase-config') || '')

const lang = ref(localStorage.getItem('pref-lang') || 'zh-TW')
const density = ref(localStorage.getItem('pref-density') || 'normal')
const notifyStock = ref(localStorage.getItem('pref-notify-stock') === '1')
const notifyDelivery = ref(localStorage.getItem('pref-notify-delivery') === '1')

const router = useRouter()
const { state: roleState } = useRoleStore()

onMounted(() => {
  // 若外部切換了 mode，也讓本頁跟著反映（例如在別頁切換）
  window.addEventListener('storage', e => {
    if (e.key === 'settings.datasource.mode') {
      const v = e.newValue
      if (v === 'mock' || v === 'firebase') mode.value = v
    }
    if (e.key === 'theme') {
      theme.value = e.newValue || 'auto'
    }
  })
})

/* -------------------------------------------------
   主題套用（全域一致）
------------------------------------------------- */
function applyTheme() {
  // 優先使用全域方法（若 main.js 註冊了）
  if (window.setTheme) {
    window.setTheme(theme.value)
  } else {
    const shouldDark =
      theme.value === 'dark' ||
      (theme.value === 'auto' &&
        window.matchMedia?.('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', !!shouldDark)
    localStorage.setItem('theme', theme.value)
  }
  alert(`已套用主題模式：${theme.value === 'auto' ? '自動' : theme.value}`)
}

/* -------------------------------------------------
   顯示偏好儲存
------------------------------------------------- */
function savePrefs() {
  localStorage.setItem('pref-lang', lang.value)
  localStorage.setItem('pref-density', density.value)
  localStorage.setItem('pref-notify-stock', notifyStock.value ? '1' : '0')
  localStorage.setItem('pref-notify-delivery', notifyDelivery.value ? '1' : '0')
  alert('顯示偏好已儲存')
}

/* -------------------------------------------------
   共用：嘗試初始化資料源（若模組有提供）
------------------------------------------------- */
async function tryInitDatasource(nextMode) {
  try {
    if (ds?.setMode && typeof ds.setMode === 'function') {
      ds.setMode(nextMode)
    }
    if (ds?.init && typeof ds.init === 'function') {
      await ds.init({ mode: nextMode })
    } else if (ds?.ensureInit && typeof ds.ensureInit === 'function') {
      await ds.ensureInit({ mode: nextMode })
    } else if (ds?.boot && typeof ds.boot === 'function') {
      await ds.boot({ mode: nextMode })
    }
  } catch {
    // 失敗也不阻斷頁面
  }
}

/* -------------------------------------------------
   資料來源切換
------------------------------------------------- */
async function saveFirebase() {
  try {
    const obj = JSON.parse(cfg.value)
    if (!obj || typeof obj !== 'object') throw new Error('bad json')
    // 最少驗證
    if (!obj.apiKey || !obj.projectId) {
      alert('請至少提供 apiKey 與 projectId')
      return
    }
    localStorage.setItem('firebase-config', JSON.stringify(obj))
    // 若 datasource 提供設定 config 的介面，嘗試寫入
    try { ds?.setFirebaseConfig?.(obj) } catch {}

    // 統一使用設定鍵：settings.datasource.mode
    localStorage.setItem('settings.datasource.mode', 'firebase')

    // 嘗試初始化並切換
    await setMode('firebase')
    await tryInitDatasource('firebase')

    mode.value = 'firebase'
    alert('已切換為 Firebase 模式。部分資料需重新讀取，如未自動更新請手動重新整理。')
  } catch {
    alert('JSON 解析失敗，請檢查格式')
  }
}

async function switchToMock() {
  // 先更新 localStorage 觸發跨分頁同步
  localStorage.setItem('settings.datasource.mode', 'mock')

  await setMode('mock')
  await tryInitDatasource('mock')

  mode.value = 'mock'
  alert('已切換為假資料模式（seedData）。')
}

/* -------------------------------------------------
   返回主頁（依角色導向）
------------------------------------------------- */
function goHome() {
  const role = roleState.role
  if (role === 'Boss') return router.replace({ name: 'boss-inventory' })
  if (role === 'Employee') return router.replace({ name: 'emp-inventory' })
  if (role === 'Kitchen') return router.replace({ name: 'kitchen-orders' })
  router.replace({ name: 'login' })
}
</script>

<style scoped>
/* 版面骨架 */
.settings-shell {
  max-width: 960px;
  margin: 16px auto 40px;
  padding: 0 16px 40px;
  color: var(--text, #1e293b);
  font-family:'Noto Sans TC','Microsoft JhengHei',sans-serif;
}

/* 頂部列卡片 */
.settings-header {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 12px;

  padding: 16px;
  margin-bottom: 16px;

  border: 1px solid var(--border, #e5e7eb);
  border-radius: 12px;
  background: var(--card-bg, #ffffff);
  box-shadow: 0 12px 32px rgba(0,0,0,.06);
}

.left {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
  min-width: 0;
}
.title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text, #1e293b);
  line-height: 1.3;
}
.subtitle {
  font-size: 13px;
  color: var(--muted, #64748b);
  margin-top: 4px;
  line-height: 1.4;
}
.spacer {
  flex: 1 1 auto;
  min-width: 0;
}

/* 主內容卡片 */
.settings-body {
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 12px;
  background: var(--card-bg, #ffffff);
  box-shadow: 0 16px 40px rgba(0,0,0,.04);
  padding: 16px;
}

/* 區塊 */
.block + .block {
  margin-top: 24px;
}
.block-head {
  margin-bottom: 12px;
}
.block-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text, #1e293b);
  line-height: 1.3;
}
.block-desc {
  font-size: 13px;
  color: var(--muted, #64748b);
  line-height: 1.4;
}

/* radio / row */
.row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
.row.wrap {
  flex-wrap: wrap;
}
.mt {
  margin-top: 12px;
}

/* 偏好設定三欄 */
.pref-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit,minmax(220px,1fr));
  gap: 16px;
  margin-top: 8px;
}

.pref-item {
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 10px;
  background: var(--card-bg, #fff);
  box-shadow: 0 6px 16px rgba(0,0,0,.03);
  padding: 12px;
}
.pref-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text, #1e293b);
  line-height: 1.3;
}
.pref-desc {
  font-size: 12px;
  line-height: 1.4;
  margin-bottom: 8px;
}

.radio-line,
.toggle-line {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  line-height: 1.3;
  color: var(--text, #1e293b);
  cursor: pointer;
  user-select: none;
}
.small {
  font-size: 12px;
}
.muted {
  color: var(--muted, #64748b);
}

/* Divider */
.divider {
  border: none;
  border-top: 1px solid var(--border, #e5e7eb);
  margin: 24px 0;
}

/* 表單元件 */
.input {
  width: 100%;
  padding: 8px 10px;
  font-size: 14px;
  line-height: 1.4;
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 8px;
  background: var(--card-bg, #fff);
  color: var(--text, #1e293b);
}
.codebox {
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  min-height: 140px;
  white-space: pre;
  resize: vertical;
}

/* 按鈕 */
.btn {
  padding: 8px 12px;
  background:#2563eb;
  color:#fff;
  border:none;
  border-radius:8px;
  cursor:pointer;
  font-size:14px;
  line-height:1.2;
  font-weight:500;
  box-shadow:0 4px 12px rgba(37,99,235,.3);
}
.btn.small {
  font-size:13px;
  padding:6px 10px;
}
.btn.ghost {
  background:#fff;
  color:#334155;
  border:1px solid #e6eaf2;
  box-shadow:0 2px 4px rgba(0,0,0,.04);
}
.btn:hover {
  filter:brightness(.98);
}

/* RWD */
@media (max-width:600px){
  .settings-header{
    flex-wrap:wrap;
  }
  .spacer{
    flex-basis:100%;
    height:0;
  }
  .settings-header .btn{
    margin-left:auto;
  }
}
</style>
