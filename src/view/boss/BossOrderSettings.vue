<template>
  <section class="inv-page">
    <!-- 頁首 -->
    <header class="inv-header">
      <div class="title">員工訂單情況（老闆）</div>
      <div class="spacer"></div>
      <button class="btn ghost small" @click="exportJSON">匯出 JSON</button>
      <label class="btn ghost small file-btn">
        匯入 JSON
        <input type="file" accept="application/json" @change="importJSON">
      </label>
      <button class="icon-btn" title="頁面設定" @click="toast('尚未實作：頁面設定')">⚙</button>
    </header>

    <!-- 分頁 -->
    <div class="inv-tabs">
      <button :class="['tab', tab==='overview' && 'active']" @click="tab='overview'">訂單情況</button>
      <button :class="['tab', tab==='compose'  && 'active']" @click="tab='compose'">管理打單</button>
      <button :class="['tab', tab==='logs'     && 'active']" @click="tab='logs'">打單紀錄</button>
      <div class="spacer"></div>
    </div>

    <div class="inv-grid">
      <!-- 左欄（固定外觀） -->
      <aside class="inv-side">
        <div class="side-store">
          <div class="avatar">🏪</div>
          <div class="meta">
            <div class="name">{{ store.name }}</div>
            <div class="muted">ID：{{ store.id }}</div>
          </div>
          <button class="icon-btn" title="店家設定" @click="toast('尚未實作：店家設定')">⚙</button>
        </div>

        <div class="side-tools">
          <div class="search">
            <span>🔎</span>
            <input class="input" v-model.trim="qList" placeholder="搜尋草稿／待審核…">
          </div>
          <div class="row gap">
            <button class="btn primary w-full" @click="startManual()">＋ 新增手動打單</button>
          </div>
          <div class="chips">
            <button
              v-for="v in vendors" :key="v.id"
              class="chip"
              :class="{on: vendorFilter.has(v.id)}"
              @click="toggleVendorFilter(v.id)"
            >#{{ v.name }}</button>
          </div>
        </div>

        <!-- 草稿 / 待審核清單（左欄一致顯示，方便快速回編） -->
        <div class="side-list">
          <div
            v-for="o in filteredOrders"
            :key="o.id"
            class="side-item"
            :class="{active: o.id===selectedOrderId}"
            @click="openOrder(o.id)"
          >
            <div class="badge" :class="o.status">{{ statusText(o.status) }}</div>
            <div class="grow">
              <div class="name"><strong>{{ vendorName(o.vendorId) }}</strong></div>
              <div class="muted small">{{ o.date }}｜項目 {{ o.items.length }}</div>
            </div>
          </div>
          <p v-if="!filteredOrders.length" class="muted center">沒有草稿或待審核</p>
        </div>
      </aside>

      <!-- 右欄：依 tab 切換內容 -->
      <main class="inv-main card">
        <!-- ❶ 訂單情況（總覽） -->
        <template v-if="tab==='overview'">
          <div class="kpi-grid">
            <div class="kpi">
              <div class="kpi-title">今日總單數</div>
              <div class="kpi-value">{{ kpi.todayTotal }}</div>
            </div>
            <div class="kpi">
              <div class="kpi-title">待審核</div>
              <div class="kpi-value warn">{{ kpi.todayPending }}</div>
            </div>
            <div class="kpi">
              <div class="kpi-title">已核准</div>
              <div class="kpi-value ok">{{ kpi.todayApproved }}</div>
            </div>
            <div class="kpi">
              <div class="kpi-title">已送出</div>
              <div class="kpi-value">{{ kpi.todaySent }}</div>
            </div>
          </div>

          <div class="grid-2">
            <section class="card-lite">
              <h3 class="h3">來源排行（近 7 天）</h3>
              <div class="table-wrap">
                <table class="tbl">
                  <thead><tr><th>來源</th><th class="num">單數</th></tr></thead>
                  <tbody>
                    <tr v-for="r in topVendors" :key="r.id">
                      <td>{{ vendorName(r.id) }}</td>
                      <td class="num">{{ r.count }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section class="card-lite">
              <h3 class="h3">熱門品項（近 7 天）</h3>
              <div class="table-wrap">
                <table class="tbl">
                  <thead><tr><th>品項</th><th class="num">總數量</th></tr></thead>
                  <tbody>
                    <tr v-for="r in hotItems" :key="r.id">
                      <td>{{ ingredientName(r.id) }}</td>
                      <td class="num">{{ r.qty }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </template>

        <!-- ❷ 管理打單（含 AI/手動/設定/待審核） -->
        <template v-else-if="tab==='compose'">
          <div class="compose-head">
            <div class="seg">
              <button :class="['segbtn', mode==='ai' && 'active']" @click="mode='ai'">AI 自動建議</button>
              <button :class="['segbtn', mode==='manual' && 'active']" @click="mode='manual'">手動打單</button>
              <button :class="['segbtn', mode==='setup' && 'active']" @click="mode='setup'">來源／品項設定</button>
              <button :class="['segbtn', mode==='pending' && 'active']" @click="mode='pending'">待審核</button>
            </div>
            <div class="spacer"></div>
            <div class="row gap">
              <input type="date" class="input" v-model="ui.date">
              <select class="input" v-model="ui.vendorId">
                <option v-for="v in vendors" :key="v.id" :value="v.id">{{ v.name }}</option>
              </select>
              <select class="input" v-model="ui.storeId">
                <option v-for="s in stores" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
            </div>
          </div>

          <!-- === AI === -->
          <template v-if="mode==='ai'">
            <div class="ai-toolbar">
              <div class="row gap">
                <button class="btn" @click="runAI">重算建議</button>
                <div class="muted small">依 30 天銷售、星期別、天氣、節日、趨勢自動估算，可手動微調。</div>
              </div>
              <div class="spacer"></div>
              <div class="row gap">
                <button class="btn ghost small" @click="saveDraft('AI')">存成草稿</button>
                <button class="btn primary small" @click="submitOrder('AI')">直接生成</button>
              </div>
            </div>

            <div class="card-lite">
              <div class="flex-title">
                <h3 class="h3">建議清單（{{ ui.date }}）</h3>
                <div class="muted small">來源：{{ vendorName(ui.vendorId) }}</div>
              </div>

              <div class="table-wrap">
                <table class="tbl">
                  <thead>
                    <tr>
                      <th style="width:28px;"></th>
                      <th>品項</th>
                      <th class="num">現有庫存</th>
                      <th class="num">建議數量</th>
                      <th>影響因素</th>
                      <th class="num">調整後</th>
                      <th class="num">+ / −</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in aiRows" :key="row.id">
                      <td><label class="ck"><input type="checkbox" v-model="row.checked"><span></span></label></td>
                      <td>
                        <div class="item-cell">
                          <div class="name">{{ row.name }}</div>
                          <div class="muted tiny">單位：{{ row.unit }}</div>
                        </div>
                      </td>
                      <td class="num">{{ row.stock }}</td>
                      <td class="num"><strong>{{ row.suggest }}</strong></td>
                      <td class="reason"><div class="tags"><span class="pill" v-for="t in row.reasons" :key="t">{{ t }}</span></div></td>
                      <td class="num"><input type="number" min="0" class="input w90" v-model.number="row.finalQty"></td>
                      <td class="num">
                        <div class="row gap">
                          <button class="btn small" @click="row.finalQty = Math.max(0,(row.finalQty||0)+step(row))">＋</button>
                          <button class="btn small" @click="row.finalQty = Math.max(0,(row.finalQty||0)-step(row))">－</button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="row gap mt-8">
                <button class="btn" @click="selectAllAI(true)">全選</button>
                <button class="btn" @click="selectAllAI(false)">全不選</button>
                <div class="muted small">已選 {{ aiRows.filter(r=>r.checked).length }} 項</div>
                <div class="spacer"></div>
                <div class="muted small">合計：<strong>{{ sumAI }}</strong></div>
              </div>
            </div>
          </template>

          <!-- === 手動 === -->
          <template v-else-if="mode==='manual'">
            <div class="ai-toolbar">
              <div class="row gap">
                <input class="input w220" placeholder="搜尋可下單品項…" v-model.trim="qProduct">
                <button class="btn" @click="addAllFiltered()">加入篩選結果</button>
              </div>
              <div class="spacer"></div>
              <div class="row gap">
                <button class="btn ghost small" @click="saveDraft('MANUAL')">存成草稿</button>
                <button class="btn primary small" :disabled="!manualRows.length" @click="submitOrder('MANUAL')">直接生成</button>
              </div>
            </div>

            <div class="card-lite">
              <h3 class="h3">手動輸入</h3>
              <div class="table-wrap">
                <table class="tbl">
                  <thead><tr><th>品項</th><th class="num">現有庫存</th><th class="num">下單數量</th><th class="num">移除</th></tr></thead>
                  <tbody>
                    <tr v-for="row in manualRows" :key="row.id">
                      <td>
                        <div class="item-cell">
                          <div class="name">{{ row.name }}</div>
                          <div class="muted tiny">單位：{{ row.unit }}</div>
                        </div>
                      </td>
                      <td class="num">{{ row.stock }}</td>
                      <td class="num"><input type="number" min="0" class="input w90" v-model.number="row.qty"></td>
                      <td class="num"><button class="btn small" @click="removeManualRow(row.id)">刪</button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="row gap mt-8"><div class="muted small">合計：<strong>{{ sumManual }}</strong></div></div>
            </div>
          </template>

          <!-- === 設定 === -->
          <template v-else-if="mode==='setup'">
            <div class="card-lite">
              <h3 class="h3">來源／供應商</h3>
              <div class="row gap">
                <input class="input w220" placeholder="新增來源（如：中央廚房）" v-model.trim="newVendorName">
                <button class="btn" :disabled="!newVendorName" @click="createVendor">新增</button>
              </div>
              <div class="vendor-list mt-8">
                <div v-for="v in vendors" :key="v.id" class="vendor-card">
                  <div class="row gap">
                    <strong>{{ v.name }}</strong>
                    <button class="link" @click="renameVendor(v)">更名</button>
                    <button class="link danger" @click="removeVendor(v.id)">刪除</button>
                  </div>
                  <div class="muted tiny">可下單品項：{{ vendorProducts(v.id).length }} 項</div>
                  <div class="chips mt-8">
                    <button
                      v-for="it in ingredients" :key="it.id"
                      class="chip" :class="{on: v.productIds.includes(it.id)}"
                      @click="toggleProduct(v.id, it.id)"
                    >{{ it.name }}</button>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- === 待審核 === -->
          <template v-else>
            <div class="card-lite">
              <h3 class="h3">待審核訂單</h3>
              <div class="table-wrap">
                <table class="tbl">
                  <thead><tr><th>日期</th><th>來源</th><th class="num">品項數</th><th>狀態</th><th class="num">動作</th></tr></thead>
                  <tbody>
                    <tr v-for="o in orders.filter(x=>x.status==='pending')" :key="o.id">
                      <td>{{ o.date }}</td>
                      <td>{{ vendorName(o.vendorId) }}</td>
                      <td class="num">{{ o.items.length }}</td>
                      <td><span class="badge pending">待審核</span></td>
                      <td class="num">
                        <button class="btn small" @click="approveOrder(o.id)">核准</button>
                        <button class="btn small" @click="rejectOrder(o.id)">退回</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </template>
        </template>

        <!-- ❸ 打單紀錄 -->
        <template v-else>
          <div class="card-lite">
            <h3 class="h3">歷史紀錄</h3>
            <div class="row gap">
              <input type="date" class="input" v-model="logFilter.from">
              <input type="date" class="input" v-model="logFilter.to">
              <select class="input" v-model="logFilter.status">
                <option value="">全部狀態</option>
                <option value="draft">草稿</option>
                <option value="pending">待審核</option>
                <option value="approved">已核准</option>
                <option value="rejected">已退回</option>
                <option value="sent">已送出</option>
              </select>
              <select class="input" v-model="logFilter.vendorId">
                <option value="">全部來源</option>
                <option v-for="v in vendors" :key="v.id" :value="v.id">{{ v.name }}</option>
              </select>
              <div class="spacer"></div>
              <button class="btn ghost" @click="resetLogFilter">清空</button>
            </div>

            <div class="table-wrap mt-8">
              <table class="tbl">
                <thead>
                  <tr>
                    <th>日期</th><th>來源</th><th>門市</th><th>來源類型</th>
                    <th class="num">品項數</th><th>狀態</th><th class="num">操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="o in filteredLogs" :key="o.id">
                    <td>{{ o.date }}</td>
                    <td>{{ vendorName(o.vendorId) }}</td>
                    <td>{{ storeName(o.storeId) }}</td>
                    <td>{{ o.source==='AI' ? 'AI' : '手動' }}</td>
                    <td class="num">{{ o.items.length }}</td>
                    <td>
                      <span class="badge" :class="o.status">{{ statusText(o.status) }}</span>
                    </td>
                    <td class="num">
                      <button class="btn small" @click="o._open = !o._open">{{ o._open ? '收起' : '明細' }}</button>
                      <button v-if="o.status==='approved'" class="btn small" @click="sendOrder(o.id)">送出</button>
                    </td>
                  </tr>
                  <tr v-for="o in filteredLogs.filter(x=>x._open)" :key="o.id+'-detail'">
                    <td colspan="7">
                      <div class="chips">
                        <span v-for="it in o.items" :key="it.ingredientId" class="pill">
                          {{ ingredientName(it.ingredientId) }} × {{ it.qty }}
                        </span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>
      </main>
    </div>

    <transition name="fade"><div v-if="toastMsg" class="toast">{{ toastMsg }}</div></transition>
  </section>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
defineOptions({ name: 'BossOrderCenter' })

/* ========= 假資料（LocalStorage） ========= */
const store  = reactive({ name:'某某餐飲店', id:'123456789' })
const stores = reactive(loadStores())
const ingredients = reactive(loadIngredients())
const vendors = reactive(loadVendors())
const orders = reactive(loadOrders())

function rid(){ return crypto?.randomUUID?.() ?? 'id-' + Math.random().toString(36).slice(2,10) }
function today(){ const d=new Date(); return d.toISOString().slice(0,10) }

/* ========= 分頁狀態 ========= */
const tab = ref('compose')              // overview | compose | logs
const mode = ref('ai')                  // ai | manual | setup | pending
const ui = reactive({ date: today(), vendorId: vendors[0]?.id ?? '', storeId: stores[0]?.id ?? '' })

/* ========= 左欄列表（草稿/待審核） ========= */
const qList = ref('')
const vendorFilter = reactive(new Set())
const selectedOrderId = ref(null)
const filteredOrders = computed(()=>{
  const q = qList.value.trim()
  return orders
    .filter(o => (o.status==='draft' || o.status==='pending'))
    .filter(o => !vendorFilter.size || vendorFilter.has(o.vendorId))
    .filter(o => !q || vendorName(o.vendorId).includes(q) || o.date.includes(q))
    .sort((a,b)=> (a.date<b.date?1:-1))
})
function vendorName(id){ return vendors.find(v=>v.id===id)?.name ?? '（已刪除）' }
function storeName(id){ return stores.find(s=>s.id===id)?.name ?? '（已刪除）' }
function ingredientName(id){ return ingredients.find(i=>i.id===id)?.name ?? '（已刪除）' }
function toggleVendorFilter(id){ vendorFilter.has(id) ? vendorFilter.delete(id) : vendorFilter.add(id) }
function openOrder(id){
  const o = orders.find(x=>x.id===id); if (!o) return
  ui.vendorId=o.vendorId; ui.date=o.date; ui.storeId=o.storeId; mode.value='manual'; tab.value='compose'
  manualRows.splice(0)
  o.items.forEach(it=>{
    const ing = ingredients.find(x=>x.id===it.ingredientId)
    if (ing) manualRows.push({ id:ing.id, name:ing.name, unit:ing.unit, stock:ing.stock??0, qty:it.qty })
  })
  selectedOrderId.value = id
}

/* ========= 來源與品項設定 ========= */
const newVendorName = ref('')
function vendorProducts(vId){ return ingredients.filter(i => vendors.find(v=>v.id===vId)?.productIds.includes(i.id)) }
function toggleProduct(vId, ingId){
  const v = vendors.find(x=>x.id===vId); if (!v) return
  const i = v.productIds.indexOf(ingId)
  if (i>=0) v.productIds.splice(i,1); else v.productIds.push(ingId)
  save('vendors', vendors)
}
function createVendor(){ vendors.push({ id:rid(), name:newVendorName.value.trim(), productIds:[] }); newVendorName.value=''; save('vendors', vendors) }
function renameVendor(v){ const n=prompt('輸入新的來源名稱：', v.name); if(n&&n.trim()){ v.name=n.trim(); save('vendors', vendors) } }
function removeVendor(id){ if(!confirm('確定刪除此來源？僅影響之後下單。'))return; const i=vendors.findIndex(x=>x.id===id); if(i>=0) vendors.splice(i,1); save('vendors', vendors) }

/* ========= AI 推薦 ========= */
const aiRows = reactive([])
function runAI(){
  aiRows.splice(0)
  const v = vendors.find(x=>x.id===ui.vendorId)
  const list = (v?.productIds?.length ? v.productIds : ingredients.map(x=>x.id))
    .map(id => ingredients.find(i=>i.id===id)).filter(Boolean)
  const ctx = buildAIContext(ui.date)
  list.forEach(it=>{
    const base = avgLastNDays(it.id, 30)
    const wday = weekdayFactor(ui.date)
    const trend= trendFactor(it.id)
    const weather = weatherFactor(ctx.weather)
    const holiday = holidayFactor(ctx.holiday)
    const tag = tagFactor(it.tags)
    const demand = Math.max(0, Math.round(base*wday*trend*weather*holiday*tag))
    const safe = it.safeStock ?? 0
    const stock= it.stock ?? 0
    const suggest = Math.max(0, demand + safe - stock)
    aiRows.push({ id:it.id, name:it.name, unit:it.unit, stock, suggest, finalQty:suggest, checked:suggest>0, reasons:ctx.reasons })
  })
}
runAI()
function step(r){ return Math.max(1, Math.round((r.suggest || 1)*0.1)) }
const sumAI = computed(()=> aiRows.filter(r=>r.checked).reduce((s,r)=> s+(+r.finalQty||0),0))
function selectAllAI(on){ aiRows.forEach(r=> r.checked=!!on) }

/* AI 輔助函式 */
function avgLastNDays(ingId, n){ const arr=salesHistory(ingId,n); return arr.length? arr.reduce((s,x)=>s+x,0)/arr.length : 0 }
function salesHistory(ingId,n){ const out=[]; for(let i=1;i<=n;i++){ const day=strDateOffset(ui.date,-i); const seed=hash(`${ingId}-${day}`); const base=(seed%7)+3; const w=weekdayFactor(day); const h=holidayFactor(holidayOf(day)); out.push(Math.round(base*w*h)) } return out }
function weekdayFactor(d){ const w=new Date(d).getDay(); return w===0?1.15:w===6?1.1:1.0 }
function weatherFactor(w){ return w==='hot'?1.08:w==='cold'?0.95:w==='rainy'?0.92:1.0 }
function holidayFactor(h){ return h==='festival'?1.12:1.0 }
function tagFactor(tags=[]){ return tags?.length?1.03:1.0 }
function trendFactor(ingId){ const a=salesHistory(ingId,7).reduce((s,x)=>s+x,0); const b=salesHistory(ingId,14).slice(0,7).reduce((s,x)=>s+x,0); if(!b) return 1.0; const r=a/b; return r>1.1?1.06:r<0.9?0.96:1.0 }
function buildAIContext(d){ const weather=weatherOf(d); const holiday=holidayOf(d); const reasons=[`星期${'日一二三四五六'[new Date(d).getDay()]}`, weather==='sunny'?'晴朗':weather==='rainy'?'降雨':weather==='hot'?'高溫':weather==='cold'?'低溫':'—', holiday==='festival'?'節慶':'一般日']; return {weather,holiday,reasons} }
function weatherOf(d){ const s=hash('w-'+d)%4; return ['sunny','rainy','hot','cold'][s] }
function holidayOf(d){ const x=new Date(d).getDate(); return (x===1||x===15)?'festival':'none' }
function strDateOffset(d,off){ const x=new Date(d); x.setDate(x.getDate()+off); return x.toISOString().slice(0,10) }
function hash(s){ let h=0; for(let i=0;i<s.length;i++){ h=((h<<5)-h)+s.charCodeAt(i); h|=0 } return Math.abs(h) }

/* ========= 手動打單 ========= */
const qProduct = ref('')
const manualRows = reactive([])
const filteredProducts = computed(()=>{
  const v = vendors.find(x=>x.id===ui.vendorId)
  const ids = v?.productIds?.length ? new Set(v.productIds) : new Set(ingredients.map(i=>i.id))
  const q = qProduct.value.trim()
  return ingredients.filter(i=>ids.has(i.id)).filter(i=>!q || i.name.includes(q))
})
function addAllFiltered(){ filteredProducts.value.forEach(it=>{ if(!manualRows.some(r=>r.id===it.id)) manualRows.push({id:it.id,name:it.name,unit:it.unit,stock:it.stock??0,qty:0}) }) }
function removeManualRow(id){ const i=manualRows.findIndex(r=>r.id===id); if(i>=0) manualRows.splice(i,1) }
function startManual(){ tab.value='compose'; mode.value='manual'; manualRows.splice(0) }
const sumManual = computed(()=> manualRows.reduce((s,r)=> s+(+r.qty||0),0))

/* ========= 草稿／送審／審核／送出 ========= */
function saveDraft(source){
  const items = mode.value==='ai'
    ? aiRows.filter(r=>r.checked && (r.finalQty>0)).map(r=>({ ingredientId:r.id, qty:r.finalQty }))
    : manualRows.filter(r=>r.qty>0).map(r=>({ ingredientId:r.id, qty:r.qty }))
  const o = { id:rid(), date:ui.date, vendorId:ui.vendorId, storeId:ui.storeId, source, status:'draft', items }
  orders.unshift(o); save('orders', orders); toast('已存成草稿')
}
function submitOrder(source){
  const items = mode.value==='ai'
    ? aiRows.filter(r=>r.checked && (r.finalQty>0)).map(r=>({ ingredientId:r.id, qty:r.finalQty }))
    : manualRows.filter(r=>r.qty>0).map(r=>({ ingredientId:r.id, qty:r.qty }))
  if (!items.length) return toast('沒有可送出的品項')
  const o = { id:rid(), date:ui.date, vendorId:ui.vendorId, storeId:ui.storeId, source, status:'pending', items }
  orders.unshift(o); save('orders', orders); toast('已送審')
}
function approveOrder(id){ const o=orders.find(x=>x.id===id); if(!o) return; o.status='approved'; save('orders', orders); toast('已核准') }
function rejectOrder(id){ const o=orders.find(x=>x.id===id); if(!o) return; o.status='rejected'; save('orders', orders); toast('已退回') }
function sendOrder(id){ const o=orders.find(x=>x.id===id); if(!o) return; o.status='sent'; save('orders', orders); toast('已送出') }
function statusText(s){ return s==='draft'?'草稿':s==='pending'?'待審核':s==='approved'?'已核准':s==='rejected'?'已退回':'已送出' }

/* ========= 訂單情況（總覽 KPI 與排行） ========= */
const kpi = computed(()=>{
  const d=today()
  const todayOrders = orders.filter(o=>o.date===d)
  return {
    todayTotal: todayOrders.length,
    todayPending: todayOrders.filter(o=>o.status==='pending').length,
    todayApproved: todayOrders.filter(o=>o.status==='approved').length,
    todaySent: todayOrders.filter(o=>o.status==='sent').length
  }
})
const topVendors = computed(()=>{
  const since = strDateOffset(today(), -7)
  const map = new Map()
  orders.filter(o=>o.date>=since).forEach(o=> map.set(o.vendorId, (map.get(o.vendorId)||0)+1))
  return Array.from(map, ([id,count])=>({id,count})).sort((a,b)=>b.count-a.count).slice(0,6)
})
const hotItems = computed(()=>{
  const since = strDateOffset(today(), -7)
  const map = new Map()
  orders.filter(o=>o.date>=since).forEach(o=> o.items.forEach(it=> map.set(it.ingredientId, (map.get(it.ingredientId)||0)+it.qty)))
  return Array.from(map, ([id,qty])=>({id,qty})).sort((a,b)=>b.qty-a.qty).slice(0,6)
})

/* ========= 打單紀錄（篩選） ========= */
const logFilter = reactive({ from:'', to:'', status:'', vendorId:'' })
const filteredLogs = computed(()=>{
  return orders
    .filter(o => !logFilter.status || o.status===logFilter.status)
    .filter(o => !logFilter.vendorId || o.vendorId===logFilter.vendorId)
    .filter(o => !logFilter.from || o.date >= logFilter.from)
    .filter(o => !logFilter.to   || o.date <= logFilter.to)
    .sort((a,b)=> (a.date<b.date?1:-1))
})
function resetLogFilter(){ logFilter.from=''; logFilter.to=''; logFilter.status=''; logFilter.vendorId='' }

/* ========= 匯入／匯出 ========= */
function exportJSON(){ const data={vendors,orders}; const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='boss-orders.json'; a.click(); URL.revokeObjectURL(url) }
function importJSON(e){
  const f=e.target.files?.[0]; if(!f) return
  const reader=new FileReader()
  reader.onload=()=>{ try{ const obj=JSON.parse(String(reader.result)); if(obj.vendors){ vendors.splice(0); obj.vendors.forEach(v=>vendors.push(v)) } if(obj.orders){ orders.splice(0); obj.orders.forEach(o=>orders.push(o)) } save('vendors',vendors); save('orders',orders); toast('已匯入資料') }catch{ toast('匯入失敗：檔案格式錯誤') } }
  reader.readAsText(f,'utf-8')
}

/* ========= 假資料載入/儲存 ========= */
function loadStores(){ const raw=localStorage.getItem('boss-stores'); if(raw) try{ return JSON.parse(raw) }catch{} const s=[{id:rid(),name:'某某餐飲-總店'},{id:rid(),name:'某某餐飲-東門店'},{id:rid(),name:'某某餐飲-西門店'}]; localStorage.setItem('boss-stores',JSON.stringify(s)); return s }
function loadIngredients(){
  const raw=localStorage.getItem('boss-ingredients')
  if(raw) try{ const obj=JSON.parse(raw); obj.ingredients ||= obj; return obj.ingredients||[] }catch{}
  const ing=[{id:rid(),name:'大力士套餐',unit:'份',stock:10,safeStock:5},{id:rid(),name:'小力士套餐',unit:'份',stock:8,safeStock:3},{id:rid(),name:'高麗菜',unit:'顆',stock:6,safeStock:4},{id:rid(),name:'雞蛋',unit:'顆',stock:30,safeStock:10}]
  localStorage.setItem('boss-ingredients',JSON.stringify({ingredients:ing, tags:[]}))
  return ing
}
function loadVendors(){ const raw=localStorage.getItem('boss-vendors'); if(raw) try{ return JSON.parse(raw) }catch{} const v=[{id:rid(),name:'健康安養餐源',productIds:ingredients.map(i=>i.id).slice(0,3)},{id:rid(),name:'好好吃餐餐源',productIds:ingredients.map(i=>i.id).slice(1)},{id:rid(),name:'叉叉叉自選餐源',productIds:ingredients.map(i=>i.id)}]; localStorage.setItem('boss-vendors',JSON.stringify(v)); return v }
function loadOrders(){ const raw=localStorage.getItem('boss-orders'); if(raw) try{ return JSON.parse(raw) }catch{} return [] }
function save(key, data){ const k= key==='orders'?'boss-orders': key==='vendors'?'boss-vendors': key; localStorage.setItem(k, JSON.stringify(data)) }

/* ========= Toast ========= */
const toastMsg = ref(''); function toast(m){ toastMsg.value=m; setTimeout(()=>toastMsg.value='',1400) }
</script>

<style scoped>
/* 根容器：不使用 100vh，交給外層 .route-shell 控制滾動 */
.inv-page{ padding:16px; background:#f6f8fc; min-height:100%; height:auto; overflow:visible; }
.inv-header{ display:flex; align-items:center; gap:8px; margin-bottom:8px; }
.title{ font-size:20px; font-weight:800; }
.icon-btn{ border:none; background:transparent; cursor:pointer; font-size:18px; opacity:.85; }
.icon-btn:hover{ opacity:1; }
.spacer{ flex:1; }

/* Tabs */
.inv-tabs{ display:flex; align-items:center; gap:8px; margin-bottom:12px; }
.tab{ border:1px solid #e6eaf2; background:#fff; border-radius:10px; padding:8px 12px; cursor:pointer; }
.tab.active{ background:#e6f4ff; border-color:#cfe9ff; }
.btn{ border:1px solid #cfe0ff; background:#fff; color:#2563eb; border-radius:10px; padding:8px 12px; cursor:pointer; }
.btn.primary{ background:#2563eb; border-color:#2563eb; color:#fff; }
.btn.ghost{ border-color:#e6eaf2; color:#334155; background:#fff; }
.btn.small{ padding:6px 10px; }
.file-btn{ position:relative; overflow:hidden; }
.file-btn input{ position:absolute; inset:0; opacity:0; cursor:pointer; }

/* 兩欄 */
.inv-grid{ display:grid; grid-template-columns:320px 1fr; gap:12px; min-width:0; }
.inv-side{ background:#fff; border:1px solid #e6eaf2; border-radius:16px; overflow:hidden; }
.side-store{ display:flex; align-items:center; gap:12px; padding:12px; border-bottom:1px solid #f0f3f8; }
.avatar{ width:40px; height:40px; border-radius:50%; background:#eef2ff; display:grid; place-items:center; }
.meta{ flex:1; } .name{ font-weight:700; }
.side-tools{ display:flex; flex-direction:column; gap:10px; padding:10px; border-bottom:1px solid #f0f3f8; }
.search{ display:flex; align-items:center; gap:6px; border:1px solid #e6eaf2; border-radius:12px; padding:0 10px; min-height:38px; background:#fbfcff; }
.input{ border:none; outline:none; background:transparent; }
.row{ display:flex; align-items:center; }
.row.gap{ gap:8px; flex-wrap:wrap; }
.chips{ display:flex; gap:8px; flex-wrap:wrap; }
.chip{ border:1px solid #e6eaf2; border-radius:999px; background:#fff; padding:6px 10px; cursor:pointer; }
.chip.on{ background:#eef2ff; border-color:#c7d2fe; }
.side-list{ max-height:calc(100vh - 280px); overflow:auto; padding:10px; }
.side-item{ display:flex; gap:10px; align-items:center; border:1px solid #e6eaf2; border-radius:10px; padding:8px; margin-bottom:8px; cursor:pointer; background:#fff; }
.side-item.active{ outline:2px solid #9ec5ff; }
.badge{ display:inline-flex; align-items:center; justify-content:center; min-width:54px; height:24px; border-radius:999px; font-size:12px; padding:0 8px; border:1px solid #e2e8f0; background:#f8fafc; }
.badge.pending{ background:#fff7ed; border-color:#fed7aa; color:#9a3412; }
.badge.draft{ background:#eef2ff; border-color:#c7d2fe; color:#3730a3; }
.badge.approved{ background:#ecfeff; border-color:#bae6fd; color:#075985; }
.badge.rejected{ background:#fef2f2; border-color:#fecaca; color:#7f1d1d; }
.badge.sent{ background:#f0fdf4; border-color:#86efac; color:#166534; }

.card{ background:#fff; border:1px solid #e6eaf2; border-radius:16px; padding:12px; min-width:0; }
.card-lite{ border:1px dashed #e6eaf2; border-radius:12px; padding:12px; margin-bottom:12px; background:#fcfdff; }
.h3{ margin:4px 0 8px; }
.flex-title{ display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.mt-8{ margin-top:8px; }
.w-full{ width:100%; } .w220{ width:220px; } .w90{ width:90px; }

/* Compose head / Seg */
.compose-head{ display:flex; align-items:center; gap:8px; margin-bottom:8px; flex-wrap:wrap; }
.seg{ display:flex; gap:6px; }
.segbtn{ border:1px solid #e6eaf2; background:#fff; border-radius:10px; padding:6px 10px; cursor:pointer; }
.segbtn.active{ background:#e6f4ff; border-color:#cfe9ff; }

/* AI 工具列 & 表格 */
.ai-toolbar{ display:flex; align-items:center; gap:8px; margin-bottom:8px; flex-wrap:wrap; }
.table-wrap{ overflow:auto; border:1px solid #eef2f6; border-radius:12px; }
.tbl{ width:100%; border-collapse:collapse; min-width:780px; }
.tbl th, .tbl td{ padding:10px 12px; border-bottom:1px solid #f0f3f8; text-align:left; vertical-align:top; }
.tbl thead th{ position:sticky; top:0; background:#fafcff; z-index:1; }
.tbl .num{ text-align:right; }
.item-cell .name{ font-weight:600; }
.tiny{ font-size:11px; }
.tags{ display:flex; gap:6px; flex-wrap:wrap; }
.pill{ display:inline-flex; gap:4px; align-items:center; background:#eef2ff; border:1px solid #c7d2fe; border-radius:999px; padding:2px 8px; font-size:12px; }

/* KPI */
.kpi-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:12px; }
.kpi{ background:#fff; border:1px solid #e6eaf2; border-radius:14px; padding:16px; }
.kpi-title{ color:#64748b; font-size:13px; margin-bottom:6px; }
.kpi-value{ font-size:28px; font-weight:800; }
.kpi-value.ok{ color:#15803d; }
.kpi-value.warn{ color:#b45309; }

.ck input{ display:none; }
.ck span{ width:18px; height:18px; border:1px solid #cbd5e1; border-radius:4px; display:inline-block; background:#fff; position:relative; }
.ck input:checked + span::after{ content:''; position:absolute; inset:2px; background:#2563eb; border-radius:2px; }

/* RWD */
@media (max-width:1024px){
  .inv-grid{ grid-template-columns:1fr; }
  .side-list{ max-height:none; }
  .tbl{ min-width:640px; }
  .kpi-grid{ grid-template-columns:repeat(2,1fr); }
}
</style>
