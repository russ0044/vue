<template>
  <section class="inv-page">
    <!-- 頁首 -->
    <header class="inv-header">
      <div class="title">生成邀請碼（老闆）</div>
      <div class="spacer"></div>
    </header>

    <div class="inv-grid">
      <!-- 左欄 -->
      <aside class="inv-side">
        <div class="side-tools">
          <div class="search">
            <span>🔎</span>
            <input class="input bare" v-model.trim="q" placeholder="搜尋代碼／備註…">
          </div>

          <div class="row gap">
            <button class="btn primary w-full" @click="openQuick">＋ 產生邀請碼</button>
          </div>

          <div class="chips">
            <button class="chip" :class="{on: statusFilter.has('active')}"   @click="toggle(statusFilter,'active')">#啟用中</button>
            <button class="chip" :class="{on: statusFilter.has('revoked')}"  @click="toggle(statusFilter,'revoked')">#已撤銷</button>
            <button class="chip" :class="{on: statusFilter.has('expired')}"  @click="toggle(statusFilter,'expired')">#已到期</button>
            <button class="chip" :class="{on: statusFilter.has('used')}"     @click="toggle(statusFilter,'used')">#已用罄</button>
          </div>

          <div class="chips">
            <button
              v-for="r in ROLES" :key="r.id"
              class="chip"
              :class="{on: roleFilter.has(r.id)}"
              @click="toggle(roleFilter, r.id)"
            >#{{ r.name }}</button>
          </div>
        </div>

        <div class="side-list">
          <div
            v-for="c in filteredCodes"
            :key="c.id"
            class="side-item"
            :class="{active: c.id===editing.id}"
            @click="selectCode(c.id)"
          >
            <div class="badge" :class="resolveStatus(c)">{{ statusText(resolveStatus(c)) }}</div>
            <div class="grow">
              <div class="name ell"><strong>{{ c.code }}</strong></div>
              <div class="muted small ell">
                {{ roleName(c.role) }}｜可用 {{ c.usesLeft }}/{{ c.usesAllowed }}｜{{ c.expiresAt ? ('到期 '+c.expiresAt) : '永不過期' }}
              </div>
              <div class="muted tiny ell" v-if="c.note">{{ c.note }}</div>
            </div>
          </div>
          <p v-if="!filteredCodes.length" class="muted center">沒有符合的邀請碼</p>
        </div>
      </aside>

      <!-- 右欄：編輯器 -->
      <main class="inv-main card">
        <div class="editor-head">
          <div class="left">
            <div class="title">{{ editing.id ? '編輯邀請碼' : '產生邀請碼' }}</div>
          </div>
          <div class="spacer"></div>
          <div class="row gap">
            <button v-if="editing.id" class="btn danger" @click="removeCode">刪除</button>
            <button class="btn" @click="revert">還原</button>
            <button class="btn primary" :disabled="!canSave" @click="save">儲存</button>
          </div>
        </div>

        <div class="form-cols">
          <!-- 基本設定 -->
          <section class="card-lite">
            <h3 class="h3">基本設定</h3>
            <div class="row gap">
              <label class="label">邀請碼</label>
              <input class="input w220" v-model.trim="editing.code" placeholder="自動產生或自訂">
              <button class="btn" @click="regenCode">重新產生</button>
              <button class="btn" @click="copy(editing.code)">複製代碼</button>
              <button class="btn" @click="copy(inviteLink)">複製連結</button>
            </div>
            <div class="row gap mt-8">
              <label class="label">到期日</label>
              <input type="date" class="input" v-model="editing.expiresAt">
              <label class="label">可用次數</label>
              <input type="number" min="1" class="input w120" v-model.number="editing.usesAllowed">
              <div class="muted small">剩餘 {{ editing.usesLeft }}</div>
            </div>
            <div class="row gap mt-8">
              <label class="label">備註</label>
              <input class="input grow" v-model.trim="editing.note" placeholder="給管理者看的描述…">
            </div>
            <div class="row gap mt-8">
              <label class="label">限制 Email 網域</label>
              <input class="input w220" v-model.trim="editing.emailDomain" placeholder="如 example.com（可留空）">
              <label class="chk ml12"><input type="checkbox" v-model="editing.oneTimeUse"><span></span></label>
              <span class="muted">每位使用者限用一次（建議勾選）</span>
            </div>
          </section>

          <!-- 分配與權限 -->
          <section class="card-lite">
            <h3 class="h3">分配與權限</h3>
            <div class="row gap">
              <label class="label">身分</label>
              <select class="input w220" v-model="editing.role">
                <option v-for="r in ROLES" :key="r.id" :value="r.id">{{ r.name }}</option>
              </select>

              <label class="label">套用權限模板</label>
              <select class="input w220" v-model="presetId" @change="applyPreset">
                <option value="">選擇模板</option>
                <option v-for="p in presets" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
              <input class="input w220" placeholder="新增模板名稱" v-model.trim="newPresetName">
              <button class="btn" :disabled="!newPresetName" @click="createPreset">＋ 新增模板</button>
            </div>

            <div class="row gap mt-8">
              <label class="label">店面指派</label>
              <div class="chips grow">
                <button
                  v-for="s in stores" :key="s.id"
                  class="chip"
                  :class="{on: editing.storeIds.includes(s.id)}"
                  @click="toggleStore(s.id)"
                >{{ s.name }}</button>
              </div>
            </div>

            <div class="perm-grid mt-8">
              <label class="perm" v-for="p in PERMS" :key="p.key">
                <input type="checkbox" v-model="editing.permissions[p.key]"> <span>{{ p.name }}</span>
              </label>
            </div>
          </section>

          <!-- 批次與進階 -->
          <section class="card-lite">
            <h3 class="h3">批次與進階</h3>
            <div class="row gap">
              <label class="label">批次數量</label>
              <input class="input w120" type="number" min="1" v-model.number="batchQty">
              <button class="btn" @click="batchGenerate">＋ 批次生成</button>
              <div class="muted small">批次會使用目前設定（權限/店面/限制等）</div>
            </div>
            <div class="row gap mt-8">
              <button class="btn ghost small" @click="usesMinus">手動扣次（模擬被使用）</button>
              <button class="btn ghost small" @click="toggleRevoke">
                {{ resolveStatus(editing)==='revoked' ? '恢復啟用' : '撤銷邀請碼' }}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>

    <!-- 快速產生 -->
    <transition name="fade">
      <div v-if="quickOpenFlag" class="modal" @click.self="quickOpenFlag=false">
        <div class="sheet">
          <div class="sheet-head">
            <div class="title sm">快速產生邀請碼</div>
            <button class="icon-btn" @click="quickOpenFlag=false">✕</button>
          </div>

          <div class="sheet-body">
            <div class="row gap">
              <label class="label">作用範圍</label>
              <div class="seg">
                <button :class="['segbtn', quick.scope==='all' && 'active']" @click="quick.scope='all'">全部店面</button>
                <button :class="['segbtn', quick.scope==='custom' && 'active']" @click="quick.scope='custom'">指定店面</button>
              </div>
            </div>

            <div v-if="quick.scope==='custom'" class="row gap mt-8">
              <label class="label">選擇店面</label>
              <div class="chips grow">
                <button
                  v-for="s in stores" :key="s.id"
                  class="chip"
                  :class="{on: quick.storeIds.includes(s.id)}"
                  @click="toggleQuickStore(s.id)"
                >{{ s.name }}</button>
              </div>
            </div>

            <div class="row gap mt-8">
              <label class="label">身分</label>
              <select class="input w220" v-model="quick.role">
                <option v-for="r in ROLES" :key="r.id" :value="r.id">{{ r.name }}</option>
              </select>

              <label class="label">權限模板</label>
              <select class="input w220" v-model="quick.presetId">
                <option value="">（不套用）</option>
                <option v-for="p in presets" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
            </div>

            <div class="row gap mt-8">
              <label class="label">到期日</label>
              <input type="date" class="input" v-model="quick.expiresAt">
              <label class="label">可用次數</label>
              <input type="number" min="1" class="input w120" v-model.number="quick.usesAllowed">
            </div>

            <div class="row gap mt-8">
              <label class="label">備註</label>
              <input class="input grow" v-model.trim="quick.note" placeholder="（可留空）">
            </div>
          </div>

          <div class="sheet-foot">
            <div class="spacer"></div>
            <button class="btn" @click="quickOpenFlag=false">取消</button>
            <button class="btn primary" @click="confirmQuick">建立</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 匯出／匯入 -->
    <div class="bottom card">
      <div class="row gap">
        <button class="btn ghost" @click="onExport">匯出 JSON</button>
        <label class="btn ghost file-btn">
          匯入 JSON
          <input type="file" accept="application/json" @change="onImport">
        </label>
      </div>
    </div>

    <transition name="fade"><div v-if="toastMsg" class="toast">{{ toastMsg }}</div></transition>
  </section>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import {
  listStores, listPresets, createPresetService,
  listInvites, createInvite, updateInvite, deleteInvite,
  bulkCreateInvites, exportAll, importAll,
  genCodeService, todayStr
} from '@/services/inviteService'

