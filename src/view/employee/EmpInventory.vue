<template>
  <section>
    <!-- 頁首工具列 -->
    <div class="main-head">
      <div class="h2">門市庫存</div>
      <div class="spacer"></div>
      <div style="display:flex;gap:6px;align-items:center">
        <input class="input sm" v-model.trim="q" placeholder="搜尋名稱或代碼…">
        <select class="input sm" v-model="status">
          <option value="">全部狀態</option>
          <option value="available">可用</option>
          <option value="low">缺貨</option>
          <option value="disabled">停售</option>
        </select>
        <button class="btn ghost small" @click="exportJSON">匯出</button>
        <label class="btn ghost small file-btn" v-can="'inventory.edit'">
          匯入 <input type="file" accept="application/json" @change="importJSON">
        </label>
      </div>
    </div>

    <div class="two-col">
      <!-- 左欄 -->
      <aside class="side" :class="{open:drawerOpen}">
        <div class="side-head">
          <div class="muted small">店面：{{ scope.storeName }}</div>
          <div class="chips" style="margin-top:8px">
            <button v-for="t in tags" :key="t.id" class="chip" :class="{on:selTags.has(t.id)}" @click="toggleTag(t.id)">#{{ t.name }}</button>
          </div>
          <div class="only-mobile" style="margin-top:8px">
            <button class="btn w100" v-can="'inventory.edit'" @click="createQuick()">＋ 新增品項</button>
          </div>
        </div>

        <div class="side-list">
          <div class="side-item" v-for="it in filtered" :key="it.id" :class="{active: it.id===selectedId}" @click="select(it.id)">
            <div class="thumb sm" :style="{ backgroundImage: `url(${it.image||placeholder})` }"></div>
            <div class="grow">
              <div style="font-weight:700">{{ it.name }}</div>
              <div class="muted small">狀態：{{ sText(it.status) }}｜安全庫存：{{ it.safeStock ?? '—' }}</div>
            </div>
          </div>
          <p v-if="!filtered.length" class="muted center">沒有符合的品項</p>
        </div>
      </aside>

      <transition name="fade"><div v-if="drawerOpen" class="backdrop" @click="drawerOpen=false"></div></transition>

      <!-- 右欄 -->
      <main class="card">
        <div class="main-head">
          <button class="icon-btn only-mobile" @click="drawerOpen=true">☰</button>
          <div class="h2">{{ cur ? '食材詳情' : '請從左側選取食材' }}</div>
          <div class="spacer"></div>
          <div style="display:flex;gap:8px" v-if="cur">
            <button class="btn" v-can="'inventory.edit'" @click="duplicate()">複製</button>
            <button class="btn danger" v-can="'inventory.edit'" @click="removeOne()">刪除</button>
            <button class="btn primary" v-can="'inventory.edit'" @click="save()">儲存</button>
          </div>
          <div v-else>
            <button class="btn primary" v-can="'inventory.edit'" @click="createQuick()">＋ 新增品項</button>
          </div>
        </div>

        <div v-if="!cur" class="center muted" style="padding:24px">
          📦 可從左側搜尋並點選品項
        </div>

        <div v-else style="display:grid;grid-template-columns:220px 1fr;gap:16px">
          <div>
            <div class="thumb" style="width:180px;height:135px;border-radius:12px" :style="{ backgroundImage: `url(${edit.image||placeholder})` }"></div>
            <label class="btn ghost small" style="margin-top:8px" v-can="'inventory.edit'">
              上傳圖片 <input type="file" accept="image/*" @change="pickImage">
            </label>
            <button class="btn ghost small" v-if="edit.image" v-can="'inventory.edit'" @click="edit.image=''">移除圖片</button>
          </div>

          <div>
            <div class="tr" style="border:none;padding:0 0 10px 0;gap:8px">
              <label class="muted" style="min-width:72px">名稱</label>
              <input class="input w100" v-model.trim="edit.name" :readonly="!canEdit" placeholder="食材名稱">
            </div>
            <div class="tr" style="border:none;padding:0 0 10px 0;gap:8px">
              <label class="muted" style="min-width:72px">代碼</label>
              <input class="input w100" v-model.trim="edit.code" :readonly="!canEdit" placeholder="條碼/自訂代碼">
            </div>
            <div class="tr" style="border:none;padding:0 0 10px 0;gap:8px;align-items:center">
              <label class="muted" style="min-width:72px">單位</label>
              <input class="input w120" v-model.trim="edit.unit" :readonly="!canEdit" placeholder="份、公斤…">
              <label class="muted" style="min-width:72px">安全庫存</label>
              <input class="input w120" type="number" min="0" v-model.number="edit.safeStock" :readonly="!canEdit">
            </div>
            <div class="tr" style="border:none;padding:0 0 10px 0;gap:8px;align-items:center">
              <label class="muted" style="min-width:72px">狀態</label>
              <button class="state-btn" :class="edit.status" @click="cycle()" :disabled="!canEdit">{{ sText(edit.status) }}</button>
            </div>
            <div class="tr" style="border:none;padding:0;gap:8px;align-items:flex-start">
              <label class="muted" style="min-width:72px">標籤</label>
              <div class="w100">
                <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px">
                  <span v-for="tid in edit.tags" :key="tid" style="display:inline-flex;align-items:center;gap:6px;background:#eef2ff;border:1px solid #c7d2fe;border-radius:999px;padding:2px 8px">
                    #{{ tagName(tid) }}
                    <button class="icon-btn" v-if="canEdit" @click="removeTag(tid)">✕</button>
                  </span>
                  <span v-if="!edit.tags.length" class="muted">尚未指定標籤</span>
                </div>
                <div v-if="canEdit" style="display:flex;gap:8px">
                  <select v-model="tagToAdd" class="input w200">
                    <option disabled value="">選擇標籤</option>
                    <option v-for="t in tags" :key="t.id" :value="t.id">#{{ t.name }}</option>
                  </select>
                  <button class="btn small" :disabled="!tagToAdd" @click="addTag()">加入</button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>

    <transition name="fade"><div v-if="toast" class="toast">{{ toast }}</div></transition>
  </section>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useScope } from '@/store/scope'
