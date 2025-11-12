// src/router/index.js 〈可直接覆蓋〉
import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuth } from '@/store/auth'
import { useRoleStore } from '@/store/roleStore'

// Layouts
import Boss from '@/view/Boss.vue'
const Employee = () => import('@/view/Employee.vue')
const Kitchen  = () => import('@/view/Kitchen.vue')

// Common
const LoginView      = () => import('@/view/LoginView.vue')
const RegisterView   = () => import('@/view/RegisterView.vue')
const SystemSettings = () => import('@/view/settings/SystemSettings.vue')
const NotFound       = () => import('@/view/NotFound.vue')

// Boss children
const BossInventory     = () => import('@/view/boss/BossInventory.vue')
const BossIngredients   = () => import('@/view/boss/BossIngredients.vue')
const BossRoleGroups    = () => import('@/view/boss/BossRoleGroups.vue')
const BossOrderSettings = () => import('@/view/boss/BossOrderSettings.vue') // boss/emp 共用
const BossThresholds    = () => import('@/view/boss/BossThresholds.vue')
const BossStores        = () => import('@/view/boss/BossStores.vue')
const BossInvite        = () => import('@/view/boss/BossInvite.vue')
const BossReports       = () => import('@/view/boss/BossReports.vue')

// Employee children
const EmpInventory = () => import('@/view/employee/EmpInventory.vue')
const EmpReports   = () => import('@/view/employee/EmpReports.vue')
const EmpDelivery  = () => import('@/view/employee/EmpDelivery.vue')

// Kitchen children
const KOrders   = () => import('@/view/kitchen/KitchenOrders.vue')
const KRecords  = () => import('@/view/kitchen/KitchenRecords.vue')
const KRequests = () => import('@/view/kitchen/KitchenRequests.vue')

// 角色首頁
function defaultRouteByRole(role) {
  if (role === 'Boss')     return { name: 'boss-inventory' }
  if (role === 'Employee') return { name: 'emp-inventory' }
  if (role === 'Kitchen')  return { name: 'kitchen-orders' }
  return { name: 'login' }
}