defineOptions({ name:'BossInvite' })

/* 權限 & 角色 */
const PERMS = [
  { key:'inventory.view',  name:'庫存：查看' },
  { key:'inventory.edit',  name:'庫存：編輯' },
  { key:'orders.create',   name:'訂單：建立/送出' },
  { key:'orders.approve',  name:'訂單：審核' },
  { key:'alerts.manage',   name:'警示門檻設定' },
  { key:'reports.view',    name:'報表：查看' },
  { key:'roles.manage',    name:'權限/邀請碼管理' },
]
const ROLES = [
  { id:'employee', name:'員工' },
  { id:'manager',  name:'店長' },
  { id:'ck',       name:'中央廚房' },
  { id:'custom',   name:'自訂' },
]

/* 狀態 */
const stores  = ref([])
const presets = ref([])
const codes   = ref([])

const q = ref('')
const statusFilter = reactive(new Set())
const roleFilter   = reactive(new Set())

const blank = () => ({
  id:null, code:'', createdAt:todayStr(),
  expiresAt:'', usesAllowed:1, usesLeft:1,
  note:'', emailDomain:'', oneTimeUse:true,
  role:'employee', storeIds:[],
  permissions: PERMS.reduce((o,p)=> (o[p.key]=false,o),{}),
  revoked:false
})
const editing = reactive(blank())
const snap = ref(null)
const presetId = ref('')
const newPresetName = ref('')
const batchQty = ref(5)

