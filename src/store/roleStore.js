// src/store/roleStore.js
import { reactive } from 'vue'

const state = reactive({
  // 一開始不要預設是 Boss，否則每次 reload 都被判定為老闆
  role: null, // 初始值為 null，代表尚未設定角色
  perms: [],  // 可選：若有權限系統，可一併保存
  ready: false // 旗標：資料是否已載入完畢（例如從 localStorage）
})

export function useRoleStore() {
  // 設定角色（登入成功後呼叫）
  function setRole(r) {
    state.role = r
    localStorage.setItem('role', r) // 同步存到 localStorage，下次重整能還原
  }

  // 可選：設定權限（若你的系統有）
  function setPerms(p) {
    state.perms = p || []
    localStorage.setItem('perms', JSON.stringify(state.perms))
  }

  // 重整後還原角色資料
  function hydrateFromLocal() {
    const r = localStorage.getItem('role')
    const p = localStorage.getItem('perms')
    state.role = r || null
    state.perms = p ? JSON.parse(p) : []
    state.ready = true
  }

  // 登出時清除
  function clearRole() {
    state.role = null
    state.perms = []
    state.ready = false
    localStorage.removeItem('role')
    localStorage.removeItem('perms')
  }

  return { state, setRole, setPerms, hydrateFromLocal, clearRole }
}
