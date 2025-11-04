<template>
  <section class="page" :style="{ '--side-w': '0px' }">
    <!-- 主內容（維持與 BossRoleGroups 一致的頂部列與卡片樣式） -->
    <main class="main">
      <div class="topbar">
        <div class="topbar-title">店面管理</div>
        <div class="spacer" />
        <div class="ds-badge" :class="dataSourceMode">
          {{ dataSourceMode === 'firebase' ? 'Firebase（連線中）' : '假資料（離線）' }}
        </div>
        <button class="btn ghost small" title="返回主頁" @click="goHome()">返回主頁</button>
      </div>

      <div class="card">
        <!-- 工具列：新增按鈕＋預設店面提示 -->
        <div class="toolbar">
          <button class="btn primary" @click="openCreate = true">➕ 新增店面</button>
          <div class="spacer"></div>
          <span class="muted">預設店面：{{ defStoreName }}</span>
        </div>

        <!-- 店面列表 -->
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>名稱</th>
                <th>地址</th>
                <th>電話</th>
                <th>類型</th>
                <th style="width:280px">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="s in (view.stores || [])"
                :key="s.id"
                class="row-click"
                @click="openDetailDialog(s)"
              >
                <td>
                  <div class="name-cell">
                    {{ s.name }}
                    <span v-if="s.id === view?.settings?.store?.defaultStoreId" class="chip">預設</span>
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
              <tr v-if="!view.stores || view.stores.length === 0">
                <td colspan="5" class="muted center">目前尚無店面資料</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>

    <!-- ① 新增店面：彈窗 -->
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
            <button class="btn primary" :disabled="!canCreate || creating" @click="onCreate">
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
          <button class="btn primary" @click="onRename" :disabled="!newName.trim()">儲存</button>
          <button class="btn ghost" @click="renaming = null">取消</button>
        </div>
      </div>
    </dialog>

    <!-- ③ 店面詳情：彈窗 -->
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
            <button class="btn primary" @click="saveDetail">儲存</button>
            <button class="btn ghost" @click="resetDetail">還原</button>
            <button class="btn ghost" @click="setDefault(detail.id)">設為預設</button>
            <div class="spacer"></div>
            <button class="btn danger" @click="onDel(detail)">刪除</button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="toastMsg" class="toast" role="status" aria-live="polite">{{ toastMsg }}</div>
    </transition>
  </section>
</template>

<script setup>
import { reactive, ref, computed, onMounted, onBeforeUnmount } from 'vue'
import * as ds from '@/store/datasource'

defineOptions({ name: 'BossStores' })

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
onBeforeUnmount(() => {
  window.removeEventListener('storage', () => {})
})

/* ==================== 資料來源（讀取 / 訂閱） ==================== */
const view = reactive(ds.read() || { settings:{ store:{} }, stores:[] })
let unsub = null
onMounted(() => {
  unsub = ds.subscribe?.((snap) => {
    if (!snap) return
    Object.assign(view, snap)
    view.stores ||= []
    view.settings ||= {}
    view.settings.store ||= {}
    view.settings.datasource ||= { mode: (localStorage.getItem('ds-mode') || 'mock') }
  })
})
onBeforeUnmount(() => unsub?.())

/* 從 settings 推導資料來源模式 */
const safeSettings = computed(() => ({
  defaultStoreId: view?.settings?.store?.defaultStoreId ?? (view?.stores?.[0]?.id || ''),
  datasourceMode: view?.settings?.datasource?.mode ?? (localStorage.getItem('ds-mode') || 'mock'),
}))
const dataSourceMode = computed(() => safeSettings.value.datasourceMode)