const inviteLink = computed(()=>{
  const origin = location?.origin || ''
  return `${origin}/signup?code=${encodeURIComponent(editing.code || '')}`
})

onMounted(async ()=>{
  stores.value  = await listStores()
  presets.value = await listPresets()
  codes.value   = await listInvites()
  createNew()
})

/* 左欄過濾 */
const filteredCodes = computed(()=>{
  const kw = q.value.trim()
  return codes.value
    .filter(c => !statusFilter.size || statusFilter.has(resolveStatus(c)))
    .filter(c => !roleFilter.size   || roleFilter.has(c.role))
    .filter(c => !kw || c.code.includes(kw) || (c.note||'').includes(kw))
    .sort((a,b)=> (a.createdAt < b.createdAt ? 1 : -1))
})
function toggle(set,v){ set.has(v)? set.delete(v) : set.add(v) }

/* 工具 */
function roleName(id){ return ROLES.find(r=>r.id===id)?.name ?? '—' }
function statusText(s){ return s==='active'?'啟用中':s==='revoked'?'已撤銷':s==='expired'?'已到期':'已用罄' }
function resolveStatus(c){
  const now = todayStr()
  if (c.revoked) return 'revoked'
  if (c.expiresAt && c.expiresAt < now) return 'expired'
  if (c.usesLeft <= 0) return 'used'
  return 'active'
}
function copy(t){ if(!t) return; navigator.clipboard?.writeText(String(t)); toast('已複製到剪貼簿') }
const toastMsg = ref(''); function toast(m){ toastMsg.value=m; setTimeout(()=>toastMsg.value='',1400) }

