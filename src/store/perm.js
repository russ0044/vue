// 權限管理（改為：以 seedData 的 roleGroups.permissions 為單一真相）
// - 仍支援 demo 後門：localStorage.emp-role = 'manager'、使用者名稱含「店長」
// - 提供 API：usePerm().ensureLoaded()/reset()/reload()/can()、perms、isManager

import { reactive } from 'vue'
import * as ds from '@/store/datasource'
import { useAuth } from '@/store/auth'
import { useRoleStore } from '@/store/roleStore'
import seed from '@/seed/seedData'   // 讀取 seed 以取得 roleGroups 定義

/** 所有 UI/路由會用到的權限鍵（請與各頁 meta.requiresPerm 對齊） */
const KEYS = [
  'inventory.view',
  'inventory.edit',
  'orders.view',
  'orders.create',
  'reports.view',
  'delivery.view',
  // 其它老闆/後台可用（若你的 UI 有使用就保留）
  'ingredients.view',
  'roles.manage',
  'stores.manage',
  'thresholds.manage',
  'orders.config',
  'invite.generate',
  'kitchen.manage',
]

/** 產生布林 map */
function asBoolMap(list) {
  const m = Object.fromEntries(KEYS.map(k => [k, false]))
  ;(list || []).forEach(k => { if (k in m) m[k] = true })
  return m
}

const state = reactive({
  loaded: false,
  perms: asBoolMap([]),
  isManager: false,
})

/** 從 seed 做一張 roleGroupId -> permissions 的對照表 */
function buildRoleMapFromSeed() {
  const s = seed()
  const map = {}
  ;(s.roleGroups || []).forEach(g => {
    // 允許 seed 裡用 permissions（新欄位），也兼容舊的 perms
    const arr = g.permissions || g.perms || []
    map[String(g.id).toLowerCase()] = Array.isArray(arr) ? arr.slice() : []
  })
  return map
}

const ROLE_PERM_MAP = buildRoleMapFromSeed()

/** 切帳號/登出時清掉快取 */
function reset() {
  state.loaded = false
  state.perms = asBoolMap([])
  state.isManager = false
}

/** 強制重算（登入成功後可主動呼叫） */
function reload() {
  reset()
  ensureLoaded()
}

/** 主要入口：依目前登入者計算權限（讀 seed + 當前登入資訊） */
function ensureLoaded() {
  if (state.loaded) return

  const auth = useAuth()
  const roleStore = useRoleStore()

  // 若外部先初始化資料源，這裡防呆，不影響運作
  try { ds.read?.() } catch {}

  const appRole = (roleStore?.state?.role || '').trim() || 'Employee' // Boss / Employee / Kitchen
  const user    = auth?.state?.user || {}
  const roleGroupId = String(user?.roleGroupId || '').toLowerCase()

  // Demo 後門
  const nameHasManager = typeof user?.name === 'string' && /店長/.test(user.name)
  const localFlag = (localStorage.getItem('emp-role') || '').toLowerCase()

  // 店長判定（顯示用）
  const isManager =
    roleGroupId === 'rg-store-manager' ||
    nameHasManager ||
    localFlag === 'manager'
  state.isManager = isManager

  // 1) 先嘗試用 seed 的 roleGroupId → permissions
  let permList = ROLE_PERM_MAP[roleGroupId] || []

  // 2) 若沒有 roleGroupId（或對不到），則用 appRole 給一組 fallback
  if (!permList.length) {
    if (appRole === 'Boss') {
      permList = KEYS.slice() // 老闆全開
    } else if (appRole === 'Kitchen') {
      permList = [
        'kitchen.manage',
        'inventory.view', 'inventory.edit',
        'orders.view', 'orders.create',
        'reports.view',
      ]
    } else {
      // 一般 Employee：店長/員工再細分
      if (isManager) {
        permList = [
          'inventory.view', 'inventory.edit',
          'orders.view', 'orders.create',
          'reports.view', 'delivery.view',
        ]
      } else {
        permList = [
          'inventory.view',
          'orders.create',
        ]
      }
    }
  }

  state.perms = asBoolMap(permList)
  state.loaded = true
}

/** 檢查單一權限（未載入會自動 ensure） */
function can(k) {
  if (!state.loaded) ensureLoaded()
  return !!state.perms[k]
}

export function usePerm() {
  return {
    perms: state.perms,
    isManager: state.isManager,
    ensureLoaded,
    reset,
    reload,
    can,
  }
}