import { usePerm } from '@/store/perm'

const scope = useScope()
const { ensureLoaded, can } = usePerm(); ensureLoaded()
const canEdit = computed(()=> can('inventory.edit'))

const rid = ()=> 'id-' + Math.random().toString(36).slice(2,10)
const placeholder = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200">
    <rect width="100%" height="100%" fill="#eef2ff"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
      fill="#94a3b8" font-family="sans-serif" font-size="14">No Image</text></svg>`)

const drawerOpen = ref(false)
const q = ref(''); const status = ref('')
const selTags = reactive(new Set())
const tagToAdd = ref('')
const toast = ref(''); const tip = (m)=>{ toast.value=m; setTimeout(()=>toast.value='',1200) }
const sText = s => s==='available'?'可用': s==='low'?'缺貨':'停售'
const tagName = id => tags.value.find(t=>t.id===id)?.name ?? '（已刪除）'

/* 假資料（單店獨立存放） */
const db = reactive({ items:[], tags:[] })
function saveDB(){ localStorage.setItem(`emp-inv-${scope.storeId}`, JSON.stringify(db)) }
function loadDB(){
  const raw = localStorage.getItem(`emp-inv-${scope.storeId}`)
  if (raw){ try{ Object.assign(db, JSON.parse(raw)); return }catch{ localStorage.removeItem(`emp-inv-${scope.storeId}`) } }
  db.tags = [{id:rid(),name:'生鮮'},{id:rid(),name:'冷凍'},{id:rid(),name:'蔬菜'}]
  db.items = [
    { id:rid(), name:'新鮮雞腿', code:'CK-001', unit:'份', safeStock:10, status:'available', tags:[db.tags[0].id], image:'' },
    { id:rid(), name:'新鮮豬腿', code:'PK-002', unit:'公斤', safeStock:8,  status:'low',       tags:[db.tags[0].id], image:'' },
    { id:rid(), name:'高麗菜',   code:'VE-010', unit:'顆', safeStock:6,  status:'available', tags:[db.tags[2].id], image:'' },
  ]
  saveDB()
}
const tags = computed(()=> db.tags)
const filtered = computed(()=>{
  const kw = q.value.trim()
  return db.items
    .filter(it => !status.value || it.status===status.value)
    .filter(it => !selTags.size || it.tags.some(tid=>selTags.has(tid)))
    .filter(it => !kw || it.name.includes(kw) || (it.code||'').includes(kw))
})

const selectedId = ref(null)
const cur = computed(()=> db.items.find(x=>x.id===selectedId.value) || null)
const edit = reactive({})

function select(id){
  selectedId.value = id
  const src = db.items.find(x=>x.id===id)
  if (src) Object.assign(edit, JSON.parse(JSON.stringify(src)))
  drawerOpen.value=false
}
function createQuick(){
  if (!canEdit.value) return
  const t = { id:rid(), name:'新食材', code:'', unit:'份', safeStock:0, status:'available', tags:[], image:'' }
  db.items.unshift(t); saveDB(); select(t.id); tip('已新增品項')
}
function cycle(){
  if (!canEdit.value) return
  edit.status = edit.status==='available'?'low': edit.status==='low'?'disabled':'available'
}
function addTag(){
  if (!canEdit.value) return
  if (!tagToAdd.value) return
  if (!edit.tags.includes(tagToAdd.value)) edit.tags.push(tagToAdd.value)
  tagToAdd.value=''
}
function removeTag(id){
  if (!canEdit.value) return
  edit.tags = edit.tags.filter(x=>x!==id)
}
function duplicate(){
  if (!canEdit.value || !cur.value) return
  const copy = JSON.parse(JSON.stringify(edit)); copy.id = rid(); copy.name += '（複製）'
  db.items.unshift(copy); saveDB(); select(copy.id); tip('已複製')
}
function removeOne(){
  if (!canEdit.value || !cur.value) return
  if (!confirm(`刪除「${cur.value.name}」？`)) return
  db.items = db.items.filter(x=>x.id!==cur.value.id)
  saveDB(); selectedId.value=null; Object.keys(edit).forEach(k=>delete edit[k]); tip('已刪除')
}
function save(){
  if (!canEdit.value) return
  if (!edit.name?.trim()) return tip('請輸入名稱')
  const i = db.items.findIndex(x=>x.id===edit.id)
  if (i>=0) db.items[i] = JSON.parse(JSON.stringify(edit))
  saveDB(); tip('已儲存')
}

function toggleTag(id){ selTags.has(id) ? selTags.delete(id) : selTags.add(id) }
function pickImage(e){
  const f = e.target.files?.[0]; if(!f) return
  const fr = new FileReader(); fr.onload=()=>{ edit.image=String(fr.result) }; fr.readAsDataURL(f)
}

function exportJSON(){
  const blob = new Blob([JSON.stringify(db,null,2)],{type:'application/json'})
  const url = URL.createObjectURL(blob); const a=document.createElement('a')
  a.href=url; a.download=`emp-inv-${scope.storeId}.json`; a.click(); URL.revokeObjectURL(url)
}
function importJSON(e){
  if (!canEdit.value) return
  const f = e.target.files?.[0]; if(!f) return
  const r = new FileReader()
  r.onload=()=>{
    try{
      const obj = JSON.parse(String(r.result))
      if (!obj || !Array.isArray(obj.items) || !Array.isArray(obj.tags)) throw new Error()
      db.items = obj.items; db.tags = obj.tags; saveDB(); tip('已匯入')
    }catch{ tip('匯入失敗：格式錯誤') }
  }
  r.readAsText(f,'utf-8')
}

onMounted(()=> loadDB())
</script>