/* 編輯流程 */
function createNew(){
  Object.assign(editing, blank())
  editing.code = genCodeService()
  snap.value = JSON.parse(JSON.stringify(editing))
}
function selectCode(id){
  const c = codes.value.find(x=>x.id===id); if(!c) return
  Object.assign(editing, JSON.parse(JSON.stringify(c)))
  snap.value = JSON.parse(JSON.stringify(editing))
}
function revert(){ if (snap.value) Object.assign(editing, JSON.parse(JSON.stringify(snap.value))) }
const canSave = computed(()=> !!editing.code?.trim())
function regenCode(){ editing.code = genCodeService() }

/* 店面 / 模板 */
function toggleStore(id){
  const i = editing.storeIds.indexOf(id)
  if (i>=0) editing.storeIds.splice(i,1); else editing.storeIds.push(id)
}
function applyPreset(){
  const p = presets.value.find(x=>x.id===presetId.value); if(!p) return
  editing.permissions = JSON.parse(JSON.stringify(p.permissions))
  if (p.defaultRole) editing.role = p.defaultRole
}
async function createPreset(){
  const name = newPresetName.value.trim(); if(!name) return
  const p = await createPresetService({
    name,
    defaultRole: editing.role,
    permissions: JSON.parse(JSON.stringify(editing.permissions))
  })
  presets.value.unshift(p)
  newPresetName.value=''
  toast('已建立模板')
}

/* CRUD */
async function save(){
  if (!editing.id){
    const created = await createInvite(JSON.parse(JSON.stringify(editing)))
    codes.value.unshift(created)
    toast('已新增邀請碼')
  }else{
    const updated = await updateInvite(editing.id, JSON.parse(JSON.stringify(editing)))
    const i = codes.value.findIndex(x=>x.id===updated.id)
    if (i>=0) codes.value[i] = updated
    toast('已更新邀請碼')
  }
  snap.value = JSON.parse(JSON.stringify(editing))
}
async function removeCode(){
  if (!editing.id) return
  if (!confirm(`刪除邀請碼 ${editing.code}？`)) return
  await deleteInvite(editing.id)
  codes.value = codes.value.filter(x=>x.id!==editing.id)
  createNew()
  toast('已刪除')
}
async function toggleRevoke(){ editing.revoked=!editing.revoked; await save() }
async function usesMinus(){ if (editing.usesLeft>0) editing.usesLeft--; await save() }
async function batchGenerate(){
  const n = Math.max(1, Number(batchQty.value)||1)
  const base = JSON.parse(JSON.stringify(editing))
  const created = await bulkCreateInvites(base, n)
  codes.value.unshift(...created)
  toast(`已生成 ${n} 組邀請碼`)
}

/* 匯出／匯入 */
async function onExport(){
  const blob = await exportAll()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href=url; a.download='invite-codes.json'; a.click()
  URL.revokeObjectURL(url)
}
async function onImport(e){
  const f = e.target.files?.[0]; if(!f) return
  try{
    const text = await f.text()
    await importAll(text)
    presets.value = await listPresets()
    codes.value   = await listInvites()
    toast('已匯入資料')
  }catch{ toast('匯入失敗：格式錯誤') }
}