const routes = [
  { path: '/', redirect: { name: 'home' } },

  // 中立首頁（登入與角色在 beforeEach 轉導）
  { path: '/home', name: 'home', meta: { title: '首頁' } },

  // 不需登入
  { path: '/login',    name: 'login',    component: LoginView,    meta: { title: '登入',  guestOnly: true } },
  { path: '/register', name: 'register', component: RegisterView, meta: { title: '註冊', guestOnly: true } },

  // 老闆端
  {
    path: '/boss',
    component: Boss,
    meta: { requiresAuth: true, role: 'Boss' },
    children: [
      { path: '', redirect: { name: 'boss-inventory' } },
      { path: 'inventory',      name: 'boss-inventory',      component: BossInventory,     meta: { title: '檢視店面庫存', requiresPerm: 'inventory.view' } },
      { path: 'ingredients',    name: 'boss-ingredients',    component: BossIngredients,   meta: { title: '食材資料',     requiresPerm: 'ingredients.view' } },
      { path: 'rolegroups',     name: 'boss-rolegroups',     component: BossRoleGroups,    meta: { title: '群組權限',     requiresPerm: 'roles.manage' } },
      { path: 'stores',         name: 'boss-stores',         component: BossStores,        meta: { title: '店面管理',     requiresPerm: 'stores.manage' } },
      { path: 'thresholds',     name: 'boss-thresholds',     component: BossThresholds,    meta: { title: '警示門檻',     requiresPerm: 'thresholds.manage' } },
      {
        path: 'order-settings',
        name: 'boss-order-settings',
        component: BossOrderSettings,
        props: { role: 'boss' }, // 共用同檔，boss 模式
        meta: { title: '訂單設定', requiresPerm: 'orders.config' }
      },
      { path: 'invite',         name: 'boss-invite',         component: BossInvite,        meta: { title: '生成邀請碼',   requiresPerm: 'invite.generate' } },
      { path: 'reports',        name: 'boss-reports',        component: BossReports,       meta: { title: '報表中心',     requiresPerm: 'reports.view' } },
    ],
  },

  // 員工端
  {
    path: '/emp',
    component: Employee,
    meta: { requiresAuth: true, role: 'Employee' },
    children: [
      { path: '', redirect: { name: 'emp-inventory' } },
      { path: 'inventory', name: 'emp-inventory', component: EmpInventory, meta: { title: '門市庫存', requiresPerm: 'inventory.view', forceScopeStore: true } },

      // 共用 BossOrderSettings，以 role='emp' 呈現員工簡化版（鎖定自己的門市）
      {
        path: 'orders',
        name: 'emp-orders',
        component: BossOrderSettings,
        props: { role: 'emp' },
        meta: { title: '訂單情況', requiresPerm: 'orders.view', forceScopeStore: true }
      },

      { path: 'reports',  name: 'emp-reports',  component: EmpReports,  meta: { title: '檢視報表', requiresPerm: 'reports.view',  forceScopeStore: true } },
      { path: 'delivery', name: 'emp-delivery', component: EmpDelivery, meta: { title: '配送情況', requiresPerm: 'delivery.view', forceScopeStore: true } },
    ],
  },

  // 中央廚房端
  {
    path: '/kitchen',
    component: Kitchen,
    meta: { requiresAuth: true, role: 'Kitchen' },
    children: [
      { path: '', redirect: { name: 'kitchen-orders' } },
      { path: 'manage',   name: 'kitchen-manage',   component: KOrders,   meta: { title: '中央廚房總覽', requiresPerm: 'kitchen.manage' } },
      { path: 'orders',   name: 'kitchen-orders',   component: KOrders,   meta: { title: '訂單管理',     requiresPerm: 'kitchen.manage' } },
      { path: 'records',  name: 'kitchen-records',  component: KRecords,  meta: { title: '生產紀錄',     requiresPerm: 'kitchen.manage' } },
      { path: 'requests', name: 'kitchen-requests', component: KRequests, meta: { title: '原料申請',     requiresPerm: 'kitchen.manage' } },
    ],
  },

  // 系統設定（需登入）
  { path: '/settings', name: 'system-settings', component: SystemSettings, meta: { title: '系統設定', requiresAuth: true } },

  // 404
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFound, meta: { title: '頁面不存在' } },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

/** Global Guard（return-style，避免 next 重複呼叫） */
router.beforeEach((to) => {
  const { state } = useAuth()
  const { state: roleState } = useRoleStore()

  const authed    = !!state?.authed
  const userRole  = roleState?.role || null
  const userPerms = Array.isArray(roleState?.perms) ? roleState.perms : []

  const requiresAuth = to.matched.some(r => r.meta?.requiresAuth)
  const roleRec      = to.matched.find(r => r.meta?.role)
  const needRole     = roleRec?.meta?.role
  const permRec      = to.matched.find(r => r.meta?.requiresPerm)
  const needPerm     = permRec?.meta?.requiresPerm

  // 中立首頁：依角色導向
  if (to.name === 'home') {
    return authed ? defaultRouteByRole(userRole) : { name: 'login' }
  }

  // 已登入不允許進入 guestOnly
  if (to.meta?.guestOnly && authed) {
    const target = defaultRouteByRole(userRole)
    if (to.name === target.name) return true
    return target
  }

  // 需要登入
  if (requiresAuth && !authed) {
    if (to.name === 'login') return true
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // 角色不符 → 送回各自首頁
  if (needRole && userRole && userRole !== needRole) {
    const target = defaultRouteByRole(userRole)
    if (to.name === target.name) return true
    return target
  }

  // 權限不足 → 送回各自首頁
  if (needPerm && userPerms.length > 0 && !userPerms.includes(needPerm)) {
    const target = defaultRouteByRole(userRole)
    if (to.name === target.name) return true
    return target
  }

  return true
})

router.afterEach((to) => {
  const base = '餐易館'
  document.title = to.meta?.title ? `${to.meta.title}｜${base}` : base
})

export default router



// 開發提示：
// npm install
// npm i sortablejs
// npm install pinia
// npm install firebase@10
// npm run dev
