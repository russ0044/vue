<!-- src/view/boss/bossRoleGroups.vue -->
<template>
  <section
    class="page"
    :class="[{ 'is-collapsed': collapsed && !isMobile }]"
    :style="{
      '--side-w': sideWidth,
      '--sb-alpha': (1 - sidebarOpacity).toString()
    }"
  >
    <!-- 手機抽屜遮罩 -->
    <transition name="fade">
      <div
        v-if="isMobile && drawerOpen"
        class="backdrop"
        @click="closeDrawer()"
      />
    </transition>

    <!-- ===== 左側：清單（可收合 / 透明度） ===== -->
    <aside
      class="side"
      :class="[{ collapsed: collapsed && !isMobile, open: drawerOpen && isMobile }]"
    >
      <div class="side-header">
        <button
          class="icon-btn only-mobile"
          aria-label="關閉側欄"
          title="關閉"
          @click="closeDrawer()"
        >✕</button>

        <div class="avatar">🏪</div>
        <div class="store-meta" v-show="!collapsed || isMobile">
          <div class="store-name">{{ store.name }}</div>
          <div class="muted">ID：{{ store.id }}</div>
        </div>

        <div class="spacer" />

        <!-- 收合/展開 -->
        <button
          class="icon-btn only-desktop"
          :title="collapsed? '展開側欄' : '收合側欄'"
          @click="toggleCollapse()"
        >≡</button>

        <!-- 側欄設定 -->
        <button class="icon-btn" title="店家設定" @click="toast('尚未實作：店家設定')">⚙</button>
      </div>

      <div class="seg" v-show="!collapsed || isMobile">
        <button :class="['seg-btn', activeTab==='roles' && 'active']" @click="switchTab('roles')">使用者權限群組</button>
        <button :class="['seg-btn', activeTab==='stores' && 'active']" @click="switchTab('stores')">門市群組</button>
      </div>

      <!-- 工具列 -->
      <div class="side-tools" v-show="!collapsed || isMobile">
        <input v-if="activeTab==='roles'" v-model="qRole" class="input" placeholder="搜尋群組…" />
        <input v-else v-model="qStore" class="input" placeholder="搜尋門市…" />
        <button v-if="activeTab==='roles' && canManage" class="btn primary" @click="createRole()">＋ 新增群組</button>
        <button v-if="activeTab==='stores' && canManage" class="btn" @click="duplicateStoreSetup()">複製設定</button>
      </div>

      <!-- 清單：支援拖曳排序（角色群組） -->
      <div class="side-list" v-if="activeTab==='roles'" v-show="!collapsed || isMobile">
        <div ref="roleListRef">
          <div
            v-for="g in filteredRoleGroups"
            :key="g.id"
            class="item"
            :class="{selected: g.id===selectedRoleId}"
            :data-id="g.id"
            @click="selectRole(g.id)"
          >
            <div class="item-title">
              <span class="grip">⠿</span>{{ g.name }}
            </div>
            <div class="muted small">{{ renderPerms(g.permissions) }}</div>
            <div v-if="canManage" class="row-actions">
              <button class="link small" @click.stop="renameRole(g)">重新命名</button>
              <button class="link danger small" @click.stop="removeRole(g)">刪除</button>
            </div>
          </div>
        </div>
        <p v-if="filteredRoleGroups.length===0" class="muted center">沒有符合的群組</p>
      </div>

      <!-- 清單：門市 -->
      <div class="side-list" v-else v-show="!collapsed || isMobile">
        <div>
          <div
            v-for="s in filteredStores"
            :key="s.id"
            class="item"
            :class="{selected: s.id===selectedStoreId}"
            :data-id="s.id"
            @click="selectStore(s.id)"
          >
            <div class="item-title">{{ s.name }}</div>
            <div class="muted small">
              已套用：{{ (state.storeGroups[s.id] || []).map(id => roleNameById(id)).join('、') || '—' }}
            </div>
          </div>
        </div>
        <p v-if="filteredStores.length===0" class="muted center">沒有符合的門市</p>
      </div>

      <!-- 側欄底部：透明度設定 -->
      <div class="side-footer" v-show="!collapsed || isMobile">
        <label for="opacityRange" class="small muted">側欄透明度</label>
        <input
          id="opacityRange"
          type="range"
          min="0"
          max="0.6"
          step="0.05"
          v-model.number="sidebarOpacity"
        />
      </div>
    </aside>

    <!-- 浮動開啟鈕（桌機收合時） -->
    <button
      v-show="!isMobile && collapsed"
      class="floating-opener only-desktop"
      title="展開側欄"
      @click="toggleCollapse(false)"
    >☰</button>

    <!-- ===== 右側：細節（依左側點選顯示） ===== -->
    <main class="main">
      <div class="topbar">
        <!-- 手機：開啟抽屜 -->
        <button class="icon-btn only-mobile" aria-label="開啟側欄" title="選單" @click="openDrawer()">☰</button>
        <div class="topbar-title">{{ activeTab==='roles' ? '權限群組' : '門市群組' }}</div>
        <div class="spacer" />
        <!-- 桌機：快捷收合 -->
        <button class="icon-btn only-desktop" :title="collapsed? '展開側欄' : '收合側欄'" @click="toggleCollapse()">
          {{ collapsed ? '⮞' : '⮜' }}
        </button>
      </div>

      <!-- 角色群組編輯器 -->
      <div v-if="activeTab==='roles'" class="card">
        <div class="card-title">
          <div>{{ editorTitle }}</div>
          <div class="chips" v-if="!canManage"><span class="chip warn">唯讀</span></div>
        </div>

        <div v-if="selectedRole" class="editor">
          <!-- 群組名稱 -->
          <div class="row">
            <label class="label">群組名稱</label>
            <input class="input grow" :disabled="!canManage" v-model.trim="editing.name" placeholder="請輸入群組名稱" />
            <button v-if="canManage && editing.name" class="icon-btn" title="清除" @click="editing.name=''">✕</button>
          </div>

          <!-- 權限搜尋與控制 -->
          <div class="perm-toolbar">
            <input v-model="permQuery" class="input grow" placeholder="搜尋權限…" />
            <label class="chk">
              <input type="checkbox" v-model="permCheckedOnly" />
              只顯示已勾選
            </label>
            <button class="btn" @click="selectAllFiltered" :disabled="!canManage">依目前篩選全選</button>
            <button class="btn ghost" @click="clearAllFiltered" :disabled="!canManage">清空</button>
          </div>

          <!-- 權限列表（分類 + 摺疊 + 搜尋結果） -->
          <div v-for="(items, cat) in filteredPermByCategory" :key="cat" class="perm-section" v-show="items.length">
            <div class="perm-section-title" @click="toggleCat(cat)">
              <span>{{ cat }}</span>
              <span class="muted small">（{{ items.length }}）</span>
              <span class="chev">{{ openCats[cat] ? '▾' : '▸' }}</span>
            </div>
            <transition name="fade">
              <div v-show="openCats[cat]" class="perm-grid">
                <label v-for="p in items" :key="p" class="perm">
                  <input type="checkbox" :value="p" :disabled="!canManage" v-model="editing.permissions" />
                  <span>{{ p }}</span>
                </label>
              </div>
            </transition>
          </div>

          <div class="actions">
            <button v-if="canManage" class="btn primary" @click="saveRole()" :disabled="!canSave">儲存</button>
            <button class="btn ghost" @click="cancelEdit()">取消</button>
          </div>
        </div>

        <div v-else class="placeholder">
          <p class="muted">請先在左側選擇一個「權限群組」</p>
        </div>
      </div>

      <!-- 門市群組配置 -->
      <div v-else class="card">
        <div class="card-title">
          <div>門市群組</div>
          <button class="icon-btn" @click="toast('面板設定尚未實作')">⚙</button>
        </div>

        <div v-if="currentStore" class="store-panel">
          <div class="store-title">{{ currentStore.name }}</div>

          <div class="subcard">
            <div class="sub-title">常用範本</div>
            <div class="stack">
              <button class="btn pill" @click="quickApply(['店長權限'])">店長權限</button>
              <button class="btn pill" @click="quickApply(['店長權限','庫存權限'])">店長＋庫存</button>
              <button class="btn pill" @click="quickApply(['工讀生權限'])">工讀生權限</button>
            </div>
          </div>

          <div class="subcard">
            <div class="sub-title">已套用群組（可拖曳排序）</div>
            <div class="applied" ref="appliedRef">
              <div
                v-for="id in (state.storeGroups[selectedStoreId]||[])"
                :key="id"
                class="tag"
                :data-id="id"
              >
                <span class="grip">⠿</span>{{ roleNameById(id) }}
                <button v-if="canManage" class="x" @click="pullRole(id)">✕</button>
              </div>
              <p v-if="!(state.storeGroups[selectedStoreId]||[]).length" class="muted">尚未套用任何群組</p>
            </div>
          </div>

          <div class="dock">
            <div class="dock-title">可用群組</div>
            <div class="dock-list">
              <button v-for="g in filteredForAssign" :key="g.id" class="dock-btn" @click="toggleAssign(g)">
                {{ g.name }}
              </button>
            </div>
          </div>

          <div class="actions">
            <button v-if="canManage" class="btn primary" @click="persistAll()">儲存變更</button>
            <button class="btn ghost" @click="revertAll()">還原</button>
          </div>
        </div>

        <div v-else class="placeholder">
          <p class="muted">請先在左側選擇一個「門市」</p>
        </div>
      </div>
    </main>

    <transition name="fade"><div v-if="toastMsg" class="toast">{{ toastMsg }}</div></transition>
  </section>