/* 快速產生（彈窗） */
const quickOpenFlag = ref(false)
const quick = reactive({
  scope:'all', storeIds:[], role:'employee', presetId:'',
  expiresAt:'', usesAllowed:1, note:''
})
function openQuick(){
  quickOpenFlag.value = true
  quick.scope='all'; quick.storeIds=[]
  quick.role='employee'; quick.presetId=''
  quick.expiresAt=''; quick.usesAllowed=1; quick.note=''
}
function toggleQuickStore(id){
  const i = quick.storeIds.indexOf(id)
  if (i>=0) quick.storeIds.splice(i,1); else quick.storeIds.push(id)
}
async function confirmQuick(){
  const storeIds = quick.scope==='all' ? stores.value.map(s=>s.id) : [...quick.storeIds]
  let perms = PERMS.reduce((o,p)=> (o[p.key]=false,o),{})
  const p = presets.value.find(x=>x.id===quick.presetId)
  if (p) perms = JSON.parse(JSON.stringify(p.permissions))
  const created = await createInvite({
    id:null,
    code: genCodeService(),
    createdAt: todayStr(),
    expiresAt: quick.expiresAt || '',
    usesAllowed: Number(quick.usesAllowed) || 1,
    usesLeft: Number(quick.usesAllowed) || 1,
    note: quick.note || '',
    emailDomain: '',
    oneTimeUse: true,
    role: quick.role,
    storeIds,
    permissions: perms,
    revoked:false
  })
  codes.value.unshift(created)
  selectCode(created.id)
  quickOpenFlag.value = false
  toast('已建立邀請碼')
}
</script>

<style scoped>
/* 容器與骨架（全部吃 theme 變數） */
.inv-page{
  padding:16px;
  background: var(--bg);
  color: var(--text);
  min-height:100%;
  height:auto;
  overflow:visible;
}
.inv-header{ display:flex; align-items:center; gap:8px; margin-bottom:8px; }
.title{ font-size:20px; font-weight:800; }
.title.sm{ font-size:16px; font-weight:800; }
.spacer{ flex:1; }

