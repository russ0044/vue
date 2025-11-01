<template>
  <section class="boss-stores">
    <h2 class="section-title">店面管理</h2>

    <!-- 工具列：新增按鈕＋預設店面提示 -->
    <div class="toolbar">
      <button class="btn" @click="openCreate = true">➕ 新增店面</button>
      <span class="muted">預設店面：{{ defStoreName }}</span>
    </div>

    <!-- 店面列表 -->
    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>名稱</th>
            <th>地址</th>
            <th>電話</th>
            <th>類型</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="s in d.stores"
            :key="s.id"
            class="row-click"
            @click="openDetailDialog(s)"
          >
            <td>
              <div class="name-cell">
                {{ s.name }}
                <span v-if="s.id === d?.settings?.store?.defaultStoreId" class="chip">預設</span>
              </div>
            </td>
            <td class="ellipsis" :title="s.address">{{ s.address }}</td>
            <td>{{ s.phone }}</td>
            <td>
              <span :class="['badge', s.type === 'central' ? 'central' : 'branch']">
                {{ s.type === 'central' ? '中央廚房' : '門市' }}
              </span>
            </td>
            <td @click.stop>
              <button class="mini" @click="startRename(s)">改名</button>
              <button class="mini ghost" @click="onDel(s)">刪除</button>
              <button class="mini" @click="setDefault(s.id)">設為預設</button>
            </td>
          </tr>
          <tr v-if="!d.stores || d.stores.length === 0">
            <td colspan="5" class="muted center">目前尚無店面資料</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ① 新增店面：彈窗（平時不顯示，點按鈕才出現） -->
    <transition name="fade">
      <div v-if="openCreate" class="overlay" @click.self="closeCreate">
        <div class="modal">
          <div class="modal-head">
            <h3>新增店面</h3>
            <button class="icon-btn" title="關閉" @click="closeCreate">✕</button>
          </div>

          <div class="grid">
            <label class="fld">
              <span class="lbl">名稱（必填）</span>
              <input v-model.trim="createForm.name" class="input" placeholder="例如：海南雞 台北店" />
            </label>
            <label class="fld">
              <span class="lbl">類型</span>
              <div class="seg">
                <button :class="['segbtn', createForm.type==='branch' && 'active']" @click="createForm.type='branch'">門市</button>
                <button :class="['segbtn', createForm.type==='central' && 'active']" @click="createForm.type='central'">中央廚房</button>
              </div>
            </label>

            <label class="fld span-2">
              <span class="lbl">地址（必填）</span>
              <input v-model.trim="createForm.address" class="input" placeholder="請輸入地址" />
            </label>

            <label class="fld">
              <span class="lbl">電話（必填）</span>
              <input v-model.trim="createForm.phone" class="input" placeholder="例如：02-1234-5678 或 0912-345-678" />
            </label>
          </div>

          <div class="row mt">
            <button class="btn" :disabled="!canCreate || creating" @click="onCreate">
              <span v-if="!creating">新增</span>
              <span v-else class="spinner">處理中…</span>
            </button>
            <button class="btn ghost" :disabled="creating" @click="resetCreate">清空</button>
          </div>

          <p v-if="createMsg" :class="createOk ? 'ok' : 'err'">{{ createMsg }}</p>
        </div>
      </div>
    </transition>

    <!-- ② 改名：小對話框 -->
    <dialog v-if="renaming" open class="dlg">
      <div class="dlg-card">
        <h3>修改名稱</h3>
        <input v-model.trim="newName" class="input" placeholder="新名稱" />
        <div class="row">
          <button class="btn" @click="onRename" :disabled="!newName.trim()">儲存</button>
          <button class="btn ghost" @click="renaming = null">取消</button>
        </div>
      </div>
    </dialog>

    <!-- ③ 店面詳情：彈窗（點擊列才出現） -->
    <transition name="fade">
      <div v-if="detailOpen" class="overlay" @click.self="detailOpen=false">
        <div class="modal">
          <div class="modal-head">
            <h3>店面詳情</h3>
            <button class="icon-btn" title="關閉" @click="detailOpen=false">✕</button>
          </div>

          <div class="grid">
            <label class="fld">
              <span class="lbl">名稱</span>
              <input v-model.trim="detail.name" class="input" />
            </label>
            <label class="fld">
              <span class="lbl">類型</span>
              <select v-model="detail.type" class="input">
                <option value="branch">門市</option>
                <option value="central">中央廚房</option>
              </select>
            </label>
            <label class="fld span-2">
              <span class="lbl">地址</span>
              <input v-model.trim="detail.address" class="input" />
            </label>
            <label class="fld">
              <span class="lbl">電話</span>
              <input v-model.trim="detail.phone" class="input" />
            </label>
          </div>

          <div class="row mt">
            <button class="btn" @click="saveDetail">儲存</button>
            <button class="btn ghost" @click="resetDetail">還原</button>
            <button class="btn ghost" @click="setDefault(detail.id)">設為預設</button>
            <div class="spacer"></div>
            <button class="btn danger" @click="onDel(detail)">刪除</button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade"><div v-if="toastMsg" class="toast">{{ toastMsg }}</div></transition>
  </section>
