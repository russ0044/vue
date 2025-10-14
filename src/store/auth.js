// src/store/auth.js
import { reactive } from 'vue'

const DEFAULT = { authed:false, user:null, role:null, token:null }

function readAuth(){
  const raw = localStorage.getItem('auth')
  if (!raw) return { ...DEFAULT }
  try {
    const obj = JSON.parse(raw)         // 正常 JSON
    return { ...DEFAULT, ...obj }       // 合併保底欄位
  } catch (err) {
    console.warn('[auth] localStorage 損毀，已重置', err)
    localStorage.removeItem('auth')     // 清掉壞資料
    return { ...DEFAULT }
  }
}

const state = reactive(readAuth())

function persist(clear=false){
  if (clear) localStorage.removeItem('auth')
  else localStorage.setItem('auth', JSON.stringify(state))
}

export function useAuth(){
  function login(payload){              // payload: { user, role, token ... }
    Object.assign(state, { authed:true, ...payload })
    persist()
  }
  function logout(){
    Object.assign(state, DEFAULT)
    persist(true)                       // 移除 auth
  }
  return { state, login, logout }
}