</template>

<script setup>
import { reactive, ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import Sortable from 'sortablejs' // npm i sortablejs
defineOptions({ name: 'BossRoleGroups' })

/** ===== 目前登入者：boss/admin 可編輯 ===== */
const currentUser = reactive({ id: 'U1', role: 'boss' })
const canManage = computed(() => ['boss', 'admin'].includes(currentUser.role))

/** ===== RWD 與側欄狀態 ===== */
const drawerOpen   = ref(false)                   // 手機抽屜
const collapsed    = ref(loadBool('brg-collapsed', false))  // 桌機是否收合
const sidebarOpacity = ref(loadNumber('brg-opacity', 0))    // 0~0.6
const isMobile = ref(window.matchMedia('(max-width: 1024px)').matches)
const sideWidth = computed(() => (isMobile.value ? '280px' : (collapsed.value ? '0px' : '280px')))

function openDrawer(){ drawerOpen.value = true }
function closeDrawer(){ drawerOpen.value = false }
function toggleCollapse(v){
  collapsed.value = typeof v === 'boolean' ? v : !collapsed.value
  saveBool('brg-collapsed', collapsed.value)
}

function handleResize(){
  isMobile.value = window.matchMedia('(max-width: 1024px)').matches
  if (!isMobile.value) drawerOpen.value = false
}

window.addEventListener('resize', handleResize)
onBeforeUnmount(() => window.removeEventListener('resize', handleResize))

watch(sidebarOpacity, v => saveNumber('brg-opacity', v))

/** ===== 權限分類（移除退款，改為庫存系統用） ===== */
const PERM_CATEGORIES = {
  '基本庫存作業': [
    '查看儀表板','盤點作業','入庫（進貨/退料）','出庫（銷售/領料）',
    '庫存調整','調撥（門市↔中央廚房）','報廢/毀損處理'
  ],
  '商品與資料維護': [
    '建立/編輯商品','批號/效期管理','安全庫存與警示',
    '供應商管理','庫存地點/倉別管理','價格/成本管理'
  ],
  '採購 / 補貨流程': [
    '採購單與到貨驗收','補貨建議與審核','門市要貨單審核'
  ],
  '報表與匯出': [
    '查看報表','匯出報表（CSV/Excel/PDF）'
  ],
  '帳號與系統': [
    '管理使用者','角色與權限管理','門市與組織管理','通知/警示設定','系統設定'
  ],
}
const ALL_PERMS_FLAT = Object.values(PERM_CATEGORIES).flat()

/** ===== 假資料（之後可改串 API / Firebase） ===== */
const store = reactive({ name: '某某餐飲店', id: '123456789' })
const state = reactive(loadState())

/** ===== UI 狀態 ===== */
const activeTab = ref('stores') // 'roles' | 'stores'
const qRole = ref(''), qStore = ref(''), qAssign = ref('')
const selectedRoleId = ref(null)
const selectedStoreId = ref(null)
const editing = reactive({ id:null, name:'', permissions:[] })
const editorTitle = computed(() => (editing.id ? '編輯權限群組' : '新增權限群組'))
const canSave = computed(() => editing.name.trim() && editing.permissions.length > 0)
const toastMsg = ref('')

/** 權限搜尋/顯示控制 */
const permQuery = ref('')
const permCheckedOnly = ref(false)
const openCats = reactive(Object.fromEntries(Object.keys(PERM_CATEGORIES).map(k => [k, false])))

/** ===== 派生 ===== */
const filteredRoleGroups = computed(() => {
  const q = qRole.value.trim()
  return !q ? state.roleGroups
    : state.roleGroups.filter(g => g.name.includes(q) || g.permissions.join('').includes(q))
})
const filteredStores = computed(() => {
  const q = qStore.value.trim()
  return !q ? state.stores : state.stores.filter(s => s.name.includes(q))
})
const currentStore = computed(() => state.stores.find(s => s.id === selectedStoreId.value) || null)
const filteredForAssign = computed(() => {
  const q = qAssign.value.trim()
  return q ? state.roleGroups.filter(g => g.name.includes(q)) : state.roleGroups
})
const selectedRole = computed(() => state.roleGroups.find(r => r.id === selectedRoleId.value) || null)

/** 權限過濾（回傳 {分類: [項目…]}，並依搜尋/只看已勾選 控制） */
const filteredPermByCategory = computed(() => {
  const q = permQuery.value.trim()
  const map = {}
  for (const [cat, items] of Object.entries(PERM_CATEGORIES)) {
    let list = items
    if (q) list = list.filter(p => p.includes(q))
    if (permCheckedOnly.value) list = list.filter(p => editing.permissions.includes(p))
    map[cat] = list
  }
  return map
})

/** ===== 共用 ===== */
function toast (msg){ toastMsg.value = msg; setTimeout(()=>toastMsg.value='',1500) }
function renderPerms(list){ return list.slice(0,5).join('、') + (list.length>5?'…':'') }
function roleNameById(id){ return state.roleGroups.find(g=>g.id===id)?.name || '(已刪除)' }
function cryptoRandomId(){ return window.crypto?.randomUUID?.() || 'id-' + Math.random().toString(36).slice(2,10) }

/** ===== 左側操作 ===== */
function switchTab(tab){
  activeTab.value = tab
  // 切換類別時清空右欄，符合「點擊後才顯示」的需求
  if (tab === 'roles') { selectedRoleId.value = null }
  else { selectedStoreId.value = null }
  // 展開第一個分類方便操作
  for (const k of Object.keys(openCats)) openCats[k] = false
}

function selectRole(id){
  selectedRoleId.value = id
  const g = state.roleGroups.find(x=>x.id===id)
  if (g) Object.assign(editing, JSON.parse(JSON.stringify(g)))
  // 預設展開第一個分類
  for (const k of Object.keys(openCats)) openCats[k] = false
  const first = Object.keys(openCats)[0]; if (first) openCats[first] = true
}

function createRole(){
  if (!canManage.value) return
  Object.assign(editing, { id:null, name:suggestRoleName(), permissions:[] })
  selectedRoleId.value = null // 尚未存檔前不指向既有群組
  for (const k of Object.keys(openCats)) openCats[k] = false
  const first = Object.keys(openCats)[0]; if (first) openCats[first] = true
}

function suggestRoleName(){
  const base='新群組'; let n=1
  while(state.roleGroups.some(g=>g.name===`${base}${n}`)) n++
  return `${base}${n}`
}

function renameRole(g){
  if (!canManage.value) return
  const n = prompt('請輸入新的群組名稱：', g.name)
  if (!n) return
  g.name = n.trim()
  persistAll()
  if (editing.id===g.id) editing.name = g.name
}

function removeRole(g){
  if (!canManage.value) return
  if (!confirm(`確定刪除「${g.name}」？`)) return
  Object.keys(state.storeGroups).forEach(k=>{
    state.storeGroups[k] = (state.storeGroups[k]||[]).filter(id=>id!==g.id)
  })
  state.roleGroups = state.roleGroups.filter(x=>x.id!==g.id)
  if (selectedRoleId.value===g.id){
    selectedRoleId.value = null
    Object.assign(editing,{id:null,name:'',permissions:[]})
  }
  persistAll()
}

function selectStore(id){ selectedStoreId.value = id }

/** ===== 編輯器 ===== */
function saveRole(){
  if (!canManage.value || !canSave.value) return
  if (!editing.id){
    const id = cryptoRandomId()
    state.roleGroups.push({ id, name: editing.name.trim(), permissions: [...editing.permissions] })
    selectedRoleId.value = id
  }else{
    const i = state.roleGroups.findIndex(x=>x.id===editing.id)
    if (i>=0) state.roleGroups[i] = { id: editing.id, name: editing.name.trim(), permissions:[...editing.permissions] }
  }
  persistAll(); toast('已儲存群組')
}
function cancelEdit(){
  if (selectedRoleId.value) selectRole(selectedRoleId.value)
  else Object.assign(editing,{id:null,name:'',permissions:[]})
}

/** 權限工具 */
function toggleCat(cat){ openCats[cat] = !openCats[cat] }
function selectAllFiltered(){
  if (!canManage.value) return
  const q = permQuery.value.trim()
  const add = []
  for (const items of Object.values(PERM_CATEGORIES)) {
    let list = items
    if (q) list = list.filter(p => p.includes(q))
    if (permCheckedOnly.value) list = list.filter(p => editing.permissions.includes(p))
    add.push(...list)
  }
  const set = new Set(editing.permissions)
  add.forEach(p=>set.add(p))
  editing.permissions = Array.from(set)
}
function clearAllFiltered(){
  if (!canManage.value) return
  const q = permQuery.value.trim()
  const remove = new Set()
  for (const items of Object.values(PERM_CATEGORIES)) {
    let list = items
    if (q) list = list.filter(p => p.includes(q))
    if (permCheckedOnly.value) list = list.filter(p => editing.permissions.includes(p))
    list.forEach(p=>remove.add(p))
  }
  editing.permissions = editing.permissions.filter(p=>!remove.has(p))
}

/** ===== 門市配置 ===== */
function toggleAssign(g){
  if (!selectedStoreId.value) return toast('請先選擇門市')
  if (!canManage.value) return
  const arr = state.storeGroups[selectedStoreId.value] || (state.storeGroups[selectedStoreId.value]=[])
  const i = arr.indexOf(g.id)
  i>=0 ? arr.splice(i,1) : arr.push(g.id)
  persistAll()
}
function quickApply(names){
  if (!canManage.value) return
  if (!selectedStoreId.value) return toast('請先選擇門市')
  const ids = names.map(n=>state.roleGroups.find(g=>g.name===n)?.id).filter(Boolean)
  state.storeGroups[selectedStoreId.value] = Array.from(new Set(ids))
  persistAll()
}
function pullRole(id){
  if (!canManage.value) return
  const arr = state.storeGroups[selectedStoreId.value] || []
  state.storeGroups[selectedStoreId.value] = arr.filter(x=>x!==id)
  persistAll()
}
function duplicateStoreSetup(){
  if (!canManage.value) return
  if (!selectedStoreId.value) return toast('請先選擇來源門市')
  const src = selectedStoreId.value
  const destName = prompt('要複製到哪一家門市？輸入門市名稱（可逗號分隔多家）')
  if (!destName) return
  const names = destName.split(',').map(s=>s.trim()).filter(Boolean)
  const targets = state.stores.filter(s=>names.includes(s.name)).map(s => s.id)
  if (!targets.length) return toast('找不到指定門市')
  targets.forEach(id => { state.storeGroups[id] = [...(state.storeGroups[src] || [])] })
  persistAll(); toast('已複製設定')
}

/** ===== 永續化 / 初始化（之後可改成 API/Firebase） ===== */
function persistAll(){ localStorage.setItem('boss-role-groups', JSON.stringify(state)) }
function revertAll(){ Object.assign(state, loadState()); toast('已還原未儲存變更') }
function loadState(){
  const raw = localStorage.getItem('boss-role-groups')
  if (raw){
    try{
      const p = JSON.parse(raw)
      p.roleGroups ||= []; p.stores ||= []; p.storeGroups ||= {}
      return p
    }catch{}
  }
  // 初始資料
  const roleGroups = [
    { id: cryptoRandomId(), name: '店長權限', permissions: [
      ...PERM_CATEGORIES['基本庫存作業'],
      ...PERM_CATEGORIES['商品與資料維護'],
      ...PERM_CATEGORIES['採購 / 補貨流程'],
      ...PERM_CATEGORIES['報表與匯出'],
      ...PERM_CATEGORIES['帳號與系統'],
    ]},
    { id: cryptoRandomId(), name: '庫存權限', permissions: [
      ...PERM_CATEGORIES['基本庫存作業'],
      ...PERM_CATEGORIES['商品與資料維護'],
      ...PERM_CATEGORIES['採購 / 補貨流程'].slice(0,2),
      '查看報表'
    ]},
    { id: cryptoRandomId(), name: '工讀生權限', permissions: [
      '查看儀表板','盤點作業','入庫（進貨/退料）','出庫（銷售/領料）','查看報表'
    ]},
  ]
  const stores = [
    { id: 'S1', name: '某某餐飲-總店' },
    { id: 'S2', name: '某某餐飲-東門店' },
    { id: 'S3', name: '某某餐飲-西門店' },
  ]
  const storeGroups = { S1: [roleGroups[0].id], S2: [roleGroups[2].id], S3: [] }
  return { roleGroups, stores, storeGroups }
}

/** ===== 拖曳：角色群組清單、門市已套用群組 ===== */
const roleListRef = ref(null)
const appliedRef   = ref(null)

onMounted(() => {
  // 快捷鍵：Alt+[ / Alt+] 收合/展開
  window.addEventListener('keydown', hotkeyHandler)

  // 角色群組清單排序（使用 data-id，避免名稱相似造成誤判）
  nextTick(() => {
    if (roleListRef.value) {
      Sortable.create(roleListRef.value, {
        animation: 150,
        handle: '.grip',
        draggable: '.item',
        onEnd: () => {
          const idsInDom = Array.from(roleListRef.value.querySelectorAll('.item'))
            .map(el => el.dataset.id)
            .filter(Boolean)
          // 僅重排目前清單呈現區段
          const map = new Map(state.roleGroups.map(g => [g.id, g]))
          state.roleGroups = idsInDom.map(id => map.get(id))
            .concat(state.roleGroups.filter(g => !idsInDom.includes(g.id)))
          persistAll()
        }
      })
    }
  })
  // 門市「已套用群組」排序
  nextTick(() => {
    if (appliedRef.value) {
      Sortable.create(appliedRef.value, {
        animation: 150,
        handle: '.grip',
        draggable: '.tag',
        onEnd: () => {
          const idsInDom = Array.from(appliedRef.value.querySelectorAll('.tag'))
            .map(el => el.dataset.id)
            .filter(Boolean)
          if (selectedStoreId.value) {
            state.storeGroups[selectedStoreId.value] = idsInDom
            persistAll()
          }
        }
      })
    }
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', hotkeyHandler)
})

function hotkeyHandler(e){
  if (e.altKey && e.key === '['){ e.preventDefault(); toggleCollapse(true) }
  if (e.altKey && e.key === ']'){ e.preventDefault(); toggleCollapse(false) }
}

/** ===== 同步：選取群組 → 編輯器 ===== */
watch(selectedRoleId, id => { if (id) selectRole(id) }, { immediate: false })

/** ===== localStorage helpers ===== */
function loadBool(key, d=false){ try{ return JSON.parse(localStorage.getItem(key) ?? String(d)) }catch{ return d } }
function saveBool(key, v){ localStorage.setItem(key, JSON.stringify(!!v)) }
function loadNumber(key, d=0){ const v = Number(localStorage.getItem(key)); return Number.isFinite(v) ? v : d }
function saveNumber(key, v){ localStorage.setItem(key, String(v)) }
</script>

<style scoped>
/* ===== 版面：雙欄（側欄可收合 / 透明） ===== */
.page{display:grid;grid-template-columns:var(--side-w,280px) 1fr;gap:16px;padding:16px;background:#f6f8fc;min-height:100vh;position:relative}
.page.is-collapsed{grid-template-columns:0px 1fr}

.backdrop{position:fixed;inset:0;background:rgba(0,0,0,.25);z-index:40}

/* 手機、桌機顯示控制 */
.only-mobile{display:none}
.only-desktop{display:inline-flex}
@media (max-width:1024px){
  .only-mobile{display:inline-flex}
  .only-desktop{display:none}
}

/* 側欄 */
.side{
  position:sticky;top:16px;align-self:start;
  background: rgba(255,255,255,var(--sb-alpha,1));
  border:1px solid #e6eaf2;border-radius:16px;overflow:hidden;
  display:flex;flex-direction:column;height:calc(100vh - 48px);
  width:var(--side-w,280px);
  transition: width .2s ease, transform .25s ease, background-color .2s;
  backdrop-filter: blur(calc((1 - var(--sb-alpha,1)) * 6px));
}
.side.collapsed{border-color:transparent}
.side-header{display:flex;align-items:center;gap:12px;padding:14px;border-bottom:1px solid #f0f3f8}
.avatar{width:40px;height:40px;border-radius:50%;background:#eef2ff;display:grid;place-items:center}
.store-meta{flex:1;min-width:0}
.store-name{font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.icon-btn{border:none;background:transparent;font-size:18px;cursor:pointer;opacity:.8;padding:4px 6px}
.icon-btn:hover{opacity:1}
.spacer{flex:1}

/* 側欄透明度控制 */
.side-footer{padding:10px 12px;border-top:1px solid #f0f3f8}

/* 抽屜（手機） */
@media (max-width:1024px){
  .page{grid-template-columns:1fr}
  .side{position:fixed;inset:0 auto 0 0;height:100vh;transform:translateX(-100%);z-index:50;border-radius:0;border-right:1px solid #e6eaf2}
  .side.open{transform:translateX(0)}
}

/* 快速開啟按鈕（桌機收合時） */
.floating-opener{
  position:fixed;left:12px;top:16px;z-index:30;border:1px solid #e1e7f0;border-radius:10px;
  background:#fff;padding:6px 10px;box-shadow:0 3px 12px rgba(0,0,0,.08);cursor:pointer
}

/* 分段鈕與工具列 */
.seg{display:flex;gap:8px;padding:12px;border-bottom:1px solid #f0f3f8}
.seg-btn{flex:1;padding:10px;border:1px solid #e6eaf2;border-radius:10px;background:#f7f9fe;cursor:pointer}
.seg-btn.active{background:#e6f4ff;border-color:#cfe9ff}
.side-tools{display:flex;gap:8px;align-items:center;padding:10px 12px;border-bottom:1px solid #f0f3f8}
.side-list{padding:12px;overflow:auto}

/* 共用卡片 */
.card{background:#fff;border:1px solid #e6eaf2;border-radius:16px;box-shadow:0 2px 10px rgba(17,24,39,.04);min-height:calc(100vh - 48px)}
.card-title{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid #f0f3f8;font-weight:700}

/* 右上工具列（右側） */
.topbar{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.topbar-title{font-weight:800}

/* 清單 */
.item{border:1px solid #e6eaf2;border-radius:12px;padding:10px;background:#fff;cursor:pointer;margin-bottom:10px}
.item.selected{outline:2px solid #9ec5ff}
.item-title{font-weight:700;margin-bottom:4px;display:flex;align-items:center;gap:6px}
.grip{cursor:grab;opacity:.6}

/* 右側編輯器 */
.main .editor{padding:14px 14px 18px}
.row{display:flex;gap:8px;align-items:center;margin-bottom:10px}
.label{min-width:76px;color:#475569;font-size:13px}
.perm-toolbar{display:flex;gap:8px;align-items:center;margin:10px 0}
.chk{display:flex;gap:6px;align-items:center;color:#475569}
.perm-section{border:1px solid #eef2f7;border-radius:12px;margin-bottom:12px;background:#fbfcff}
.perm-section-title{display:flex;gap:8px;align-items:center;justify-content:space-between;padding:10px 12px;cursor:pointer;font-weight:700}
.perm-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;border-top:1px dashed #e6eaf2;padding:12px}
.perm{display:flex;align-items:center;gap:8px;padding:8px;border:1px solid #eef2f7;border-radius:10px;background:#fff}

/* 門市配置 */
.store-panel{padding:12px}
.store-title{font-weight:800;margin-bottom:8px}
.subcard{border:1px solid #eef2f7;border-radius:12px;padding:12px;margin-top:10px;background:#fbfcff}
.sub-title{font-weight:700;margin-bottom:8px}
.stack{display:flex;gap:8px;flex-wrap:wrap}
.applied{display:flex;gap:8px;flex-wrap:wrap;min-height:40px}
.tag{background:#eef2ff;border:1px solid #c7d2fe;border-radius:999px;padding:6px 10px;display:flex;align-items:center;gap:6px}
.x{border:none;background:transparent;cursor:pointer;opacity:.7}
.x:hover{opacity:1}
.dock{margin-top:12px;border-top:1px solid #f0f3f8;padding-top:12px}
.dock-title{font-size:13px;color:#475569;margin-bottom:6px}
.dock-list{display:flex;gap:8px;flex-wrap:wrap}
.dock-btn{border:1px solid #e6eaf2;background:#fff;border-radius:10px;padding:6px 8px;cursor:pointer}

/* 輸入、按鈕 */
.input{border:1px solid #e6eaf2;border-radius:12px;padding:8px 10px;outline:none}
.input:focus{border-color:#9ec5ff;box-shadow:0 0 0 3px rgba(99, 162, 255, .15)}
.input.grow{flex:1}
.btn{border:1px solid #cfe0ff;background:#fff;color:#2563eb;border-radius:12px;padding:8px 12px;cursor:pointer}
.btn.primary{background:#2563eb;color:#fff;border-color:#2563eb}
.btn.ghost{background:#fff;border-color:#e6eaf2;color:#334155}
.btn.pill{border-radius:999px}
.link{background:transparent;border:none;color:#2563eb;cursor:pointer}
.link.danger{color:#dc2626}
.small{font-size:12px}
.center{text-align:center}
.muted{color:#64748b}
.chips{display:flex;gap:8px;align-items:center}
.chip.warn{background:#fff7ed;border:1px solid #fed7aa;color:#c2410c;border-radius:999px;padding:4px 8px}

/* 動畫/Toast */
.toast{position:fixed;right:16px;bottom:16px;background:#111827;color:#fff;padding:10px 14px;border-radius:10px;box-shadow:0 6px 18px rgba(0,0,0,.12);z-index:60}
.fade-enter-active,.fade-leave-active{transition:opacity .2s}
.fade-enter-from,.fade-leave-to{opacity:0}

/* 響應式：卡片高度在手機自適應 */
@media (max-width: 1200px){
  .card{min-height:auto}
}
</style>