</template>

<script setup>
import { reactive, ref, computed, onMounted, onBeforeUnmount } from 'vue'
import {
  read, subscribe,
  addStore, renameStore, deleteStore, setDefaultStore,
} from '@/store/datasource'

/* ---- 資料快照（由 datasource 訂閱） ---- */
const d = reactive(read())
let unsub = null
onMounted(() => {
  unsub = subscribe(snap => Object.assign(d, snap))
  // Firebase 模式可嘗試載入一次雲端（若已實作 loadAll）
  const mode = localStorage.getItem('ds-mode') || 'mock'
  if (mode === 'firebase') {
    import('@/store/datasource/firebase').then(m => m?.loadAll?.()).catch(()=>{})
  }
})
onBeforeUnmount(() => unsub?.())

/* ---- 工具：預設店面名稱 ---- */
const defStoreName = computed(() => {
  const store = d.stores?.find(s => s.id === d?.settings?.store?.defaultStoreId)
  return store ? store.name : '—'
})

/* ================== ① 新增店面：彈窗 ================== */
const openCreate = ref(false)
const creating = ref(false)
const createForm = reactive({ name:'', address:'', phone:'', type:'branch' })
const createMsg = ref(''); const createOk = ref(false)
const phoneOk = computed(() => /^([0-9\-+\s]{6,})$/.test(createForm.phone || ''))
const canCreate = computed(() =>
  !!createForm.name?.trim() && !!createForm.address?.trim() && !!createForm.phone?.trim() && phoneOk.value
)
function resetCreate(){
  Object.assign(createForm, { name:'', address:'', phone:'', type:'branch' })
  createMsg.value = ''; createOk.value = false
}
function closeCreate(){ if (!creating.value) openCreate.value = false }
async function onCreate(){
  if (!canCreate.value || creating.value) return
  creating.value = true; createMsg.value = ''; createOk.value = false
  try {
    await addStore({ ...createForm })
    createOk.value = true; createMsg.value = '✅ 新增成功'
    toast('已新增店面')
    resetCreate()
    openCreate.value = false
  } catch (e) {
    createOk.value = false; createMsg.value = e?.message || '❌ 新增失敗'
  } finally {
    creating.value = false
  }
}

/* ================== ② 改名（快速） ================== */
const renaming = ref(null)
const newName = ref('')
function startRename(s){ renaming.value = s; newName.value = s.name }
async function onRename(){
  if (!newName.value.trim()) return alert('請輸入新名稱')
  try { await renameStore(renaming.value.id, newName.value.trim()); renaming.value = null; toast('已更新名稱') }
  catch(e){ alert(e?.message || '儲存失敗') }
}

/* ================== ③ 店面詳情：彈窗 ================== */
const detailOpen = ref(false)
const detail = reactive({ id:'', name:'', address:'', phone:'', type:'branch' })
let original = null

function openDetailDialog(s){
  Object.assign(detail, s)
  original = JSON.parse(JSON.stringify(s))
  detailOpen.value = true
}
function resetDetail(){ if (original) Object.assign(detail, JSON.parse(JSON.stringify(original))) }

/**
 * 儲存詳情：
 * - 名稱：renameStore（mock/firebase 通用）
 * - 其他欄位（地址 / 電話 / 類型）：
 *   - mock 模式：deleteStore + addStore（保留 id）覆寫
 *   - firebase 模式：目前 datasource 若未提供 upsert/update，先提示
 */
async function saveDetail(){
  if (!detail.name?.trim()) return alert('請輸入名稱')
  const changedName = detail.name !== original.name
  const otherChanged = detail.address !== original.address || detail.phone !== original.phone || detail.type !== original.type
  try {
    if (changedName) await renameStore(detail.id, detail.name.trim())
    if (otherChanged) {
      const isMock = (localStorage.getItem('ds-mode') || 'mock') === 'mock'
      if (isMock) {
        await deleteStore(detail.id)
        await addStore({ id: detail.id, name: detail.name, address: detail.address, phone: detail.phone, type: detail.type })
      } else {
        alert('Firebase 模式下，地址/電話/類型的更新請於 datasource 增加 upsert/update 後啟用。')
      }
    }
    original = JSON.parse(JSON.stringify(detail))
    toast('已儲存')
  } catch (e) {
    alert(e?.message || '儲存失敗')
  }
}