/* ---- 工具：預設店面名稱 ---- */
const defStoreName = computed(() => {
  const store = (view.stores || []).find(s => s.id === (view?.settings?.store?.defaultStoreId || ''))
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
    await ds.addStore?.({ ...createForm })
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
  try { await ds.renameStore?.(renaming.value.id, newName.value.trim()); renaming.value = null; toast('已更新名稱') }
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
 * - 名稱：ds.renameStore（mock/firebase 通用）
 * - 其他欄位（地址 / 電話 / 類型）：
 *   - mock 模式：deleteStore + addStore（保留 id）覆寫
 *   - firebase 模式：若 datasource 未實作 upsert/update，先提示
 */
async function saveDetail(){
  if (!detail.name?.trim()) return alert('請輸入名稱')
  const changedName = detail.name !== original.name
  const otherChanged = detail.address !== original.address || detail.phone !== original.phone || detail.type !== original.type
  try {
    if (changedName) await ds.renameStore?.(detail.id, detail.name.trim())
    if (otherChanged) {
      const isMock = (localStorage.getItem('ds-mode') || 'mock') === 'mock'
      if (isMock) {
        await ds.deleteStore?.(detail.id)
        await ds.addStore?.({ id: detail.id, name: detail.name, address: detail.address, phone: detail.phone, type: detail.type })
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
  try { await ds.deleteStore?.(s.id); detailOpen.value = false; toast('已刪除') }
  catch(e){ alert(e?.message || '刪除失敗') }
}
async function setDefault(id){
  try { await ds.setDefaultStore?.(id); toast('已設為預設店面') }
  catch(e){ alert(e?.message || '設定失敗') }
}

/* ---- 導航 ---- */
function goHome(){
  try {
    // 若專案有 router
    // eslint-disable-next-line no-eval
    const r = (eval('window.__app_router__')) || null
    if (r?.push) { r.push('/'); return }
  } catch {}
  if (location.hash !== '#/') location.hash = '#/'
}

/* ---- Toast ---- */
const toastMsg = ref('')
function toast(m){ toastMsg.value = m; setTimeout(()=>toastMsg.value='', 1500) }
</script>

<style scoped>
:root {
  --bg: #f6f8fc;
  --text: #111827;
  --card-bg: #ffffff;
  --border: #e6eaf2;
  --muted: #475569;
  --chip-bg: #fff;
  --chip-on: #eef2ff;
}

.dark {
  /* 背景：更深藍灰，提高對比 */
  --bg: #0b1220;
  --card-bg: #162235;
  --border: #2b3b55;

  /* 文字：亮度提升，避免太灰 */
  --text: #f3f7ff;
  --muted: #cbd5e1;

  /* 元件配色 */
  --chip-bg: #1f2d45;
  --chip-on: #2a3a5a;
}

/* 提升表格標題與欄位對比 */
.table th {
  color: var(--text);
  font-weight: 700;
  background: rgba(255, 255, 255, 0.04);
}

/* 提升 muted 在深色模式下的可見度 */
.dark .muted { color: var(--muted); }

/* 修正按鈕在深色下的字顏色 */
.dark .btn,
.dark .mini { color: #e8f0ff; }

/* 讓幽靈按鈕 (ghost) 更有邊界與對比 */
.dark .btn.ghost {
  background: #1e293b;
  border-color: #334155;
  color: #e2e8f0;
}

/* 新增：mini.ghost 在深色下的可視性 */
.mini.ghost {
  background: var(--card-bg);
  border-color: var(--border);
}
.dark .mini.ghost {
  background: #1e293b;
  border-color: #334155;
  color: #e2e8f0;
}

/* 標題加亮 */
.topbar-title,
.modal-head h3 { color: var(--text); }

/* —— 整體版面（對齊 BossRoleGroups） —— */
.page{display:grid;grid-template-columns:1fr;gap:16px;padding:16px;background:var(--bg);color:var(--text);min-height:100vh;position:relative}
.spacer{flex:1}
.topbar{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.topbar-title{font-weight:800}

/* —— 資料來源徽章 —— */
.ds-badge{font-size:12px;padding:4px 8px;border-radius:999px;border:1px solid #e2e8f0;background:#f8fafc;color:#334155}
.ds-badge.firebase{color:#0f766e;border-color:#99f6e4;background:#ecfeff}
.ds-badge.mock{color:#6b7280;border-color:#e5e7eb;background:#fafafa}

/* —— 卡片、工具列、表格 —— */
.card{background:var(--card-bg);border:1px solid var(--border);border-radius:16px;box-shadow:0 2px 10px rgba(17,24,39,.04);padding:12px}
.toolbar{display:flex;gap:10px;align-items:center;margin-bottom:10px}

.table-wrap{overflow:auto}
.table{width:100%;border-collapse:collapse;min-width:860px;color:var(--text)}
.table th,.table td{padding:10px;border-bottom:1px solid #f1f5f9;text-align:left}
.row-click{cursor:pointer}
.row-click:hover td{background:#f8fafc}
.dark .row-click:hover td{background:#1b2433}

/* 表格列文字在深色下更亮一些（防止看起來發灰） */
.dark .table td { color:#eaf1ff; }

.name-cell{display:flex;align-items:center;gap:6px}
.chip{background:var(--chip-on);color:#374151;border:1px solid #c7d2fe;border-radius:999px;font-size:12px;padding:2px 8px}
.dark .chip{background:var(--chip-on);color:#e6eeff;border-color:#4d6a96}

.ellipsis{max-width:360px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* 徽章在深色下的對比 */
.badge{display:inline-block;padding:2px 8px;border-radius:999px;font-size:12px;border:1px solid #e5e7eb;background:var(--card-bg);color:#1f2a44}
.badge.branch{border-color:#cce2ff;background:#f0f7ff;color:#1d4ed8}
.badge.central{border-color:#fbcfe8;background:#fff1f7;color:#be185d}
.dark .badge{background:#122033;border-color:#2b3b55;color:#e8f0ff}
.dark .badge.branch{border-color:#3b82f6;background:rgba(59,130,246,.15);color:#d7e8ff}
.dark .badge.central{border-color:#f472b6;background:rgba(244,114,182,.15);color:#ffe1ef}

/* —— 按鈕 —— */
.btn{border:1px solid #cfe0ff;background:var(--card-bg);color:#2563eb;border-radius:12px;padding:8px 12px;cursor:pointer}
.btn:hover{filter:brightness(0.98)}
.dark .btn{background:#0f172a}
.btn.primary{background:#2563eb;color:#fff;border-color:#2563eb}
.btn.ghost{background:var(--card-bg);border-color:var(--border);color:#334155}
.btn.small{padding:6px 10px}
.btn.danger{background:#ef4444;color:#fff;border-color:#ef4444}
.mini{padding:.35rem .55rem;border:1px solid #cbd5e1;border-radius:8px;background:var(--card-bg);cursor:pointer;font-size:13px}
.mini:hover{background:#f1f5f9}
.dark .mini:hover{background:#1b2433}

/* —— 表單/彈窗（新增／詳情） —— */
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;z-index:60}
.modal{background:var(--card-bg);border-radius:16px;padding:16px;width:560px;max-width:92vw;box-shadow:0 12px 32px rgba(0,0,0,.18);animation:pop .22s ease;border:1px solid var(--border)}
.modal-head{display:flex;align-items:center;gap:8px;margin-bottom:10px}
.modal-head h3{font-size:18px;font-weight:800}
.icon-btn{border:none;background:transparent;cursor:pointer;font-size:18px;opacity:.85;color:var(--text)}
.icon-btn:hover{opacity:1}

.grid{display:grid;grid-template-columns: 1fr 200px;gap:12px}
.fld{display:grid;gap:6px}
.lbl{font-size:13px;color:#475569}
.dark .lbl{color:#cbd5e1}
.span-2{grid-column:1 / -1}
.input, input, select{width:100%;padding:.5rem .65rem;border:1px solid #cbd5e1;border-radius:10px;background:var(--card-bg);outline:none;color:var(--text)}
.input:focus, input:focus, select:focus{border-color:#9ab9ff;box-shadow:0 0 0 3px rgba(99,102,241,.12)}

/* segment */
.seg{display:inline-flex;gap:6px}
.segbtn{border:1px solid #e5e7eb;background:var(--card-bg);border-radius:999px;padding:6px 12px;cursor:pointer;color:var(--text)}
.segbtn.active{background:var(--chip-on);border-color:#c7d2fe}
.dark .segbtn{border-color:#334155;background:#1e293b}

/* 其他 */
.row{display:flex;gap:8px;align-items:center;justify-content:flex-end}
.mt{margin-top:12px}
.ok{color:#16a34a;margin-top:6px}
.err{color:#dc2626;margin-top:6px}

/* —— Dialog —— */
.dlg{border:none;padding:0;background:transparent}
.dlg-card{background:var(--card-bg);border:1px solid var(--border);border-radius:14px;padding:14px 16px;min-width:320px}

/* —— Toast & 動畫 —— */
.toast{position:fixed;right:16px;bottom:16px;background:#111827;color:#fff;padding:10px 14px;border-radius:10px;box-shadow:0 6px 18px rgba(0,0,0,.12);z-index:80}
.fade-enter-active,.fade-leave-active{transition:opacity .2s}
.fade-enter-from,.fade-leave-to{opacity:0}
@keyframes pop{from{transform:scale(.96);opacity:0}to{transform:scale(1);opacity:1}}

@media (max-width: 900px){
  .grid{grid-template-columns:1fr}
  .table{min-width:720px}
}
</style>
