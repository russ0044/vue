<template>
  <div class="dashboard-container">
    <div class="dashboard-box">
      <!-- 標題 -->
      <div class="top-bar">
        <div class="title-box">設定</div>
      </div>

      <div class="scrollbar">
        <!-- 字體大小 -->
        <div class="section-card">
          <div class="section-title">字體大小</div>
          <div class="font-row">
            <button
              v-for="s in fontScales"
              :key="s.value"
              class="pill"
              :class="{ active: settings.fontScale === s.value }"
              @click="update('fontScale', s.value)"
            >
              {{ s.label }}
            </button>
          </div>
        </div>

        <!-- 主題 -->
        <div class="section-card">
          <div class="section-title">主題</div>
          <div class="font-row">
            <button
              v-for="m in themes"
              :key="m.value"
              class="pill"
              :class="{ active: settings.theme === m.value }"
              @click="update('theme', m.value)"
            >
              {{ m.label }}
            </button>
          </div>
          <p class="hint">「跟隨系統」會依你的作業系統明暗自動切換。</p>
        </div>

        <!-- 其他小功能 -->
        <div class="section-card">
          <div class="section-title">其他</div>

          <label class="row-toggle">
            <input type="checkbox" v-model="settings.compact" @change="applyAndSave" />
            <span>緊湊模式（列表間距更小）</span>
          </label>

          <label class="row-toggle">
            <input type="checkbox" v-model="settings.reduceMotion" @change="applyAndSave" />
            <span>減少動畫</span>
          </label>

          <label class="row-toggle">
            <input type="checkbox" v-model="settings.showAlertDot" @change="applyAndSave" />
            <span>顯示通知紅點（Demo）</span>
          </label>
        </div>

        <!-- 操作 -->
        <div class="actions">
          <button class="btn" @click="reset">還原預設</button>
          <button class="btn primary" @click="applyAndSave">儲存</button>
        </div>

        <div class="note">
          小提示：若要讓深淺色主題影響到所有頁面背景/卡片，建議把各頁
          <code>.dashboard-container</code>、<code>.dashboard-box</code> 的背景色改為使用
          CSS 變數：<code>var(--app-bg)</code>、<code>var(--card-bg)</code>。
        </div>
      </div>

      <!-- 左下返回 -->
      <button class="back-button" @click="goBack">◀</button>
    </div>
  </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const goBack = () => router.back()

const STORAGE_KEY = 'appSettings'

const defaults = {
  fontScale: 100,        // 100% = 基準
  theme: 'system',       // light | dark | system
  compact: false,
  reduceMotion: false,
  showAlertDot: true,
}

const settings = reactive(structuredClone(defaults))

const fontScales = [
  { label: '小', value: 90 },
  { label: '中', value: 100 },
  { label: '大', value: 115 },
  { label: '特大', value: 130 },
]

const themes = [
  { label: '淺色', value: 'light' },
  { label: '深色', value: 'dark' },
  { label: '跟隨系統', value: 'system' },
]

const update = (k, v) => {
  settings[k] = v
  apply()
  save()
}

const applyAndSave = () => {
  apply()
  save()
}

const save = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

const load = () => {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return
  try {
    const obj = JSON.parse(raw)
    Object.assign(settings, defaults, obj)
  } catch {}
}

const apply = () => {
  // 字體大小：作用到整站
  document.documentElement.style.setProperty('--font-scale', `${settings.fontScale}%`)
  document.documentElement.style.fontSize = `calc(16px * var(--font-scale) / 100)`

  // 緊湊模式 / 減少動畫：加 class
  document.documentElement.classList.toggle('compact', !!settings.compact)
  document.documentElement.classList.toggle('reduced-motion', !!settings.reduceMotion)

  // 主題：light / dark / system
  const root = document.documentElement
  root.classList.remove('theme-light', 'theme-dark')
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
  const finalTheme =
    settings.theme === 'system' ? (prefersDark ? 'dark' : 'light') : settings.theme
  root.classList.add(finalTheme === 'dark' ? 'theme-dark' : 'theme-light')

  // Demo：通知紅點（你可以在 Dashboard 讀這個設定來決定是否顯示驚嘆號）
  root.dataset.alertDot = settings.showAlertDot ? 'on' : 'off'
}

const reset = () => {
  Object.assign(settings, structuredClone(defaults))
  applyAndSave()
}

onMounted(() => {
  load()
  apply()
})
</script>

<style scoped>
/* Layout */
.dashboard-container {
  background: var(--app-bg, #dceeff);
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.dashboard-box {
  background: var(--card-bg, #fff);
  width: 320px;
  height: 90vh;
  padding: 20px;
  position: relative;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, .1);
}

/* Title */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.title-box {
  background: #fff;
  padding: 12px 16px;
  font-size: 18px;
  font-weight: 700;
  border: 2px solid #000;
}

/* Scroll */
.scrollbar {
  flex: 1;
  overflow-y: auto;
  padding-right: 6px;
}

/* Cards */
.section-card {
  background: #fff;
  border: 1px solid #000;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 12px;
}
.section-title {
  font-weight: 700;
  margin-bottom: 10px;
}

/* Controls */
.font-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.pill {
  border: 1px solid #000;
  background: #fff;
  border-radius: 999px;
  padding: 6px 12px;
  cursor: pointer;
}
.pill.active {
  background: #f3f3f3;
  font-weight: 700;
}
.row-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
}

.hint {
  color: #666;
  font-size: 12px;
  margin-top: 6px;
}

/* Actions */
.actions {
  display: flex;
  gap: 12px;
  margin: 12px 0 6px;
}
.btn {
  flex: 1;
  border: 1px solid #000;
  background: #fff;
  border-radius: 999px;
  padding: 10px 0;
  cursor: pointer;
}
.btn.primary {
  background: #f5f5f5;
  font-weight: 700;
}

.note {
  color: #666;
  font-size: 12px;
  line-height: 1.4;
}

/* Back */
.back-button {
  position: absolute;
  bottom: 12px;
  left: 12px;
  background: none;
  border: 0;
  font-size: 20px;
  cursor: pointer;
}
</style>