/* ---- 刪除 / 設為預設 ---- */
async function onDel(s){
  if (!confirm(`確定刪除「${s.name}」？`)) return
  try { await deleteStore(s.id); detailOpen.value = false; toast('已刪除') }
  catch(e){ alert(e?.message || '刪除失敗') }
}
async function setDefault(id){
  try { await setDefaultStore(id); toast('已設為預設店面') }
  catch(e){ alert(e?.message || '設定失敗') }
}

/* ---- Toast ---- */
const toastMsg = ref('')
function toast(m){ toastMsg.value = m; setTimeout(()=>toastMsg.value='', 1300) }
</script>

<style scoped>
.boss-stores { padding: 16px; }
.section-title { font-size: 22px; font-weight: 800; margin-bottom: 12px; }

/* 工具列 */
.toolbar { display:flex; gap:10px; align-items:center; margin-bottom:10px; }
.btn { padding:.55rem .9rem; border:none; border-radius:10px; background:#2563eb; color:#fff; cursor:pointer; transition:.15s; }
.btn:hover { background:#1d4ed8; }
.btn.ghost { background:#f3f4f6; color:#111; border:1px solid #e5e7eb; }
.btn.danger { background:#ef4444; }
.muted { color:#64748b; }

/* 卡片與表格 */
.card { background:#fff; border:1px solid #e5e7eb; border-radius:14px; padding:12px; box-shadow:0 2px 8px rgba(0,0,0,.04); }
.table { width:100%; border-collapse:collapse; min-width:780px; }
.table th, .table td { padding:10px; border-bottom:1px solid #f1f5f9; text-align:left; }
.row-click { cursor:pointer; }
.row-click:hover td { background:#f8fafc; }
.name-cell { display:flex; align-items:center; gap:6px; }
.chip { background:#eef2ff; color:#374151; border:1px solid #c7d2fe; border-radius:999px; font-size:12px; padding:2px 8px; }
.ellipsis { max-width:360px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

.badge { display:inline-block; padding:2px 8px; border-radius:999px; font-size:12px; border:1px solid #e5e7eb; background:#fff; }
.badge.branch { border-color:#cce2ff; background:#f0f7ff; color:#1d4ed8; }
.badge.central { border-color:#fbcfe8; background:#fff1f7; color:#be185d; }

.mini { padding:.3rem .55rem; border:1px solid #cbd5e1; border-radius:8px; background:#fff; cursor:pointer; font-size:13px; }
.mini:hover { background:#f1f5f9; }

/* 彈窗（新增／詳情） */
.overlay { position:fixed; inset:0; background:rgba(0,0,0,.35); display:flex; align-items:center; justify-content:center; z-index:60; }
.modal { background:#fff; border-radius:16px; padding:16px; width:520px; max-width:92vw; box-shadow:0 12px 32px rgba(0,0,0,.18); animation:pop .22s ease; }
.modal-head{ display:flex; align-items:center; gap:8px; margin-bottom:10px; }
.modal-head h3{ font-size:18px; font-weight:800; }
.icon-btn{ border:none; background:transparent; cursor:pointer; font-size:18px; opacity:.85 }
.icon-btn:hover{ opacity:1 }

.grid { display:grid; grid-template-columns: 1fr 180px; gap:12px; }
.fld { display:grid; gap:6px; }
.lbl { font-size:13px; color:#475569; }
.span-2 { grid-column: 1 / -1; }
.input, input, select { width:100%; padding:.5rem .65rem; border:1px solid #cbd5e1; border-radius:10px; background:#fff; outline:none; }
.input:focus, input:focus, select:focus { border-color:#9ab9ff; box-shadow:0 0 0 3px rgba(99,102,241,.12); }

.seg { display:inline-flex; gap:6px; }
.segbtn{ border:1px solid #e5e7eb; background:#fff; border-radius:999px; padding:6px 12px; cursor:pointer; }
.segbtn.active{ background:#eef2ff; border-color:#c7d2fe; }

.row { display:flex; gap:8px; align-items:center; justify-content:flex-end; }
.mt { margin-top:12px; }
.ok { color:#16a34a; margin-top:6px; }
.err { color:#dc2626; margin-top:6px; }

.toast{position:fixed;right:16px;bottom:16px;background:#111827;color:#fff;padding:10px 14px;border-radius:10px;box-shadow:0 6px 18px rgba(0,0,0,.12);z-index:80}
.fade-enter-active,.fade-leave-active{transition:opacity .2s}
.fade-enter-from,.fade-leave-to{opacity:0}

@keyframes pop { from { transform: scale(.96); opacity: 0 } to { transform: scale(1); opacity: 1 } }

@media (max-width: 820px){
  .table { font-size:14px; }
  .grid { grid-template-columns: 1fr; }
}
</style>
