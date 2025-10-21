import { reactive } from 'vue'

/** 單一來源的簡單持久化 */
function save(k, v){ localStorage.setItem(k, typeof v==='string'? v : JSON.stringify(v)) }
function read(k, def){
  const raw = localStorage.getItem(k)
  if (raw==null) return def
  try{ return JSON.parse(raw) }catch{ return raw }
}

/** 全域系統設定（前端層） */
const state = reactive({
  theme: read('sys-theme','light'),          // 'light' | 'dark' | 'auto'
  source: read('sys-source','local'),        // 'local' | 'firebase'
  language: read('sys-lang','zh-TW'),        // 語系
  timezone: read('sys-tz','Asia/Taipei'),    // 時區
  defaultStoreId: read('sys-default-store', ''), // 預設店面
  refreshSec: Number(read('sys-refresh', '0')),  // 自動更新秒數 0=關閉
  density: read('sys-density','comfortable'),    // 'comfortable' | 'compact'
  notifyEmail: !!read('sys-noti-email', false),
  notifyDesktop: !!read('sys-noti-desktop', false),
})

let mq = null
function applyTheme(){
  const root = document.documentElement
  let v = state.theme
  if (v==='auto'){
    const preferDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
    v = preferDark?'dark':'light'
  }
  root.setAttribute('data-theme', v)
}
function bindAuto(){ if(!window.matchMedia) return; unbindAuto(); mq = window.matchMedia('(prefers-color-scheme: dark)'); mq.addEventListener?.('change', ()=>{ if(state.theme==='auto') applyTheme() }) }
function unbindAuto(){ if(mq){ mq.removeEventListener?.('change',()=>{}); mq=null } }

function setTheme(v){ state.theme=v; save('sys-theme',v); v==='auto'?bindAuto():unbindAuto(); applyTheme() }
function setSource(v){ state.source=v; save('sys-source',v) }
function setLang(v){ state.language=v; save('sys-lang',v) }
function setTz(v){ state.timezone=v; save('sys-tz',v) }
function setDefaultStore(v){ state.defaultStoreId=v; save('sys-default-store',v) }
function setRefresh(v){ state.refreshSec=Number(v||0); save('sys-refresh', state.refreshSec) }
function setDensity(v){ state.density=v; save('sys-density',v) }
function setNotifyEmail(v){ state.notifyEmail=!!v; save('sys-noti-email', state.notifyEmail) }
function setNotifyDesktop(v){ state.notifyDesktop=!!v; save('sys-noti-desktop', state.notifyDesktop) }

function initSystem(){ if(state.theme==='auto') bindAuto(); applyTheme() }
function resetSystem(){
  ['sys-theme','sys-source','sys-lang','sys-tz','sys-default-store','sys-refresh','sys-density','sys-noti-email','sys-noti-desktop'].forEach(k=>localStorage.removeItem(k))
  state.theme='light'; state.source='local'; state.language='zh-TW'; state.timezone='Asia/Taipei'
  state.defaultStoreId=''; state.refreshSec=0; state.density='comfortable'; state.notifyEmail=false; state.notifyDesktop=false
  unbindAuto(); applyTheme()
}

export function useSystem(){
  return {
    state,
    setTheme,setSource,setLang,setTz,setDefaultStore,setRefresh,setDensity,setNotifyEmail,setNotifyDesktop,
    initSystem, resetSystem
  }
}
