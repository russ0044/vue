<template>
  <section
    class="page"
    :class="[{ 'is-collapsed': collapsed && !isMobile }]"
    :style="{ '--side-w': sideWidth }"
  >
    <transition name="fade">
      <div v-if="isMobile && drawerOpen" class="backdrop" @click="closeDrawer()" />
    </transition>

    <!-- 側欄 -->
    <aside
      class="side"
      :class="[{ collapsed: collapsed && !isMobile, open: drawerOpen && isMobile }]"
      aria-label="功能側欄"
    >
      <div class="side-header">
        <button class="icon-btn only-mobile" title="關閉" @click="closeDrawer()" aria-label="關閉側欄">✕</button>

        <div class="title">權限與門市群組</div>
        <div class="spacer" />

        <!-- 數據來源指示（唯讀，實際切換請至「系統設置」） -->
        <div class="ds-badge" :class="dataSourceMode">
          {{ dataSourceMode === 'firebase' ? 'Firebase（連線中）' : '假資料（離線）' }}
        </div>

        <button
          class="icon-btn only-desktop"
          :title="collapsed? '展開側欄' : '收合側欄'"
          @click="toggleCollapse()"
          aria-label="切換側欄"
        >
          {{ collapsed ? '⮞' : '⮜' }}
        </button>
      </div>

      <div class="seg" role="tablist">
        <button
          :class="['seg-btn', activeTab==='roles' && 'active']"
          :aria-selected="activeTab==='roles'"
          role="tab"
          @click="switchTab('roles')"
        >
          使用者權限群組
        </button>
        <button
          :class="['seg-btn', activeTab==='stores' && 'active']"
          :aria-selected="activeTab==='stores'"
          role="tab"
          @click="switchTab('stores')"
        >
          門市群組
        </button>
      </div>

      <div class="side-tools">
        <template v-if="activeTab==='roles'">
          <input v-model.trim="qRole" class="input grow" placeholder="搜尋群組…" />
          <button class="btn primary" @click="onCreateClick()">＋ 新增群組</button>
        </template>
        <template v-else>
          <input v-model.trim="qStore" class="input grow" placeholder="搜尋門市…" />
          <button class="btn" @click="duplicateStoreSetup()">複製設定</button>
        </template>
      </div>

      <!-- 群組清單 -->
      <div class="side-list" v-if="activeTab==='roles'">
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
              <span class="grip" title="拖曳排序" aria-hidden="true">⠿</span>{{ g.name }}
            </div>
            <div class="muted small">{{ renderPerms(g.permissions) }}</div>
            <div class="row-actions">
              <button class="link small" @click.stop="renameRolePrompt(g)">重新命名</button>
              <button class="link danger small" @click.stop="removeRole(g.id, g.name)">刪除</button>
            </div>
          </div>
        </div>
        <p v-if="!filteredRoleGroups.length" class="muted center">沒有符合的群組</p>
      </div>

      <!-- 門市清單 -->
      <div class="side-list" v-else>
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
              已套用：{{ (view.storeGroups?.[s.id] || []).map(id => roleNameById(id)).join('、') || '—' }}
            </div>
          </div>
        </div>
        <p v-if="!filteredStores.length" class="muted center">沒有符合的門市</p>
      </div>
    </aside>

    <button
      v-show="!isMobile && collapsed"
      class="floating-opener only-desktop"
      title="展開側欄"
      @click="toggleCollapse(false)"
    >
      ☰
    </button>

    <!-- 主內容 -->
    <main class="main">
      <div class="topbar">
        <button class="icon-btn only-mobile" title="選單" @click="openDrawer()">☰</button>
        <div class="topbar-title">{{ activeTab==='roles' ? '權限群組' : '門市群組' }}</div>
        <div class="spacer" />
        <button class="btn ghost small" title="返回主頁" @click="goHome()">返回主頁</button>
        <button
          class="icon-btn only-desktop"
          :title="collapsed? '展開側欄' : '收合側欄'"
          @click="toggleCollapse()"
        >
          {{ collapsed ? '⮞' : '⮜' }}
        </button>
      </div>

      <!-- 角色群組編輯器 -->
      <div v-if="activeTab==='roles'" class="card">
        <div class="card-title">
          <div>{{ editorTitle }}</div>
          <div class="muted small" v-if="editing.id">ID：{{ editing.id }}</div>
        </div>

        <div v-if="showEditor" class="editor">
          <div class="row">
            <label class="label">群組名稱</label>
            <input
              class="input grow"
              v-model.trim="editing.name"
              placeholder="請輸入群組名稱"
              @keydown.enter.prevent="trySaveRole()"
            />
            <button v-if="editing.name" class="icon-btn" title="清空" @click="editing.name=''">✕</button>
          </div>

          <div class="perm-toolbar">
            <input v-model.trim="permQuery" class="input grow" placeholder="搜尋權限…" />
            <label class="chk">
              <input type="checkbox" v-model="permCheckedOnly" /> 只顯示已勾選
            </label>
            <button class="btn" @click="selectAllFiltered">依目前篩選全選</button>
            <button class="btn ghost" @click="clearAllFiltered">清空</button>
          </div>

          <div
            v-for="(items, cat) in filteredPermByCategory"
            :key="cat"
            class="perm-section"
            v-show="items.length"
          >
            <div class="perm-section-title" @click="toggleCat(cat)">
              <span>{{ cat }}</span>
              <span class="muted small">（{{ items.length }}）</span>
              <span class="chev">{{ openCats[cat] ? '▾' : '▸' }}</span>
            </div>

            <transition name="fade">
              <div v-show="openCats[cat]" class="perm-grid">
                <label v-for="p in items" :key="p" class="perm">
                  <input type="checkbox" :value="p" v-model="editing.permissions" />
                  <span>{{ p }}</span>
                </label>
              </div>
            </transition>
          </div>

          <div class="actions">
            <button class="btn primary" :disabled="!canSave" @click="trySaveRole()">儲存</button>
            <button class="btn ghost" @click="cancelEdit()">取消</button>
          </div>
        </div>

        <div v-else class="placeholder">
          <p class="muted">請在左側選擇群組，或點擊「新增群組」開始。</p>
        </div>
      </div>

      <!-- 門市群組配置 -->
      <div v-else class="card">
        <div class="card-title"><div>門市群組</div></div>

        <div v-if="currentStore" class="store-panel">
          <div class="store-title">{{ currentStore.name }}</div>

          <div class="subcard">
            <div class="sub-title">已套用群組（可拖曳排序）</div>
            <div class="applied" ref="appliedRef">
              <div
                v-for="id in (view.storeGroups?.[selectedStoreId] || [])"
                :key="id"
                class="tag"
                :data-id="id"
              >
                <span class="grip" title="拖曳排序">⠿</span>{{ roleNameById(id) }}
                <button class="x" @click="pullRole(id)" title="移除">✕</button>
              </div>
              <p v-if="!(view.storeGroups?.[selectedStoreId]||[]).length" class="muted">
                尚未套用任何群組
              </p>
            </div>
          </div>

          <div class="dock">
            <div class="dock-title">可用群組</div>
            <div class="dock-list">
              <button
                v-for="g in view.roleGroups"
                :key="g.id"
                class="dock-btn"
                :class="{'active': (view.storeGroups?.[selectedStoreId] || []).includes(g.id)}"
                @click="toggleAssign(g)"
              >
                {{ g.name }}
              </button>
            </div>
          </div>

          <div class="actions">
            <button class="btn primary" @click="persistStoreGroups()">儲存變更</button>
            <button class="btn ghost" @click="revertView()">還原</button>
          </div>
        </div>

        <div v-else class="placeholder">
          <p class="muted">請先在左側選擇一個「門市」。</p>
        </div>
      </div>
    </main>

    <transition name="fade">
      <div v-if="toastMsg" class="toast" role="status" aria-live="polite">{{ toastMsg }}</div>
    </transition>
  </section>