/* 兩欄 */
.inv-grid{ display:grid; grid-template-columns:320px 1fr; gap:12px; min-width:0; }
.inv-side{
  background: var(--card-bg);
  border:1px solid var(--border);
  border-radius:16px; overflow:hidden;
}
.side-tools{ display:flex; flex-direction:column; gap:10px; padding:10px; border-bottom:1px solid var(--border); }
.search{
  display:flex; align-items:center; gap:6px;
  border:1px solid var(--border);
  border-radius:12px; padding:0 10px; min-height:38px; background: var(--card-bg);
}
.input.bare{ border:none; outline:none; background:transparent; color: var(--text); }
.row{ display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.chips{ display:flex; gap:8px; flex-wrap:wrap; }
.chip{
  border:1px solid var(--border); border-radius:999px; background: var(--card-bg);
  color: var(--text); padding:6px 10px; cursor:pointer;
}
.chip.on{
  background: var(--primary-weak);
  border-color: var(--primary);
  color: var(--primary);
}
.side-list{ max-height:calc(100vh - 280px); overflow:auto; padding:10px; }
.side-item{
  display:flex; gap:10px; align-items:center;
  border:1px solid var(--border); border-radius:10px; padding:8px; margin-bottom:8px;
  cursor:pointer; background: var(--card-bg); color: var(--text);
}
.side-item.active{ outline:2px solid var(--primary); }

/* 右欄卡片 */
.card{
  background: var(--card-bg);
  border:1px solid var(--border);
  border-radius:16px; padding:12px; min-width:0;
}
.card-lite{
  border:1px dashed var(--border);
  border-radius:12px; padding:12px; margin-bottom:12px; background: var(--card-bg);
}
.h3{ margin:4px 0 8px; }
.label{ min-width:90px; color: var(--muted); }
.mt-8{ margin-top:8px; }
.ml12{ margin-left:12px; }
.w220{ width:220px; } .w120{ width:120px; } .w-full{ width:100%; }

.editor-head{ display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
.form-cols{ display:grid; grid-template-columns:1fr; gap:12px; }

.perm-grid{ display:grid; grid-template-columns:repeat(3, minmax(200px, 1fr)); gap:8px; }
.perm{
  display:flex; align-items:center; gap:8px; padding:8px 10px;
  border:1px solid var(--border); border-radius:10px; background: var(--card-bg); color: var(--text);
}

/* Seg */
.seg{ display:flex; gap:6px }
.segbtn{
  border:1px solid var(--border); background: var(--card-bg); color: var(--text);
  border-radius:10px; padding:6px 10px; cursor:pointer;
}
.segbtn.active{ background: var(--primary-weak); border-color: var(--primary); color: var(--primary); }

/* 徽章（狀態配色保留語意色） */
.badge{
  display:inline-flex; align-items:center; justify-content:center;
  min-width:54px; height:24px; border-radius:999px; font-size:12px; padding:0 8px;
  border:1px solid var(--border); background: var(--hover-bg); color: var(--text);
}
.badge.active{ background:#f0fdf4; border-color:#86efac; color:#166534; }
.badge.revoked{ background:#fef2f2; border-color:#fecaca; color:#7f1d1d; }
.badge.expired{ background:#fff7ed; border-color:#fed7aa; color:#9a3412; }
.badge.used{ background:#eef2ff; border-color:#c7d2fe; color:#3730a3; }

/* 底部工具列（匯出／匯入） */
.bottom{
  max-width:1200px; margin:12px auto 0;
  background: var(--card-bg); border:1px solid var(--border); border-radius:16px; padding:12px;
}
.file-btn{ position:relative; overflow:hidden }
.file-btn input{ position:absolute; inset:0; opacity:0; cursor:pointer }

/* 表單元件與按鈕（吃 theme 變數） */
.input{
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--card-bg);
  color: var(--text);
}
.btn{
  border:1px solid var(--primary);
  background: var(--card-bg);
  color: var(--primary);
  border-radius:10px; padding:8px 12px; cursor:pointer
}
.btn.primary{ background: var(--primary); border-color: var(--primary); color:#fff }
.btn.ghost{ border-color: var(--border); color: var(--text); background: var(--card-bg) }
.btn.small{ padding:6px 10px }
.btn.danger{ border-color:#fecaca; color:#b91c1c; background: var(--card-bg) }

/* Modal */
.modal{ position:fixed; inset:0; background:rgba(0,0,0,.28); display:grid; place-items:center; z-index:60; padding:20px }
.sheet{
  width:min(720px, 96vw); background: var(--card-bg); color: var(--text);
  border-radius:16px; border:1px solid var(--border); box-shadow:0 8px 30px rgba(0,0,0,.12); overflow:hidden
}
.sheet-head{ display:flex; align-items:center; justify-content:space-between; padding:12px 14px; border-bottom:1px solid var(--border) }
.sheet-body{ padding:14px }
.sheet-foot{ padding:12px 14px; border-top:1px solid var(--border); display:flex; align-items:center; gap:8px }

/* 勾選框 */
.chk input{ display:none; }
.chk span{
  width:18px; height:18px; border:1px solid var(--border); border-radius:4px; display:inline-block;
  background: var(--card-bg); position:relative;
}
.chk input:checked + span::after{ content:''; position:absolute; inset:2px; background: var(--primary); border-radius:2px; }

/* 其他 */
.muted{ color: var(--muted); } .tiny{ font-size:11px; }
.center{ text-align:center; }
.ell{ white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

/* RWD */
@media (max-width:1024px){
  .inv-grid{ grid-template-columns:1fr; }
  .side-list{ max-height:none; }
  .perm-grid{ grid-template-columns:repeat(2, minmax(160px,1fr)); }
}
</style>
