<template>
  <section class="sys-page">
    <header class="sys-header">
      <div class="title">系統設定</div>
      <div class="spacer"></div>
      <button class="btn ghost" @click="goHome">回到主頁</button>
    </header>

    <div class="grid">
      <!-- 外觀 -->
      <div class="card">
        <div class="h3">外觀</div>
        <div class="row">
          <label class="label">主題</label>
          <div class="seg">
            <button :class="['segbtn', theme.mode==='auto' && 'active']"  @click="setMode('auto')">自動</button>
            <button :class="['segbtn', theme.mode==='light' && 'active']" @click="setMode('light')">亮色</button>
            <button :class="['segbtn', theme.mode==='dark' && 'active']"  @click="setMode('dark')">暗色</button>
          </div>
        </div>

        <div class="row">
          <label class="label">密度</label>
          <div class="seg">
            <button :class="['segbtn', theme.density==='comfortable' && 'active']" @click="setDensity('comfortable')">舒適</button>
            <button :class="['segbtn', theme.density==='compact' && 'active']"     @click="setDensity('compact')">緊湊</button>
          </div>
        </div>

        <div class="row">
          <label class="label">主色</label>
          <input type="color" class="input" v-model="accent" @change="setAccent(accent)" />
          <span class="muted">調整按鈕、重點色</span>
        </div>
      </div>

      <!-- 偏好 -->
      <div class="card">
        <div class="h3">一般偏好</div>

        <div class="row">
          <label class="label">語言</label>
          <select class="input" v-model="lang" @change="saveLocale">
            <option value="zh-TW">繁體中文</option>
            <option value="zh-CN">简体中文</option>
            <option value="en-US">English</option>
          </select>
        </div>

        <div class="row">
          <label class="label">時區</label>
          <input class="input w260" v-model="tz" @change="saveTz" placeholder="Asia/Taipei">
        </div>

        <div class="row">
          <label class="label">日期格式</label>
          <select class="input" v-model="dateFmt" @change="saveDateFmt">
            <option value="yyyy-MM-dd">yyyy-MM-dd</option>
            <option value="MM/dd/yyyy">MM/dd/yyyy</option>
            <option value="dd/MM/yyyy">dd/MM/yyyy</option>
          </select>
        </div>

        <div class="row">
          <label class="label">預設店面</label>
          <select class="input" v-model="defaultStore" @change="saveDefaultStore">
            <option value="">— 不指定 —</option>
            <option v-for="s in stores" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
      </div>

      <!-- 功能開關 -->
      <div class="card">
        <div class="h3">功能開關</div>

        <div class="row switch">
          <label>啟用 AI 自動建議訂單</label>
          <input type="checkbox" v-model="flags.aiSuggestion" @change="saveFlags">
        </div>

        <div class="row switch">
          <label>允許員工離峰時段自動送單</label>
          <input type="checkbox" v-model="flags.autoSubmitOffpeak" @change="saveFlags">
        </div>

        <div class="row switch">
          <label>中央廚房自動配車試行</label>
          <input type="checkbox" v-model="flags.kitchenAutoDispatch" @change="saveFlags">
        </div>

        <div class="muted small">* 以上為前端配置示意，未來可由後端統一控管。</div>
      </div>

      <!-- 通知 -->
      <div class="card">
        <div class="h3">通知設定</div>
        <div class="row switch">
          <label>Email 通知</label>
          <input type="checkbox" v-model="notify.email" @change="saveNotify">
        </div>
        <div class="row switch">
          <label>App 推播</label>
          <input type="checkbox" v-model="notify.push" @change="saveNotify">
        </div>
        <div class="row">
          <label class="label">通知 Email</label>
          <input class="input w260" v-model="notify.emailTo" @change="saveNotify" placeholder="boss@example.com">
        </div>
      </div>

      <!-- 匯入匯出 -->
      <div class="card">
        <div class="h3">資料管理</div>
        <div class="row">
          <button class="btn" @click="exportAll">匯出所有設定（JSON）</button>
          <label class="btn ghost file-btn">
            匯入設定
            <input type="file" accept="application/json" @change="importAll">
          </label>
        </div>
        <div class="muted small">* 僅前端設定（主題、偏好、功能開關等），作為備份或移轉。</div>
      </div>
    </div>

    <transition name="fade"><div v-if="toastMsg" class="toast">{{ toastMsg }}</div></transition>
  </section>
</template>

<script setup>
// 不用 Pinia 的全域 store
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from '@/store/theme'        // 你前面建立的零依賴版
import { useRoleStore } from '@/store/roleStore'// 你前面建立的零依賴版

const router = useRouter()
const { state: roleState } = useRoleStore?.() || { state:{ role:'Boss' } } // 安全 fallback
const theme = useTheme()

// 假資料：店面清單
const stores = ref(JSON.parse(localStorage.getItem('rep-stores') || '[]'))

// 綁 UI
const accent = ref(theme.accent.value ?? theme.accent) // 兼容 ref/值
const lang = ref(theme.locale.value ?? theme.locale)
const tz = ref(theme.tz.value ?? theme.tz)
const dateFmt = ref(theme.dateFmt.value ?? theme.dateFmt)
const defaultStore = ref(localStorage.getItem('sys.defaultStore') || '')