</template>

<script setup>
/**
 * 完整可執行版本：
 * - 修正所有未宣告的狀態 / 計算屬性
 * - 整合全域主題（light/dark/auto）自動同步
 * - 角色群組 CRUD、拖曳排序、門市套用群組、複製設定
 * - 資料來源由 datasource 統一管理（mock / firebase）
 */
import { reactive, ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import Sortable from 'sortablejs'
import * as ds from '@/store/datasource'

defineOptions({ name: 'BossRoleGroups' })

/* ==================== 主題同步（light/dark/auto） ==================== */
function applyTheme(mode) {
  const pref = mode || localStorage.getItem('theme') || 'light'
  const shouldDark =
    pref === 'dark' ||
    (pref === 'auto' && window.matchMedia?.('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', !!shouldDark)
}
onMounted(() => {
  const saved = localStorage.getItem('theme')
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
  applyTheme(saved ?? (prefersDark ? 'dark' : 'light'))
  window.addEventListener('storage', e => {
    if (e.key === 'theme') applyTheme(e.newValue)
  })
})

/* ==================== 權限定義（分門別類） ==================== */
const PERM_CATEGORIES = {
  '基本庫存作業': [
    '查看儀表板','盤點作業','入庫（進貨/退料）','出庫（銷售/領料）',
    '庫存調整','調撥（門市↔中央廚房）','報廢/毀損處理'
  ],
  '商品與資料維護': [
    '建立/編輯商品','批號/效期管理','安全庫存與警示',
    '供應商管理','庫存地點/倉別管理','價格/成本管理'
  ],
  '採購 / 補貨流程': ['採購單與到貨驗收','補貨建議與審核','門市要貨單審核'],
  '報表與匯出': ['查看報表','匯出報表（CSV/Excel/PDF）'],
  '帳號與系統': ['管理使用者','角色與權限管理','門市與組織管理','通知/警示設定','系統設定'],
}

/* ==================== 資料來源（讀取 / 訂閱） ==================== */
const view = reactive(ds.read() || {})
view.storeGroups ||= {}
view.roleGroups  ||= []
view.stores      ||= []

let unsubscribe = null
onMounted(() => {
  unsubscribe = ds.subscribe?.((snap) => {
    if (!snap) return
    Object.assign(view, snap)
    view.storeGroups ||= {}
    view.roleGroups  ||= []
    view.stores      ||= []
  })
})
onBeforeUnmount(() => unsubscribe?.())

/* 從 settings 推導 */
const safeSettings = computed(() => ({
  defaultStoreId: view?.settings?.store?.defaultStoreId ?? (view?.stores?.[0]?.id || ''),
  datasourceMode: view?.settings?.datasource?.mode ?? (localStorage.getItem('ds-mode') || 'mock'),
}))
const dataSourceMode = computed(() => safeSettings.value.datasourceMode)

/* ==================== RWD / 側欄 ==================== */
const drawerOpen = ref(false)
const collapsed  = ref(loadBool('brg-collapsed', false))
const isMobile   = ref(matchMedia('(max-width: 1024px)').matches)
const sideWidth  = computed(() => (isMobile.value ? '88vw' : (collapsed.value ? '0px' : '320px')))
function openDrawer(){ drawerOpen.value = true }
function closeDrawer(){ drawerOpen.value = false }
function toggleCollapse(v){
  collapsed.value = typeof v === 'boolean' ? v : !collapsed.value
  saveBool('brg-collapsed', collapsed.value)
}
function handleResize(){
  isMobile.value = matchMedia('(max-width: 1024px)').matches
  if (!isMobile.value) drawerOpen.value = false
}
window.addEventListener('resize', handleResize)
onBeforeUnmount(() => window.removeEventListener('resize', handleResize))

/* ==================== 狀態：分頁 / 選取 ==================== */
const activeTab = ref('stores')     // 'roles' | 'stores'
const qRole = ref(''), qStore = ref('')

const selectedRoleId = ref(null)
const selectedStoreId = ref(null)

const editing = reactive({ id:null, name:'', permissions:[] })
const creating = ref(false)
const editorTitle = computed(() => (creating.value ? '新增權限群組' : (editing.id ? '編輯權限群組' : '權限群組')))
const canSave = computed(() =>
  !!editing.name.trim() &&
  (editing.permissions?.length || 0) > 0 &&
  !isDuplicateRoleName(editing.name.trim(), editing.id)
)
const showEditor = computed(() => activeTab.value==='roles' && (creating.value || selectedRoleId.value !== null))

/* 權限搜尋 / 展開 */
const permQuery = ref('')
const permCheckedOnly = ref(false)
const openCats = reactive(Object.fromEntries(Object.keys(PERM_CATEGORIES).map(k => [k, true])))
const filteredPermByCategory = computed(() => {
  const q = permQuery.value.trim()
  const result = {}
  for (const [cat, items] of Object.entries(PERM_CATEGORIES)) {
    let list = items
    if (q) list = list.filter(p => p.includes(q))
    if (permCheckedOnly.value) list = list.filter(p => (editing.permissions||[]).includes(p))
    result[cat] = list
  }
  return result
})

/* ==================== 派生清單 ==================== */
const roleMap = computed(() => new Map((view.roleGroups||[]).map(g => [g.id, g])))
const filteredRoleGroups = computed(() => {
  const q = qRole.value.trim()
  const list = Array.isArray(view.roleGroups) ? view.roleGroups : []
  return !q ? list : list.filter(g =>
    g.name.includes(q) || (g.permissions||[]).some(p => p.includes(q))
  )
})
const filteredStores = computed(() => {
  const q = qStore.value.trim()
  const list = Array.isArray(view.stores) ? view.stores : []
  return !q ? list : list.filter(s => (s?.name || '').includes(q))
})
const currentStore = computed(() =>
  (Array.isArray(view.stores) ? view.stores : []).find(s => s.id === selectedStoreId.value) || null
)

/* ==================== 共用 / Toast ==================== */
function renderPerms(list){ const arr = Array.isArray(list) ? list : []; return arr.slice(0,5).join('、') + (arr.length>5?'…':'') }
function roleNameById(id){ return roleMap.value.get(id)?.name || '(已刪除)' }
const toastMsg = ref(''); let _toastTimer = 0
function toast(msg){ toastMsg.value = msg; clearTimeout(_toastTimer); _toastTimer = setTimeout(()=>toastMsg.value='',1600) }

/* 預設選取門市 */
onMounted(() => {
  if (activeTab.value==='stores') {
    const def = safeSettings.value.defaultStoreId
    const hasDef = (view.stores||[]).some(s=>s.id===def)
    selectedStoreId.value = hasDef ? def : (view.stores?.[0]?.id || null)
  }
})

/* 異動時校正選取 */
watch(() => (view.stores||[]).map(s => s.id).join(','), () => {
  if (!selectedStoreId.value) {
    selectedStoreId.value = safeSettings.value.defaultStoreId || (view.stores?.[0]?.id || null)
  } else if (!(view.stores||[]).some(s => s.id === selectedStoreId.value)) {
    selectedStoreId.value = view.stores?.[0]?.id || null
  }
})
watch(() => (view.roleGroups||[]).map(g => g.id).join(','), () => {
  if (selectedRoleId.value && !(view.roleGroups||[]).some(g => g.id === selectedRoleId.value)) {
    selectedRoleId.value = null
    creating.value = false
    Object.assign(editing, { id:null, name:'', permissions:[] })
  }
})

/* ==================== 左側操作 ==================== */
function switchTab(tab){
  activeTab.value = tab
  if (tab === 'roles') {
    selectedRoleId.value = null
    creating.value = false
    Object.assign(editing,{id:null,name:'',permissions:[]})
  } else {
    const def = safeSettings.value.defaultStoreId
    const hasDef = (view.stores||[]).some(s=>s.id===def)
    selectedStoreId.value = hasDef ? def : (view.stores?.[0]?.id || null)
  }
}
function selectRole(id){
  creating.value = false
  selectedRoleId.value = id
  const g = (view.roleGroups || []).find(x=>x.id===id)
  if (g) Object.assign(editing, JSON.parse(JSON.stringify(g)))
}
function onCreateClick(){
  activeTab.value = 'roles'
  creating.value = true
  selectedRoleId.value = null
  Object.assign(editing, { id:null, name:suggestRoleName(), permissions:[] })
  drawerOpen.value = false
}
function suggestRoleName(){
  const base='新群組'
  let n=1
  const names = new Set((view.roleGroups||[]).map(g=>g.name))
  while(names.has(`${base}${n}`)) n++
  return `${base}${n}`
}
function isDuplicateRoleName(name, selfId){
  return (view.roleGroups||[]).some(g => g.name === name && g.id !== selfId)
}

/* ==================== 角色群組 CRUD ==================== */
async function trySaveRole(){
  if (!editing.name.trim()) return toast('請輸入群組名稱')
  if ((editing.permissions?.length||0)===0) return toast('請至少勾選一個權限')
  if (isDuplicateRoleName(editing.name.trim(), editing.id)) return toast('已存在相同名稱的群組')

  const payload = {
    id: editing.id || null,
    name: editing.name.trim(),
    permissions: [...(editing.permissions||[])],
  }
  const id = await ds.upsertRoleGroup?.(payload)
  if (!editing.id) { selectedRoleId.value = id; creating.value = false; editing.id = id }
  toast('已儲存群組')
}
function renameRolePrompt(g){
  const n = prompt('請輸入新的群組名稱：', g.name)
  if (!n) return
  const name = n.trim()
  if (!name) return
  if (isDuplicateRoleName(name, g.id)) { toast('已存在相同名稱的群組'); return }
  ds.renameRole?.(g.id, name)
  if (editing.id===g.id) editing.name = name
  toast('已更名')
}
async function removeRole(id, name){
  if (!confirm(`確定刪除「${name}」？\n將一併自所有門市移除此群組。`)) return
  await ds.deleteRoleGroup?.(id)
  // 從所有門市移除並持久化，確保資料一致
  const allStores = view.stores || []
  for (const s of allStores) {
    const arr = (view.storeGroups?.[s.id] || [])
    const next = arr.filter(x => x !== id)
    if (arr.length !== next.length) {
      view.storeGroups[s.id] = next
      await ds.setStoreGroups?.(s.id, next)
    }
  }
  if (selectedRoleId.value===id){
    selectedRoleId.value=null; creating.value=false
    Object.assign(editing,{id:null,name:'',permissions:[]})
  }
  toast('已刪除群組並同步門市設定')
}

/* 權限工具 */
function toggleCat(cat){ openCats[cat] = !openCats[cat] }
function selectAllFiltered(){
  const q = permQuery.value.trim()
  const add = []
  for (const items of Object.values(PERM_CATEGORIES)) {
    let list = items
    if (q) list = list.filter(p => p.includes(q))
    if (permCheckedOnly.value) list = list.filter(p => (editing.permissions||[]).includes(p))
    add.push(...list)
  }
  const set = new Set(editing.permissions||[]); add.forEach(p=>set.add(p))
  editing.permissions = Array.from(set)
}
function clearAllFiltered(){
  const q = permQuery.value.trim()
  const remove = new Set()
  for (const items of Object.values(PERM_CATEGORIES)) {
    let list = items
    if (q) list = list.filter(p => p.includes(q))
    if (permCheckedOnly.value) list = list.filter(p => (editing.permissions||[]).includes(p))
    list.forEach(p=>remove.add(p))
  }
  editing.permissions = (editing.permissions||[]).filter(p=>!remove.has(p))
}
function cancelEdit(){
  if (creating.value) {
    creating.value=false
    Object.assign(editing,{id:null,name:'',permissions:[]})
    return
  }
  if (selectedRoleId.value) selectRole(selectedRoleId.value)
}

/* ==================== 門市配置 ==================== */
function selectStore(id){ selectedStoreId.value = id }
function toggleAssign(g){
  if (!selectedStoreId.value) return toast('請先選擇門市')
  const sg = view.storeGroups ||= {}
  const arr = sg[selectedStoreId.value] || (sg[selectedStoreId.value] = [])
  const i = arr.indexOf(g.id); i>=0 ? arr.splice(i,1) : arr.push(g.id)
}
function pullRole(id){
  const arr = view.storeGroups?.[selectedStoreId.value] || []
  view.storeGroups[selectedStoreId.value] = arr.filter(x=>x!==id)
}
async function persistStoreGroups(){
  if (!selectedStoreId.value) return
  const list = view.storeGroups?.[selectedStoreId.value] || []
  await ds.setStoreGroups?.(selectedStoreId.value, list)
  toast('已儲存門市套用群組')
}
function revertView(){ Object.assign(view, ds.read() || {}); view.storeGroups ||= {}; toast('已還原未儲存變更') }
async function duplicateStoreSetup(){
  if (!selectedStoreId.value) return toast('請先選擇來源門市')
  const src = selectedStoreId.value
  const destName = prompt('要複製到哪一家門市？輸入門市名稱（可逗號分隔多家）')
  if (!destName) return
  const names = destName.split(',').map(s=>s.trim()).filter(Boolean)
  const targets = (view.stores||[]).filter(s=>names.includes(s.name)).map(s => s.id)
  if (!targets.length) return toast('找不到指定門市')
  await ds.duplicateStoreGroups?.(src, targets)
  // 本地同步
  const srcList = view.storeGroups?.[src] || []
  for (const id of targets) view.storeGroups[id] = [...srcList]
  toast('已複製設定')
}

/* ==================== 拖曳排序 ==================== */
const roleListRef = ref(null)
const appliedRef   = ref(null)
onMounted(() => {
  nextTick(() => {
    // 群組清單排序（寫回資料源順序）
    if (roleListRef.value) {
      Sortable.create(roleListRef.value, {
        animation: 150,
        handle: '.grip',
        draggable: '.item',
        onEnd: async () => {
          const idsInDom = Array.from(roleListRef.value.querySelectorAll('.item'))
            .map(el => el.dataset.id).filter(Boolean)
          const map = new Map((view.roleGroups||[]).map(g => [g.id, g]))
          const newList = idsInDom.map(id => map.get(id)).filter(Boolean)
          // 把搜尋過濾藏起來的補回尾端
          ;(view.roleGroups||[]).forEach(g => { if (!idsInDom.includes(g.id)) newList.push(g) })
          // 依序 upsert 以維持順序（資料層可選擇寫入 index 欄位）
          for (const g of newList) await ds.upsertRoleGroup?.(g)
          toast('已更新群組排序')
        }
      })
    }
    // 已套用群組排序（即時持久化）
    if (appliedRef.value) {
      Sortable.create(appliedRef.value, {
        animation:150,
        handle:'.grip',
        draggable:'.tag',
        onEnd: async () => {
          const idsInDom = Array.from(appliedRef.value.querySelectorAll('.tag'))
            .map(el => el.dataset.id).filter(Boolean)
          if (selectedStoreId.value) {
            view.storeGroups[selectedStoreId.value] = idsInDom
            await persistStoreGroups()
          }
        }
      })
    }
  })
})

/* ==================== 導航 ==================== */
function goHome(){
  try {
    // 若專案有 router
    // eslint-disable-next-line no-eval
    const r = (eval('window.__app_router__')) || null
    if (r?.push) { r.push('/'); return }
  } catch {}
  if (location.hash !== '#/') location.hash = '#/'
}

/* ==================== helpers ==================== */
function loadBool(key, d=false){ try{ return JSON.parse(localStorage.getItem(key) ?? String(d)) }catch{ return d } }
function saveBool(key, v){ localStorage.setItem(key, JSON.stringify(!!v)) }
</script>

<style scoped>
:root{
  --bg:#f6f8fc;
  --text:#111827;
  --card-bg:#fff;
  --border:#e6eaf2;
  --muted:#64748b;
  --chip-bg:#fff;
  --chip-on:#eef2ff;
}
.dark{
  --bg:#0f172a;
  --text:#e2e8f0;
  --card-bg:#1e293b;
  --border:#334155;
  --muted:#94a3b8;
  --chip-bg:#1e293b;
  --chip-on:#273549;
}

/* —— 版面與 UI —— */
.page{display:grid;grid-template-columns:var(--side-w,320px) 1fr;gap:16px;padding:16px;background:var(--bg);color:var(--text);min-height:100vh;position:relative}
.page.is-collapsed{grid-template-columns:0px 1fr}
.backdrop{position:fixed;inset:0;background:rgba(0,0,0,.25);z-index:40}
.only-mobile{display:none}.only-desktop{display:inline-flex}
@media (max-width:1024px){ .only-mobile{display:inline-flex} .only-desktop{display:none} .page{grid-template-columns:1fr} }

.side{position:sticky;top:16px;align-self:start;background:var(--card-bg);border:1px solid var(--border);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;height:calc(100vh - 48px);width:var(--side-w,320px);transition: width .2s ease, transform .25s ease}
.side.collapsed{border-color:transparent}
.side-header{display:flex;align-items:center;gap:12px;padding:14px;border-bottom:1px solid var(--border)}
.title{font-weight:800}
.icon-btn{border:none;background:transparent;font-size:18px;cursor:pointer;opacity:.85;padding:4px 6px;color:var(--text)}
.icon-btn:hover{opacity:1}
.spacer{flex:1}
.seg{display:flex;gap:8px;padding:12px;border-bottom:1px solid var(--border)}
.seg-btn{flex:1;padding:10px;border:1px solid var(--border);border-radius:10px;background:var(--chip-bg);cursor:pointer;color:var(--text)}
.seg-btn.active{background:var(--chip-on);border-color:#cfe9ff}
.side-tools{display:flex;gap:8px;align-items:center;padding:10px 12px;border-bottom:1px solid var(--border)}
.side-list{padding:12px;overflow:auto}

.ds-badge{font-size:12px;padding:4px 8px;border-radius:999px;border:1px solid #e2e8f0;background:#f8fafc;color:#334155}
.ds-badge.firebase{color:#0f766e;border-color:#99f6e4;background:#ecfeff}
.ds-badge.mock{color:#6b7280;border-color:#e5e7eb;background:#fafafa}

.item{border:1px solid var(--border);border-radius:12px;padding:10px;background:var(--card-bg);cursor:pointer;margin-bottom:10px}
.item.selected{outline:2px solid #9ec5ff}
.item-title{font-weight:700;margin-bottom:4px;display:flex;align-items:center;gap:6px}
.grip{cursor:grab;opacity:.6}
.floating-opener{position:fixed;left:12px;top:16px;z-index:30;border:1px solid #e1e7f0;border-radius:10px;background:#fff;padding:6px 10px;box-shadow:0 3px 12px rgba(0,0,0,.08);cursor:pointer}

.card{background:var(--card-bg);border:1px solid var(--border);border-radius:16px;box-shadow:0 2px 10px rgba(17,24,39,.04);min-height:calc(100vh - 48px)}
.card-title{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid var(--border);font-weight:700}
.topbar{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.topbar-title{font-weight:800}

.main .editor{padding:14px 14px 18px}
.row{display:flex;gap:8px;align-items:center;margin-bottom:10px}
.label{min-width:76px;color:#475569;font-size:13px}
.perm-toolbar{display:flex;gap:8px;align-items:center;margin:10px 0}
.chk{display:flex;gap:6px;align-items:center;color:#475569}
.perm-section{border:1px solid #eef2f7;border-radius:12px;margin-bottom:12px;background:#fbfcff}
.dark .perm-section{background:#1b2433;border-color:#334155}
.perm-section-title{display:flex;gap:8px;align-items:center;justify-content:space-between;padding:10px 12px;cursor:pointer;font-weight:700}
.perm-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;border-top:1px dashed var(--border);padding:12px}
.perm{display:flex;align-items:center;gap:8px;padding:8px;border:1px solid var(--border);border-radius:10px;background:var(--card-bg)}

.store-panel{padding:12px}
.store-title{font-weight:800;margin-bottom:8px}
.subcard{border:1px solid var(--border);border-radius:12px;padding:12px;margin-top:10px;background:#fbfcff}
.dark .subcard{background:#1b2433}
.sub-title{font-weight:700;margin-bottom:8px}
.applied{display:flex;gap:8px;flex-wrap:wrap;min-height:40px}
.tag{background:var(--chip-on);border:1px solid #c7d2fe;border-radius:999px;padding:6px 10px;display:flex;align-items:center;gap:6px}
.tag.active{outline:2px solid #93c5fd}
.x{border:none;background:transparent;cursor:pointer;opacity:.7;color:var(--text)}
.x:hover{opacity:1}
.dock{margin-top:12px;border-top:1px solid var(--border);padding-top:12px}
.dock-title{font-size:13px;color:#475569;margin-bottom:6px}
.dock-list{display:flex;gap:8px;flex-wrap:wrap}
.dock-btn{border:1px solid var(--border);background:var(--card-bg);border-radius:10px;padding:6px 8px;cursor:pointer;color:var(--text)}
.dock-btn.active{background:var(--chip-on);border-color:#cfe9ff}

.btn{border:1px solid #cfe0ff;background:#fff;color:#2563eb;border-radius:12px;padding:8px 12px;cursor:pointer}
.dark .btn{background:#0f172a}
.btn.primary{background:#2563eb;color:#fff;border-color:#2563eb}
.btn.ghost{background:var(--card-bg);border-color:var(--border);color:#334155}
.dark .btn.ghost{color:#e2e8f0}
.btn.small{padding:6px 10px}
.link{background:transparent;border:none;color:#2563eb;cursor:pointer}
.link.danger{color:#dc2626}
.small{font-size:12px}
.center{text-align:center}
.muted{color:var(--muted)}
.toast{position:fixed;right:16px;bottom:16px;background:#111827;color:#fff;padding:10px 14px;border-radius:10px;box-shadow:0 6px 18px rgba(0,0,0,.12);z-index:60}
.fade-enter-active,.fade-leave-active{transition:opacity .2s}
.fade-enter-from,.fade-leave-to{opacity:0}
@media (max-width:1200px){ .card{min-height:auto} }
</style>
