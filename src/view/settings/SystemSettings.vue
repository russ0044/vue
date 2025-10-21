<template>
  <section class="page">
    <header class="main-head">
      <div class="h1">系統設定</div>
      <div class="spacer"></div>
      <button class="btn ghost small" @click="goHome">回到主頁</button>
    </header>

    <div class="two-col">
      <!-- 左側說明 -->
      <aside class="side">
        <div class="side-head">
          <div class="h2">本系統說明</div>
          <p class="muted small">此頁為前端層設定：可自由切換「資料來源」與「色彩主題」，並提供常用的語系、時區、預設店面、通知與外觀密度等。未來接 Firebase 僅需沿用相同狀態。</p>
        </div>
        <div class="side-list">
          <div class="side-item">
            <div class="grow">
              <div class="h2" style="font-size:16px">資料來源</div>
              <div class="muted small">Local（假資料）/ Firebase（真資料）</div>
            </div>
          </div>
          <div class="side-item">
            <div class="grow">
              <div class="h2" style="font-size:16px">色彩主題</div>
              <div class="muted small">明亮 / 暗色 / 自動（跟隨系統）</div>
            </div>
          </div>
          <div class="side-item">
            <div class="grow">
              <div class="h2" style="font-size:16px">偏好設定</div>
              <div class="muted small">語系、時區、預設店面、自動更新頻率、通知、密度</div>
            </div>
          </div>
        </div>
      </aside>

      <!-- 右側：設定 -->
      <main class="card">
        <!-- 資料來源 -->
        <div class="h2">資料來源</div>
        <div class="tr">
          <div class="seg">
            <button :class="['segbtn', sys.state.source==='local' && 'active']" @click="setSource('local')">Local（假資料）</button>
            <button :class="['segbtn', sys.state.source==='firebase' && 'active']" @click="setSource('firebase')">Firebase</button>
          </div>
        </div>

        <!-- 色彩主題 -->
        <div class="h2" style="margin-top:14px">色彩主題</div>
        <div class="tr">
          <div class="seg">
            <button :class="['segbtn', sys.state.theme==='light' && 'active']" @click="setTheme('light')">明亮</button>
            <button :class="['segbtn', sys.state.theme==='dark' && 'active']" @click="setTheme('dark')">暗色</button>
            <button :class="['segbtn', sys.state.theme==='auto' && 'active']" @click="setTheme('auto')">自動</button>
          </div>
        </div>

        <!-- 其他偏好 -->
        <div class="h2" style="margin-top:14px">偏好設定</div>

        <div class="tr">
          <div class="muted" style="min-width:120px">語系</div>
          <select v-model="lang" @change="applyLang">
            <option value="zh-TW">繁體中文（台灣）</option>
            <option value="zh-CN">简体中文（中国）</option>
            <option value="en-US">English（US）</option>
          </select>
        </div>

        <div class="tr">
          <div class="muted" style="min-width:120px">時區</div>
          <select v-model="tz" @change="applyTz">
            <option value="Asia/Taipei">Asia/Taipei</option>
            <option value="Asia/Shanghai">Asia/Shanghai</option>
            <option value="UTC">UTC</option>
          </select>
        </div>

        <div class="tr">
          <div class="muted" style="min-width:120px">預設店面</div>
          <select v-model="defaultStore" @change="applyDefaultStore">
            <option value="">（未指定）</option>
            <option v-for="s in stores" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>

        <div class="tr">
          <div class="muted" style="min-width:120px">自動更新</div>
          <select v-model.number="refresh" @change="applyRefresh">
            <option :value="0">關閉</option>
            <option :value="30">每 30 秒</option>
            <option :value="60">每 1 分鐘</option>
            <option :value="300">每 5 分鐘</option>
          </select>
        </div>

        <div class="tr">
          <div class="muted" style="min-width:120px">介面密度</div>
          <div class="seg">
            <button :class="['segbtn', sys.state.density==='comfortable' && 'active']" @click="setDensity('comfortable')">舒適</button>
            <button :class="['segbtn', sys.state.density==='compact' && 'active']" @click="setDensity('compact')">緊湊</button>
          </div>
        </div>

        <div class="tr">
          <div class="muted" style="min-width:120px">通知</div>
          <div class="tr">
            <div class="switch" :class="{on: sys.state.notifyEmail}" @click="toggleEmail"><i></i></div>
            <span class="muted small">Email</span>
          </div>
          <div class="tr">
            <div class="switch" :class="{on: sys.state.notifyDesktop}" @click="toggleDesktop"><i></i></div>
            <span class="muted small">桌面通知</span>
          </div>
        </div>

        <div class="tr" style="margin-top:16px">
          <button class="btn danger" @click="reset">重置所有設定</button>
          <div class="muted small">（會清除本機儲存的系統偏好）</div>
        </div>
      </main>
    </div>

    <transition name="fade"><div v-if="toast" class="toast">{{ toast }}</div></transition>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSystem } from '@/store/system'

const router = useRouter()
const sys = useSystem()
const toast = ref('')

/* 假資料的店面（若你已在 localStorage 有 stores，可自行改讀） */
const stores = computed(()=>{
  const raw = localStorage.getItem('boss-ingredients')
  try{
    const obj = raw? JSON.parse(raw) : null
    return obj?.stores?.length ? obj.stores : [
      { id:'s1', name:'某某餐飲-總店' },
      { id:'s2', name:'某某餐飲-東門店' },
      { id:'s3', name:'某某餐飲-西門店' },
    ]
  }catch{return [
    { id:'s1', name:'某某餐飲-總店' },
    { id:'s2', name:'某某餐飲-東門店' },
    { id:'s3', name:'某某餐飲-西門店' },
  ]}
})

/* 雙向模型（便於立即顯示） */
const lang = ref(sys.state.language)
const tz = ref(sys.state.timezone)
const defaultStore = ref(sys.state.defaultStoreId)
const refresh = ref(sys.state.refreshSec)

function goHome(){ router.push({ name:'boss-inventory' }) } // 可依角色導回不同首頁
function ping(m){ toast.value=m; setTimeout(()=>toast.value='',900) }

/* setters（自動儲存 + 即時生效） */
function setSource(v){ sys.setSource(v); ping('已切換資料來源') }
function setTheme(v){ sys.setTheme(v); ping('已切換色彩主題') }
function applyLang(){ sys.setLang(lang.value); ping('已更新語系') }
function applyTz(){ sys.setTz(tz.value); ping('已更新時區') }
function applyDefaultStore(){ sys.setDefaultStore(defaultStore.value); ping('已設定預設店面') }
function applyRefresh(){ sys.setRefresh(refresh.value); ping('已更新自動更新頻率') }
function setDensity(v){ sys.setDensity(v); ping('已更新介面密度') }
function toggleEmail(){ sys.setNotifyEmail(!sys.state.notifyEmail); ping('Email 通知已切換') }
function toggleDesktop(){ sys.setNotifyDesktop(!sys.state.notifyDesktop); ping('桌面通知已切換') }
function reset(){ if(confirm('確定重置所有系統設定？')){ sys.resetSystem(); lang.value=sys.state.language; tz.value=sys.state.timezone; defaultStore.value=sys.state.defaultStoreId; refresh.value=sys.state.refreshSec; ping('已重置') } }
</script>
