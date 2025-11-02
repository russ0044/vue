// src/store/perm.js
// 權限管理：店長（Manager）解鎖大部分功能；一般員工給最小權限
// EmpLayout 會呼叫 ensureLoaded() + can('xxx') 來控制鎖頭與導頁

import { reactive } from 'vue'
import * as ds from '@/store/datasource'
import { useAuth } from '@/store/auth'
import { useRoleStore } from '@/store/roleStore'

const KEYS = [
  'inventory.view',   // 門市庫存
  'inventory.edit',   // 庫存調整
  'orders.view',      // 訂單情況
  'orders.create',    // 建立/送單
  'reports.view',     // 檢視報表
  'delivery.view',    // 配送情況
]

const state = reactive({
  loaded: false,
  perms: Object.fromEntries(KEYS.map(k => [k, false])),
  isManager: false,
})

function asBoolMap(list) {
  const m = Object.fromEntries(KEYS.map(k => [k, false]))
  ;(list || []).forEach(k => { if (k in m) m[k] = true })
  return m
}

function ensureLoaded() {
  if (state.loaded) return

  const auth = useAuth()
  const roleStore = useRoleStore()
  // 若需要讀 datasource 也可在此擴充
  ds.read?.()

  const role = roleStore?.state?.role || 'Employee'
  const user = auth?.state?.user || {}

  // 店長判斷：
  // 1) roleGroupId === 'RG-MANAGER'
  // 2) 使用者姓名包含「店長」（方便假資料 demo）
  // 3) localStorage.emp-role = 'manager'（方便手動測）
  const roleGroupId = user?.roleGroupId || ''
  const nameHasManager = typeof user?.name === 'string' && /店長/.test(user.name)
  const localFlag = (localStorage.getItem('emp-role') || '').toLowerCase()

  const isManager =
    roleGroupId === 'RG-MANAGER' ||
    nameHasManager ||
    localFlag === 'manager'

  state.isManager = isManager

  if (role === 'Boss') {
    // 老闆全開
    state.perms = asBoolMap(KEYS)
  } else if (role === 'Kitchen') {
    state.perms = asBoolMap([
      'inventory.view','inventory.edit',
      'orders.view','orders.create',
      'reports.view',
    ])
  } else {
    // Employee
    if (isManager) {
      // 店長：解鎖大部分功能
      state.perms = asBoolMap([
        'inventory.view','inventory.edit',
        'orders.view','orders.create',
        'reports.view','delivery.view',
      ])
    } else {
      // 一般員工：最小權限
      state.perms = asBoolMap([
        'inventory.view',
        'orders.create',
      ])
    }
  }

  state.loaded = true
}

export function usePerm() {
  return {
    perms: state.perms,
    isManager: state.isManager,
    ensureLoaded,
  }
}