const flags = ref({
  aiSuggestion:       localStorage.getItem('flag.aiSuggestion') === '1',
  autoSubmitOffpeak:  localStorage.getItem('flag.autoSubmitOffpeak') === '1',
  kitchenAutoDispatch:localStorage.getItem('flag.kitchenAutoDispatch') === '1',
})
const notify = ref({
  email:   localStorage.getItem('notify.email') === '1',
  push:    localStorage.getItem('notify.push') === '1',
  emailTo: localStorage.getItem('notify.emailTo') || '',
})

/* ===== 導回主頁 ===== */
function goHome(){
  if (roleState.role === 'Employee') return router.push({ name:'emp-inventory' })
  if (roleState.role === 'Kitchen')  return router.push({ name:'kitchen-manage' })
  return router.push({ name:'boss-inventory' }) // 預設老闆
}

/* ====== 即選即存 ====== */
function setMode(m){ theme.setMode(m); tip() }
function setDensity(d){ theme.setDensity(d); tip() }
function setAccent(c){ theme.setAccent(c); tip() }

function saveLocale(){ theme.setLocale(lang.value); tip() }
function saveTz(){ theme.setTz(tz.value); tip() }
function saveDateFmt(){ theme.setDateFmt(dateFmt.value); tip() }
function saveDefaultStore(){ localStorage.setItem('sys.defaultStore', defaultStore.value); tip() }

function saveFlags(){
  localStorage.setItem('flag.aiSuggestion', flags.value.aiSuggestion ? '1':'0')
  localStorage.setItem('flag.autoSubmitOffpeak', flags.value.autoSubmitOffpeak ? '1':'0')
  localStorage.setItem('flag.kitchenAutoDispatch', flags.value.kitchenAutoDispatch ? '1':'0')
  tip()
}
function saveNotify(){
  localStorage.setItem('notify.email', notify.value.email ? '1':'0')
  localStorage.setItem('notify.push',  notify.value.push ? '1':'0')
  localStorage.setItem('notify.emailTo', notify.value.emailTo || '')
  tip()
}

/* ===== 匯入 / 匯出 ===== */
function exportAll(){
  const data = {
    theme:{
      mode: theme.mode.value ?? theme.mode,
      density: theme.density.value ?? theme.density,
      accent: theme.accent.value ?? theme.accent,
      locale: theme.locale.value ?? theme.locale,
      tz: theme.tz.value ?? theme.tz,
      dateFmt: theme.dateFmt.value ?? theme.dateFmt,
    },
    sys:{ defaultStore: defaultStore.value },
    flags: flags.value,
    notify: notify.value,
  }
  const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href=url; a.download='system-settings.json'; a.click()
  URL.revokeObjectURL(url)
  tip('已匯出設定')
}

function importAll(e){
  const f = e.target.files?.[0]; if(!f) return
  const reader = new FileReader()
  reader.onload = () => {
    try{
      const obj = JSON.parse(String(reader.result))
      if (obj.theme){
        setMode(obj.theme.mode || 'auto')
        setDensity(obj.theme.density || 'comfortable')
        setAccent(obj.theme.accent || '#2563eb')
        lang.value = obj.theme.locale || 'zh-TW'; saveLocale()
        tz.value = obj.theme.tz || 'Asia/Taipei'; saveTz()
        dateFmt.value = obj.theme.dateFmt || 'yyyy-MM-dd'; saveDateFmt()
      }
      if (obj.sys){ defaultStore.value = obj.sys.defaultStore || ''; saveDefaultStore() }
      if (obj.flags){ flags.value = obj.flags; saveFlags() }
      if (obj.notify){ notify.value = obj.notify; saveNotify() }
      tip('已匯入並自動儲存')
    }catch{ tip('匯入失敗：檔案格式錯誤') }
  }
  reader.readAsText(f,'utf-8')
}

/* ===== 提示 ===== */
const toastMsg = ref('')
function tip(msg='已自動儲存'){
  toastMsg.value = msg; setTimeout(()=>toastMsg.value='',1200)
}

onMounted(()=>{
  if(!stores.value.length){
    stores.value = [
      { id:'s1', name:'某某餐飲-總店' },
      { id:'s2', name:'某某餐飲-東門店' },
      { id:'s3', name:'某某餐飲-西門店' },
    ]
  }
})
</script>

<style scoped>
.sys-page{ padding:16px; background:var(--bg); min-height:100%; }
.sys-header{ display:flex; align-items:center; gap:8px; margin-bottom:10px }
.title{ font-size:20px; font-weight:800 }
.spacer{ flex:1 }

.grid{ display:grid; grid-template-columns:repeat(2, minmax(260px, 1fr)); gap:12px }
.h3{ font-weight:800; margin:0 0 10px }
.row{ display:flex; align-items:center; gap:10px; margin:8px 0; flex-wrap:wrap }
.label{ min-width:90px; color:var(--muted) }
.seg{ display:flex; gap:6px }
.segbtn{ border:1px solid var(--border); background:var(--card); border-radius:10px; padding:6px 10px; cursor:pointer }
.segbtn.active{ background:var(--accent-weak); border-color: color-mix(in oklab, var(--accent), #cde 40%) }
.switch{ justify-content:space-between }

.file-btn{ position:relative; overflow:hidden }
.file-btn input{ position:absolute; inset:0; opacity:0; cursor:pointer }
.w260{ width:260px }
.small{ font-size:12px }
.muted{ color:var(--muted) }

.toast{ position:fixed; right:16px; bottom:16px; background:#111827; color:#fff; padding:10px 12px; border-radius:10px; opacity:.95; z-index:70; }

@media (max-width:1024px){
  .grid{ grid-template-columns:1fr }
}
</style>
