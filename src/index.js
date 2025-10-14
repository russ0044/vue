import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuth } from '@/store/auth'
import { useRoleStore } from '@/store/roleStore'

// 外殼
import Boss from '@/view/Boss.vue'
const Employee = () => import('@/view/Employee.vue')
const Kitchen  = () => import('@/view/Kitchen.vue')

// 通用頁
const LoginView    = () => import('@/view/LoginView.vue')
const RegisterView = () => import('@/view/RegisterView.vue')
const SystemSettings = () => import('@/view/settings/SystemSettings.vue')
const NotFound     = () => import('@/view/NotFound.vue')

// Boss 子頁
const BossInventory     = () => import('@/view/boss/BossInventory.vue')
const BossIngredients   = () => import('@/view/boss/BossIngredients.vue')
const BossRoleGroups    = () => import('@/view/boss/BossRoleGroups.vue')
const BossStoreSettings = () => import('@/view/boss/BossStoreSettings.vue')
const BossOrderSettings = () => import('@/view/boss/BossOrderSettings.vue')
const BossThresholds    = () => import('@/view/boss/BossThresholds.vue')
const BossStores        = () => import('@/view/boss/BossStores.vue')
const BossInvite        = () => import('@/view/boss/BossInvite.vue')
const BossReports       = () => import('@/view/boss/BossReports.vue')

// Employee 子頁
const EmpInventory = () => import('@/view/employee/EmpInventory.vue')
const EmpOrders    = () => import('@/view/employee/EmpOrders.vue')
const EmpReports   = () => import('@/view/employee/EmpReports.vue')
const EmpDelivery  = () => import('@/view/employee/EmpDelivery.vue')

// Kitchen 子頁
const KitchenDashboard = () => import('@/view/kitchen/KitchenDashboard.vue')

const routes = [
  { path:'/', redirect:'/login' },
  { path:'/login', name:'login', component:LoginView, meta:{ title:'登入' } },
  { path:'/register', name:'register', component:RegisterView, meta:{ title:'註冊' } },

  // 老闆端（左側功能欄一律在 Boss.vue 呈現）
  {
    path:'/boss', component:Boss, meta:{ requiresAuth:true, role:'Boss' },
    children:[
      { path:'', redirect:'/boss/inventory' },
      { path:'inventory',      name:'boss-inventory',      component:BossInventory,     meta:{ title:'檢視店面庫存', requiresAuth:true } },
      { path:'ingredients',    name:'boss-ingredients',    component:BossIngredients,   meta:{ title:'食材資料', requiresAuth:true } },
      {  path: '/boss/rolegroups',    name: 'boss-rolegroups',   component: BossRoleGroups,    meta: { title: '群組權限', requiresAuth: true }},

      { path:'stores',         name:'boss-stores',         component:BossStores,        meta:{ title:'店面管理', requiresAuth:true } },
      { path:'thresholds',     name:'boss-thresholds',     component:BossThresholds,    meta:{ title:'警示門檻', requiresAuth:true } },
      { path:'store-settings', name:'boss-store-settings', component:BossStoreSettings, meta:{ title:'店面設定', requiresAuth:true } },
      { path:'order-settings', name:'boss-order-settings', component:BossOrderSettings, meta:{ title:'訂單設定', requiresAuth:true } },
      { path:'invite',         name:'boss-invite',         component:BossInvite,        meta:{ title:'生成邀請碼', requiresAuth:true } },
      { path:'reports',        name:'boss-reports',        component:BossReports,       meta:{ title:'報表中心', requiresAuth:true } },
    ]
  },

  // 員工端
  {
    path:'/emp', component:Employee, meta:{ requiresAuth:true, role:'Employee' },
    children:[
      { path:'', redirect:'/emp/inventory' },
      { path:'inventory', name:'emp-inventory', component:EmpInventory, meta:{ title:'門市庫存', requiresAuth:true } },
      { path:'orders',    name:'emp-orders',    component:EmpOrders,    meta:{ title:'訂單情況', requiresAuth:true } },
      { path:'reports',   name:'emp-reports',   component:EmpReports,   meta:{ title:'檢視報表', requiresAuth:true } },
      { path:'delivery',  name:'emp-delivery',  component:EmpDelivery,  meta:{ title:'配送情況', requiresAuth:true } },
      { path:'inventory', name:'emp-inventory', component:EmpInventory,
  meta:{ title:'門市庫存', requiresAuth:true, role:'Employee', requiresPerm:'inventory.view', forceScopeStore:true } },
{ path:'orders', name:'emp-orders', component:EmpOrders,
  meta:{ title:'訂單情況', requiresAuth:true, role:'Employee', requiresPerm:'orders.view', forceScopeStore:true } },
{ path:'reports', name:'emp-reports', component:EmpReports,
  meta:{ title:'檢視報表', requiresAuth:true, role:'Employee', requiresPerm:'reports.view', forceScopeStore:true } },
{ path:'delivery', name:'emp-delivery', component:EmpDelivery,
  meta:{ title:'配送情況', requiresAuth:true, role:'Employee', requiresPerm:'delivery.view', forceScopeStore:true } },

    ]
  },

  // 中央廚房端
  {
    path:'/kitchen', component:Kitchen, meta:{ requiresAuth:true, role:'Kitchen' },
    children:[
      { path:'', redirect:'/kitchen/manage' },
      { path:'manage', name:'kitchen-manage', component:KitchenDashboard, meta:{ title:'中央廚房管理', requiresAuth:true } },
    ]
  },

  // 全域系統設定（三角色都可進，權限不同）
  { path:'/settings', name:'system-settings', component:SystemSettings, meta:{ title:'系統設定', requiresAuth:true } },

  { path:'/:pathMatch(.*)*', name:'not-found', component:NotFound, meta:{ title:'頁面不存在' } }
]

const router = createRouter({ history:createWebHashHistory(), routes, scrollBehavior:()=>({top:0}) })

// 守門：登入 + 角色檢查
router.beforeEach((to,_from,next)=>{
  const { state } = useAuth()
  const { state:roleState } = useRoleStore()
  const authed = !!state?.authed
  const needAuth = to.matched.some(r=>r.meta?.requiresAuth)
  const needRole = to.matched.find(r=>r.meta?.role)?.meta?.role

  if (needAuth && !authed) return next({ name:'login' })

  if (needRole && roleState.role !== needRole){
    if (roleState.role==='Boss') return next({ name:'boss-inventory' })
    if (roleState.role==='Employee') return next({ name:'emp-inventory' })
    if (roleState.role==='Kitchen') return next({ name:'kitchen-manage' })
    return next({ name:'login' })
  }

  if (authed && to.name==='login'){
    if (roleState.role==='Boss') return next({ name:'boss-inventory' })
    if (roleState.role==='Employee') return next({ name:'emp-inventory' })
    if (roleState.role==='Kitchen') return next({ name:'kitchen-manage' })
  }
  next()
  
})

router.afterEach(to=>{
  const base='餐易館'
  document.title = to.meta?.title ? `${to.meta.title}｜${base}` : base
})

export default router
//cd vue-main
//npm install
//npm i sortablejs
//npm run dev
