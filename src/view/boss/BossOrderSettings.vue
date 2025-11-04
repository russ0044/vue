<template>
  <section class="inv-page">
    <!-- 頁首 -->
    <header class="inv-header">
      <div class="title">員工訂單中心</div>

      <div class="spacer"></div>

      <!-- KPI 一句 summary（手機時會自動換行） -->
      <div class="today-hint muted small">
        今日：待審核 {{ kpi.todayPending }} 單｜已核准 {{ kpi.todayApproved }} 單
      </div>
    </header>

    <!-- 頂部分頁 -->
    <div class="inv-tabs">
      <button :class="['tab', tab==='overview' && 'active']" @click="tab='overview'">訂單情況</button>
      <button :class="['tab', tab==='compose'  && 'active']" @click="tab='compose'">管理打單</button>
      <button :class="['tab', tab==='logs'     && 'active']" @click="tab='logs'">打單紀錄</button>
      <div class="spacer"></div>
    </div>

    <div class="inv-grid">
      <!-- 左欄：訂單草稿 / 待審核清單 -->
      <aside class="inv-side">
        <!-- 搜尋與篩選 -->
        <div class="side-tools">
          <div class="search">
            <span>🔎</span>
            <input
              class="input bare"
              v-model.trim="qList"
              placeholder="搜尋來源或日期… (草稿 / 待審核)"
            />
          </div>

          <div class="chips">
            <button
              v-for="v in vendors"
              :key="v.id"
              class="chip"
              :class="{ on: vendorFilter.has(v.id) }"
              @click="toggleVendorFilter(v.id)"
            >#{{ v.name }}</button>
          </div>

          <div class="side-actions row gap">
            <button class="btn primary w-full" @click="startManual()">＋ 新增手動打單</button>
          </div>
        </div>

        <!-- 草稿 / 待審核 列表 -->
        <div class="side-list">
          <div
            v-for="o in filteredOrders"
            :key="o.id"
            class="side-item"
            :class="{active: o.id===selectedOrderId}"
            @click="openOrder(o.id)"
          >
            <div class="left-col">
              <div class="badge" :class="o.status">{{ statusText(o.status) }}</div>
            </div>

            <div class="grow">
              <div class="row top-row">
                <strong>{{ vendorName(o.vendorId) }}</strong>
                <span class="muted tiny">{{ storeName(o.storeId) }}</span>
              </div>
              <div class="muted small">
                {{ o.date }}｜{{ o.items.length }} 項
              </div>
            </div>

            <div class="action-col">
              <button
                v-if="o.status==='pending'"
                class="mini-ghost"
                @click.stop="approveOrder(o.id)"
              >核准</button>
            </div>
          </div>

          <p v-if="!filteredOrders.length" class="muted center small">
            目前沒有草稿或待審核的訂單
          </p>
        </div>
      </aside>

      <!-- 右欄主內容 -->
      <main class="inv-main card">
        <!-- ========== TAB 1: 訂單情況總覽 ========== -->
        <template v-if="tab==='overview'">
          <!-- KPI 區 -->
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
            <!-- 來源排行 -->
            <section class="card-lite">
              <div class="section-head">
                <h3 class="h3">近 7 天來源排行</h3>
                <div class="hint muted tiny">員工最常向誰下單</div>
              </div>

              <div class="table-wrap">
                <table class="tbl">
                  <thead>
                    <tr><th>來源</th><th class="num">單數</th></tr>
                  </thead>
                  <tbody>
                    <tr v-for="r in topVendors" :key="r.id">
                      <td>{{ vendorName(r.id) }}</td>
                      <td class="num">{{ r.count }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <!-- 熱門品項 -->
            <section class="card-lite">
              <div class="section-head">
                <h3 class="h3">近 7 天熱門品項</h3>
                <div class="hint muted tiny">下單量最高</div>
              </div>

              <div class="table-wrap">
                <table class="tbl">
                  <thead>
                    <tr><th>品項</th><th class="num">總數量</th></tr>
                  </thead>
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

          <!-- 立即警示區 -->
          <section class="card-lite alert-block" v-if="suspiciousOrders.length">
            <div class="section-head">
              <h3 class="h3 warn-text">可疑/異常訂單</h3>
              <div class="hint muted tiny">
                單日下單量異常高、或同一來源短時間連續下多單
              </div>
            </div>

            <div class="table-wrap">
              <table class="tbl">
                <thead>
                  <tr>
                    <th>日期</th>
                    <th>門市</th>
                    <th>來源</th>
                    <th class="num">品項數</th>
                    <th class="num">狀態</th>
                    <th class="num">處理</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="o in suspiciousOrders" :key="o.id">
                    <td>{{ o.date }}</td>
                    <td>{{ storeName(o.storeId) }}</td>
                    <td>{{ vendorName(o.vendorId) }}</td>
                    <td class="num">{{ o.items.length }}</td>
                    <td class="num">
                      <span class="badge" :class="o.status">{{ statusText(o.status) }}</span>
                    </td>
                    <td class="num">
                      <button
                        class="btn small"
                        @click="openOrder(o.id); tab='compose'; mode='pending'"
                      >檢視</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </template>

        <!-- ========== TAB 2: 管理打單 ========== -->
        <template v-else-if="tab==='compose'">
          <!-- 上方模式切換列 -->
          <div class="compose-head">
            <div class="seg">
              <button :class="['segbtn', mode==='ai'      && 'active']" @click="mode='ai'">AI 建議</button>
              <button :class="['segbtn', mode==='manual'  && 'active']" @click="mode='manual'">手動打單</button>
              <button :class="['segbtn', mode==='setup'   && 'active']" @click="mode='setup'">來源/品項設定</button>
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

          <!-- === AI 模式 === -->
          <template v-if="mode==='ai'">
            <div class="ai-toolbar">
              <div class="row gap">
                <button class="btn" @click="runAI">重新產生建議</button>
                <div class="muted small">
                  依最近 30 天銷售、星期別、天氣、節慶、自動估算需求量，可手動微調。
                </div>
              </div>

              <div class="spacer"></div>

              <div class="row gap">
                <button class="btn ghost small" @click="saveDraft('AI')">存成草稿</button>
                <button class="btn primary small" @click="submitOrder('AI')">送出審核</button>
              </div>
            </div>

            <div class="card-lite">
              <div class="flex-title">
                <h3 class="h3">AI 建議清單（{{ ui.date }}）</h3>
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
                      <td>
                        <label class="ck">
                          <input type="checkbox" v-model="row.checked">
                          <span></span>
                        </label>
                      </td>
                      <td>
                        <div class="item-cell">
                          <div class="name">{{ row.name }}</div>
                          <div class="muted tiny">單位：{{ row.unit }}</div>
                        </div>
                      </td>
                      <td class="num">{{ row.stock }}</td>
                      <td class="num"><strong>{{ row.suggest }}</strong></td>
                      <td class="reason">
                        <div class="tags">
                          <span class="pill" v-for="t in row.reasons" :key="t">{{ t }}</span>
                        </div>
                      </td>
                      <td class="num">
                        <input
                          type="number"
                          min="0"
                          class="input w90"
                          v-model.number="row.finalQty"
                        >
                      </td>
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
                <button class="btn small" @click="selectAllAI(true)">全選</button>
                <button class="btn small" @click="selectAllAI(false)">全不選</button>
                <div class="muted small">已選 {{ aiRows.filter(r=>r.checked).length }} 項</div>
                <div class="spacer"></div>
                <div class="muted small">合計：<strong>{{ sumAI }}</strong></div>
              </div>
            </div>
          </template>

          <!-- === 手動模式 === -->
          <template v-else-if="mode==='manual'">
            <div class="ai-toolbar">
              <div class="row gap">
                <input
                  class="input w220"
                  placeholder="搜尋可下單品項…"
                  v-model.trim="qProduct"
                >
                <button class="btn" @click="addAllFiltered()">加入清單</button>
              </div>

              <div class="spacer"></div>

              <div class="row gap">
                <button class="btn ghost small" @click="saveDraft('MANUAL')">存成草稿</button>
                <button
                  class="btn primary small"
                  :disabled="!manualRows.length"
                  @click="submitOrder('MANUAL')"
                >送出審核</button>
              </div>
            </div>

            <div class="card-lite">
              <h3 class="h3">手動打單</h3>
              <div class="table-wrap">
                <table class="tbl">
                  <thead>
                    <tr>
                      <th>品項</th>
                      <th class="num">現有庫存</th>
                      <th class="num">下單數量</th>
                      <th class="num">移除</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in manualRows" :key="row.id">
                      <td>
                        <div class="item-cell">
                          <div class="name">{{ row.name }}</div>
                          <div class="muted tiny">單位：{{ row.unit }}</div>
                        </div>
                      </td>
                      <td class="num">{{ row.stock }}</td>
                      <td class="num">
                        <input
                          type="number"
                          min="0"
                          class="input w90"
                          v-model.number="row.qty"
                        >
                      </td>
                      <td class="num">
                        <button class="btn small" @click="removeManualRow(row.id)">刪</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="row gap mt-8">
                <div class="muted small">
                  合計：<strong>{{ sumManual }}</strong>
                </div>
              </div>
            </div>
          </template>

          <!-- === 來源 / 品項設定 === -->
          <template v-else-if="mode==='setup'">
            <div class="card-lite">
              <div class="section-head">
                <h3 class="h3">來源／供應單位設定</h3>
                <div class="hint muted tiny">
                  例如「中央廚房」、「某某食材行」、「雞肉供應商A」…
                </div>
              </div>

              <div class="row gap mt-8">
                <input
                  class="input w220"
                  placeholder="新增來源名稱"
                  v-model.trim="newVendorName"
                >
                <button
                  class="btn"
                  :disabled="!newVendorName"
                  @click="createVendor"
                >新增來源</button>
              </div>

              <div class="vendor-list mt-12">
                <div
                  v-for="v in vendors"
                  :key="v.id"
                  class="vendor-card"
                >
                  <div class="row gap vendor-head">
                    <strong>{{ v.name }}</strong>
                    <button class="link" @click="renameVendor(v)">更名</button>
                    <button class="link danger" @click="removeVendor(v.id)">刪除</button>
                  </div>

                  <div class="muted tiny">
                    可下單品項：{{ vendorProducts(v.id).length }} 項
                  </div>

                  <div class="chips mt-8">
                    <button
                      v-for="it in ingredients"
                      :key="it.id"
                      class="chip"
                      :class="{on: v.productIds.includes(it.id)}"
                      @click="toggleProduct(v.id, it.id)"
                    >
                      {{ it.name }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- === 待審核 === -->
          <template v-else>
            <div class="card-lite">
              <div class="section-head">
                <h3 class="h3">待審核訂單</h3>
                <div class="hint muted tiny">員工送審但尚未核准的單</div>
              </div>

              <div class="table-wrap">
                <table class="tbl">
                  <thead>
                    <tr>
                      <th>日期</th>
                      <th>來源</th>
                      <th class="num">品項數</th>
                      <th>狀態</th>
                      <th class="num">動作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="o in orders.filter(x=>x.status==='pending')"
                      :key="o.id"
                    >
                      <td>{{ o.date }}</td>
                      <td>{{ vendorName(o.vendorId) }}</td>
                      <td class="num">{{ o.items.length }}</td>
                      <td>
                        <span class="badge pending">待審核</span>
                      </td>
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

        <!-- ========== TAB 3: 紀錄 / 歷史 ========= -->
        <template v-else>
          <div class="card-lite">
            <div class="section-head">
              <h3 class="h3">打單紀錄</h3>
              <div class="hint muted tiny">
                已核准、已送出、退回的歷史資料
              </div>
            </div>

            <!-- 篩選列 -->
            <div class="row gap mt-8">
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
                <option
                  v-for="v in vendors"
                  :key="v.id"
                  :value="v.id"
                >{{ v.name }}</option>
              </select>

              <div class="spacer"></div>

              <button class="btn ghost small" @click="resetLogFilter">
                清空篩選
              </button>
            </div>

            <!-- 紀錄表 -->
            <div class="table-wrap mt-12">
              <table class="tbl">
                <thead>
                  <tr>
                    <th>日期</th>
                    <th>來源</th>
                    <th>門市</th>
                    <th>來源類型</th>
                    <th class="num">品項數</th>
                    <th>狀態</th>
                    <th class="num">操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="o in filteredLogs"
                    :key="o.id"
                  >
                    <td>{{ o.date }}</td>
                    <td>{{ vendorName(o.vendorId) }}</td>
                    <td>{{ storeName(o.storeId) }}</td>
                    <td>{{ o.source==='AI' ? 'AI' : '手動' }}</td>
                    <td class="num">{{ o.items.length }}</td>
                    <td>
                      <span class="badge" :class="o.status">
                        {{ statusText(o.status) }}
                      </span>
                    </td>
                    <td class="num">
                      <button
                        class="btn small"
                        @click="o._open = !o._open"
                      >{{ o._open ? '收起' : '明細' }}</button>

                      <button
                        v-if="o.status==='approved'"
                        class="btn small"
                        @click="sendOrder(o.id)"
                      >送出</button>
                    </td>
                  </tr>

                  <!-- 明細列 -->
                  <tr
                    v-for="o in filteredLogs.filter(x=>x._open)"
                    :key="o.id+'-detail'"
                  >
                    <td colspan="7">
                      <div class="chips">
                        <span
                          v-for="it in o.items"
                          :key="it.ingredientId"
                          class="pill"
                        >
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

    <!-- 底部工具列：匯入／匯出 -->
    <footer class="bottom card">
      <div class="row gap wrap">
        <button class="btn ghost small" @click="exportJSON">
          匯出 JSON
        </button>

        <label class="btn ghost small file-btn">
          匯入 JSON
          <input type="file" accept="application/json" @change="importJSON">
        </label>

        <div class="spacer"></div>

        <div class="muted tiny">
          所有資料皆存於本機 / 或走 Firebase（系統設定切換）
        </div>
      </div>
    </footer>

    <transition name="fade">
      <div v-if="toastMsg" class="toast">{{ toastMsg }}</div>
    </transition>
  </section>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import {
  read,
  addStore, // 註：保留避免 firebase 模式報錯（即便此頁暫未用到）
} from '@/store/datasource'

defineOptions({ name: 'BossOrderCenter' })

/* ------------------------------------------------------------------
   1. 初始化資料
-------------------------------------------------------------------*/

function rid(){ return crypto?.randomUUID?.() ?? 'id-' + Math.random().toString(36).slice(2,10) }
function today(){ const d=new Date(); return d.toISOString().slice(0,10) }

/* 門市 */
const stores = reactive(loadStores())
/* 食材清單（可下單品項） */
const ingredients = reactive(loadIngredients())
/* 供應來源（例如「中央廚房」、「供應商」） */
const vendors = reactive(loadVendors())
/* 訂單列表（草稿、pending、approved、sent…） */
const orders = reactive(loadOrders())

/* UI 狀態 */
const tab = ref('overview')         // overview | compose | logs
const mode = ref('ai')              // ai | manual | setup | pending
const ui = reactive({
  date: today(),
  vendorId: vendors[0]?.id ?? '',
  storeId: stores[0]?.id ?? '',
})

/* 左欄搜尋 / 篩選 */
const qList = ref('')
const vendorFilter = reactive(new Set())
const selectedOrderId = ref(null)

/* ------------------------------------------------------------------
   2. 左欄：草稿 / 待審核列表
-------------------------------------------------------------------*/
const filteredOrders = computed(()=>{
  const q = qList.value.trim()
  return orders
    .filter(o => (o.status==='draft' || o.status==='pending'))
    .filter(o => !vendorFilter.size || vendorFilter.has(o.vendorId))
    .filter(o => {
      if (!q) return true
      return vendorName(o.vendorId).includes(q) ||
             storeName(o.storeId).includes(q) ||
             o.date.includes(q)
    })
    .sort((a,b)=> (a.date < b.date ? 1 : -1))
})

function toggleVendorFilter(id){
  vendorFilter.has(id) ? vendorFilter.delete(id) : vendorFilter.add(id)
}

function vendorName(id){
  return vendors.find(v=>v.id===id)?.name ?? '（已刪除）'
}
function storeName(id){
  return stores.find(s=>s.id===id)?.name ?? '（已刪除）'
}
function ingredientName(id){
  return ingredients.find(i=>i.id===id)?.name ?? '（已刪除）'
}

/* 從清單載入草稿進來編輯（變成手動模式） */
function openOrder(id){
  const o = orders.find(x=>x.id===id); if(!o) return
  ui.vendorId  = o.vendorId
  ui.date      = o.date
  ui.storeId   = o.storeId
  mode.value   = 'manual'
  tab.value    = 'compose'
  manualRows.splice(0)
  o.items.forEach(it=>{
    const ing = ingredients.find(x=>x.id===it.ingredientId)
    if (ing) {
      manualRows.push({
        id:   ing.id,
        name: ing.name,
        unit: ing.unit,
        stock: ing.stock ?? 0,
        qty:   it.qty,
      })
    }
  })
  selectedOrderId.value = id
}

/* ------------------------------------------------------------------
   3. AI 建議 區
-------------------------------------------------------------------*/

const aiRows = reactive([])

function runAI(){
  aiRows.splice(0)

  // 找出此 vendor 可下單的商品
  const v = vendors.find(x=>x.id===ui.vendorId)
  const sourceIds = (v?.productIds?.length
    ? v.productIds
    : ingredients.map(x=>x.id)
  )

  const ctx = buildAIContext(ui.date)

  sourceIds
    .map(id => ingredients.find(i=>i.id===id))
    .filter(Boolean)
    .forEach(it=>{
      const base = avgLastNDays(it.id, 30)
      const wday = weekdayFactor(ui.date)
      const trend= trendFactor(it.id)
      const weather = weatherFactor(ctx.weather)
      const holiday = holidayFactor(ctx.holiday)
      const tag = tagFactor(it.tags)

      // 預估需求
      const demand = Math.max(
        0,
        Math.round(base * wday * trend * weather * holiday * tag)
      )

      const safe  = it.safeStock ?? 0
      const stock = it.stock ?? 0
      const suggest = Math.max(0, demand + safe - stock)

      aiRows.push({
        id: it.id,
        name: it.name,
        unit: it.unit,
        stock,
        suggest,
        finalQty: suggest,
        checked: suggest > 0,
        reasons: ctx.reasons,
      })
    })
}

runAI() // 頁面一進來就跑一次

function step(r){
  return Math.max(1, Math.round((r.suggest || 1) * 0.1))
}

const sumAI = computed(()=> {
  return aiRows
    .filter(r=>r.checked)
    .reduce((s,r)=> s + (Number(r.finalQty)||0), 0)
})

function selectAllAI(on){
  aiRows.forEach(r => { r.checked = !!on })
}

/* AI 用的小幫手（簡易估算模型） */
function avgLastNDays(ingId, n){
  const arr = salesHistory(ingId, n)
  return arr.length
    ? arr.reduce((s,x)=>s+x,0) / arr.length
    : 0
}

function salesHistory(ingId, n){
  const out=[]
  for(let i=1;i<=n;i++){
    const day = dateOffset(ui.date, -i)
    const seed = hash(`${ingId}-${day}`)
    const base = (seed % 7) + 3
    const w = weekdayFactor(day)
    const h = holidayFactor(holidayOf(day))
    out.push(Math.round(base*w*h))
  }
  return out
}

function weekdayFactor(d){
  const w = new Date(d).getDay()
  return w===0 ? 1.15 :
         w===6 ? 1.10 : 1.0
}
function weatherFactor(w){
  return w==='hot'   ? 1.08 :
         w==='cold'  ? 0.95 :
         w==='rainy' ? 0.92 : 1.0
}
function holidayFactor(h){
  return h==='festival' ? 1.12 : 1.0
}
function tagFactor(tags=[]){
  return tags?.length ? 1.03 : 1.0
}
function trendFactor(ingId){
  const last7  = salesHistory(ingId,7).reduce((s,x)=>s+x,0)
  const prev7  = salesHistory(ingId,14).slice(0,7).reduce((s,x)=>s+x,0)
  if (!prev7) return 1.0
  const ratio = last7 / prev7
  if (ratio > 1.1) return 1.06
  if (ratio < 0.9) return 0.96
  return 1.0
}

function buildAIContext(d){
  const weather = fakeWeatherOf(d)
  const holiday = holidayOf(d)
  const weekdayName = '日一二三四五六'[new Date(d).getDay()]

  const reasons = [
    `星期${weekdayName}`,
    weather==='sunny' ? '晴朗' :
    weather==='rainy' ? '降雨' :
    weather==='hot'   ? '高溫' :
    weather==='cold'  ? '降溫' : '—',
    holiday==='festival' ? '節慶' : '一般日',
  ]
  return { weather, holiday, reasons }
}

function fakeWeatherOf(d){
  const s = hash('weather-'+d)%4
  return ['sunny','rainy','hot','cold'][s]
}
function holidayOf(d){
  const x = new Date(d).getDate()
  return (x===1 || x===15) ? 'festival' : 'none'
}

/* ------------------------------------------------------------------
   4. 手動打單
-------------------------------------------------------------------*/

const qProduct = ref('')
const manualRows = reactive([])

const filteredProducts = computed(()=>{
  const v = vendors.find(x=>x.id===ui.vendorId)
  const allowedIds = (v?.productIds?.length
    ? new Set(v.productIds)
    : new Set(ingredients.map(i=>i.id))
  )
  const q = qProduct.value.trim()
  return ingredients
    .filter(i=>allowedIds.has(i.id))
    .filter(i=>!q || i.name.includes(q))
})

function addAllFiltered(){
  filteredProducts.value.forEach(it=>{
    if (!manualRows.some(r=>r.id===it.id)) {
      manualRows.push({
        id:   it.id,
        name: it.name,
        unit: it.unit,
        stock: it.stock ?? 0,
        qty:   0,
      })
    }
  })
}

function removeManualRow(id){
  const i = manualRows.findIndex(r=>r.id===id)
  if (i>=0) manualRows.splice(i,1)
}

function startManual(){
  tab.value = 'compose'
  mode.value = 'manual'
  manualRows.splice(0)
}

const sumManual = computed(()=>{
  return manualRows.reduce((s,r)=> s + (Number(r.qty)||0), 0)
})

/* ------------------------------------------------------------------
   5. 建單流程：存草稿 / 送審 / 審核 / 送出
-------------------------------------------------------------------*/

function buildOrderItemsFromCurrentForm(){
  if (mode.value === 'ai') {
    return aiRows
      .filter(r=>r.checked && r.finalQty>0)
      .map(r=>({ ingredientId:r.id, qty:r.finalQty }))
  } else {
    return manualRows
      .filter(r=>r.qty>0)
      .map(r=>({ ingredientId:r.id, qty:r.qty }))
  }
}

function saveDraft(source){
  const items = buildOrderItemsFromCurrentForm()
  const o = {
    id: rid(),
    date: ui.date,
    vendorId: ui.vendorId,
    storeId: ui.storeId,
    source,
    status: 'draft',
    items,
  }
  orders.unshift(o)
  persistOrders()
  toast('已存成草稿')
}

function submitOrder(source){
  const items = buildOrderItemsFromCurrentForm()
  if (!items.length){
    toast('沒有可送出的品項'); return
  }
  const o = {
    id: rid(),
    date: ui.date,
    vendorId: ui.vendorId,
    storeId: ui.storeId,
    source,
    status: 'pending',
    items,
  }
  orders.unshift(o)
  persistOrders()
  toast('已送出審核')
}

function approveOrder(id){
  const o = orders.find(x=>x.id===id)
  if (!o) return
  o.status = 'approved'
  persistOrders()
  toast('已核准')
}

function rejectOrder(id){
  const o = orders.find(x=>x.id===id)
  if (!o) return
  o.status = 'rejected'
  persistOrders()
  toast('已退回')
}

function sendOrder(id){
  const o = orders.find(x=>x.id===id)
  if (!o) return
  o.status = 'sent'
  persistOrders()
  toast('已送出')
}

function statusText(s){
  return s==='draft'    ? '草稿'
       : s==='pending'  ? '待審核'
       : s==='approved' ? '已核准'
       : s==='rejected' ? '已退回'
       : '已送出'
}

/* ------------------------------------------------------------------
   6. 訂單情況總覽：KPI、排行、可疑訂單
-------------------------------------------------------------------*/

const kpi = computed(()=>{
  const d = today()
  const todayOrders = orders.filter(o=>o.date===d)
  return {
    todayTotal:    todayOrders.length,
    todayPending:  todayOrders.filter(o=>o.status==='pending').length,
    todayApproved: todayOrders.filter(o=>o.status==='approved').length,
    todaySent:     todayOrders.filter(o=>o.status==='sent').length,
  }
})

const topVendors = computed(()=>{
  const since = dateOffset(today(), -7)
  const map = new Map()
  orders
    .filter(o=>o.date>=since)
    .forEach(o=>{
      map.set(o.vendorId, (map.get(o.vendorId)||0)+1)
    })
  return Array.from(map, ([id,count])=>({id,count}))
    .sort((a,b)=>b.count-a.count)
    .slice(0,6)
})

const hotItems = computed(()=>{
  const since = dateOffset(today(), -7)
  const map = new Map()
  orders
    .filter(o=>o.date>=since)
    .forEach(o=>{
      o.items.forEach(it=>{
        map.set(it.ingredientId, (map.get(it.ingredientId)||0)+it.qty)
      })
    })
  return Array.from(map, ([id,qty])=>({id,qty}))
    .sort((a,b)=>b.qty-a.qty)
    .slice(0,6)
})

/* 異常偵測（簡單規則） */
const suspiciousOrders = computed(()=>{
  const out = []
  const byKeyCount = new Map() // key = date|storeId|vendorId

  orders.forEach(o=>{
    const key = `${o.date}|${o.storeId}|${o.vendorId}`
    byKeyCount.set(key, (byKeyCount.get(key)||0)+1)
  })

  orders.forEach(o=>{
    const totalQty = o.items.reduce((s,it)=>s+Number(it.qty||0),0)
    const key = `${o.date}|${o.storeId}|${o.vendorId}`
    const burstCount = byKeyCount.get(key)||0
    if (burstCount >= 3 || totalQty >= 50){
      out.push(o)
    }
  })

  // 只看最近兩天內的
  const since = dateOffset(today(), -2)
  return out
    .filter(o=>o.date>=since)
    .sort((a,b)=> (a.date<b.date?1:-1))
})

/* ------------------------------------------------------------------
   7. 打單紀錄 / 歷史區
-------------------------------------------------------------------*/

const logFilter = reactive({
  from:'',
  to:'',
  status:'',
  vendorId:''
})

const filteredLogs = computed(()=>{
  return orders
    .filter(o => !logFilter.status   || o.status === logFilter.status)
    .filter(o => !logFilter.vendorId || o.vendorId === logFilter.vendorId)
    .filter(o => !logFilter.from     || o.date >= logFilter.from)
    .filter(o => !logFilter.to       || o.date <= logFilter.to)
    .sort((a,b)=> (a.date<b.date?1:-1))
})

function resetLogFilter(){
  logFilter.from=''
  logFilter.to=''
  logFilter.status=''
  logFilter.vendorId=''
}

/* ------------------------------------------------------------------
   8. 匯入 / 匯出
-------------------------------------------------------------------*/

function exportJSON(){
  const data = { vendors, orders }
  const blob = new Blob([JSON.stringify(data,null,2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'boss-orders.json'
  a.click()
  URL.revokeObjectURL(url)
}

function importJSON(e){
  const f = e.target.files?.[0]
  if (!f) return
  const reader = new FileReader()
  reader.onload = () => {
    try{
      const obj = JSON.parse(String(reader.result))
      if (obj.vendors) {
        vendors.splice(0)
        obj.vendors.forEach(v=>vendors.push(v))
        persistVendors()
      }
      if (obj.orders) {
        orders.splice(0)
        obj.orders.forEach(o=>orders.push(o))
        persistOrders()
      }
      toast('已匯入資料')
    }catch{
      toast('匯入失敗：檔案格式錯誤')
    }
  }
  reader.readAsText(f, 'utf-8')
}

/* ------------------------------------------------------------------
   9. 假資料存取：localStorage   （Firebase 模式可改為呼叫後端）
-------------------------------------------------------------------*/

function loadStores(){
  const snap = read()
  if (Array.isArray(snap.stores) && snap.stores.length){
    return snap.stores.map(s => ({ id:s.id, name:s.name }))
  }
  const raw = localStorage.getItem('boss-stores')
  if (raw){ try { return JSON.parse(raw) } catch {} }
  const s = [
    { id: rid(), name:'湖南雞 總店' },
    { id: rid(), name:'湖南雞 中央廚房' },
    { id: rid(), name:'湖南雞 台中一店' },
  ]
  localStorage.setItem('boss-stores', JSON.stringify(s))
  return s
}

function loadIngredients(){
  const snap = read()
  if (Array.isArray(snap.inventory) && snap.inventory.length){
    const arr = []
    snap.inventory.forEach(row=>{
      if (!arr.some(x=>x.sku===row.sku)){
        arr.push({
          id: row.sku,
          name: row.name,
          unit: row.unit || '份',
          stock: row.qty ?? 0,
          safeStock: 5,
          tags: [],
        })
      }
    })
    return arr
  }
  const raw = localStorage.getItem('boss-ingredients')
  if (raw){
    try{
      const obj = JSON.parse(raw)
      if (Array.isArray(obj.ingredients)) return obj.ingredients
      if (Array.isArray(obj)) return obj
    }catch{}
  }
  const ing = [
    { id: rid(), name:'湖南雞腿套餐', unit:'份', stock:12, safeStock:5, tags:[] },
    { id: rid(), name:'微辣豆干',     unit:'份', stock:20, safeStock:8, tags:[] },
    { id: rid(), name:'高麗菜',       unit:'顆', stock:6,  safeStock:4, tags:['蔬菜'] },
    { id: rid(), name:'雞蛋',         unit:'顆', stock:40, safeStock:10, tags:[] },
  ]
  localStorage.setItem('boss-ingredients', JSON.stringify({ ingredients: ing, tags: [] }))
  return ing
}

function loadVendors(){
  const raw = localStorage.getItem('boss-vendors')
  if (raw){ try { return JSON.parse(raw) } catch {} }
  const v = [
    { id: rid(), name:'中央廚房',  productIds: ingredients.map(i=>i.id).slice(0,3) },
    { id: rid(), name:'蛋肉供應商A', productIds: ingredients.map(i=>i.id).slice(2) },
    { id: rid(), name:'青菜行B',    productIds: ingredients.filter(i=>i.name.includes('菜') || i.name.includes('豆')).map(i=>i.id) },
  ]
  localStorage.setItem('boss-vendors', JSON.stringify(v))
  return v
}

function loadOrders(){
  const raw = localStorage.getItem('boss-orders')
  if (raw){ try { return JSON.parse(raw) } catch {} }
  return []
}

function persistOrders(){
  localStorage.setItem('boss-orders', JSON.stringify(orders))
}
function persistVendors(){
  localStorage.setItem('boss-vendors', JSON.stringify(vendors))
}

/* ------------------------------------------------------------------
   10. 其他小工具
-------------------------------------------------------------------*/

function dateOffset(d, off){
  const x = new Date(d)
  x.setDate(x.getDate() + off)
  return x.toISOString().slice(0,10)
}
function hash(s){
  let h=0
  for(let i=0;i<s.length;i++){
    h=((h<<5)-h)+s.charCodeAt(i)
    h|=0
  }
  return Math.abs(h)
}

/* Toast */
const toastMsg = ref('')
function toast(m){
  toastMsg.value = m
  setTimeout(()=>toastMsg.value='',1400)
}
</script>

<style scoped>
/* 整體頁面容器（吃主題變數） */
.inv-page{
  padding:16px;
  background: var(--bg);
  color: var(--text);
  min-height:100%;
  height:auto;
  overflow:visible;
}
.inv-header{
  display:flex;
  flex-wrap:wrap;
  align-items:flex-start;
  gap:8px;
  margin-bottom:8px;
}
.title{ font-size:20px; font-weight:800; }
.today-hint{ line-height:1.4; }
.muted{ color: var(--muted); }
.small{ font-size:12px; }
.tiny{ font-size:11px; }
.spacer{ flex:1; }

/* 頂部分頁按鈕 */
.inv-tabs{
  display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin-bottom:12px;
}
.tab{
  border:1px solid var(--border);
  background: var(--card-bg);
  color: var(--text);
  border-radius:10px; padding:8px 12px; cursor:pointer; font-size:14px; line-height:1.2;
}
.tab.active{
  background: var(--primary-weak);
  border-color: var(--primary);
  color: var(--primary);
}

/* 主區塊左右兩欄 */
.inv-grid{
  display:grid; grid-template-columns:320px 1fr; gap:12px; min-width:0;
}
.inv-side{
  background: var(--card-bg);
  border:1px solid var(--border);
  border-radius:16px; overflow:hidden; display:flex; flex-direction:column;
}

/* 側欄：搜尋 / chips / 新增草稿 */
.side-tools{
  display:flex; flex-direction:column; gap:10px; padding:12px; border-bottom:1px solid var(--border);
}
.search{
  display:flex; align-items:center; gap:6px;
  border:1px solid var(--border); border-radius:12px; padding:0 10px; min-height:38px; background: var(--card-bg);
  width:100%;
}
.input{
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--card-bg);
  color: var(--text);
  font-size:14px;
}
.input.bare{ border:none; background:transparent; }
.row{ display:flex; align-items:center; }
.row.gap{ gap:8px; flex-wrap:wrap; }
.chips{ display:flex; gap:8px; flex-wrap:wrap; }
.chip{
  border:1px solid var(--border); border-radius:999px; background: var(--card-bg); color: var(--text);
  padding:6px 10px; cursor:pointer; font-size:13px; line-height:1.2;
}
.chip.on{
  background: var(--primary-weak);
  border-color: var(--primary);
  color: var(--primary);
}
.side-actions .btn.primary{ width:100%; }

/* 側欄列表：草稿 / 待審核訂單 */
.side-list{
  flex:1; max-height:calc(100vh - 260px); overflow:auto; padding:10px 12px 16px;
}
.side-item{
  display:flex; align-items:flex-start; gap:10px;
  border:1px solid var(--border); border-radius:10px; padding:10px; margin-bottom:8px; cursor:pointer;
  background: var(--card-bg); color: var(--text); position:relative;
}
.side-item.active{ outline:2px solid var(--primary); }
.left-col{ display:flex; flex-direction:column; align-items:flex-start; min-width:60px; }
.top-row{ display:flex; gap:6px; flex-wrap:wrap; }
.action-col{ margin-left:auto; align-self:flex-start; }
.mini-ghost{
  border:1px solid var(--border); background: var(--card-bg); color: var(--text);
  border-radius:8px; font-size:12px; line-height:1.2; padding:4px 8px; cursor:pointer;
}

/* 卡片外觀 */
.card{
  background: var(--card-bg);
  border:1px solid var(--border);
  border-radius:16px; padding:12px; min-width:0;
}
.card-lite{
  border:1px dashed var(--border);
  border-radius:12px; padding:12px; margin-bottom:12px; background: var(--card-bg);
}
.section-head{
  display:flex; flex-wrap:wrap; align-items:flex-start; justify-content:space-between; gap:4px 8px;
}
.h3{ margin:0 0 4px; font-size:15px; font-weight:600; }
.hint{ line-height:1.4; }
.warn-text{ color:#b91c1c; } /* 警示文字維持語意色 */

/* KPI 卡片 */
.kpi-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:12px; }
.kpi{
  background: var(--card-bg); border:1px solid var(--border); border-radius:14px; padding:16px; min-width:0;
}
.kpi-title{ color: var(--muted); font-size:13px; margin-bottom:6px; line-height:1.3; }
.kpi-value{ font-size:28px; font-weight:800; line-height:1.15; }
.kpi-value.ok{ color:#15803d; }
.kpi-value.warn{ color:#b45309; }

/* 2欄小總表 */
.grid-2{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }

/* 「可疑訂單」區塊 */
.alert-block{ border-color:#fde68a; background: var(--card-bg); }

/* compose head */
.compose-head{ display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin-bottom:8px; }
.seg{ display:flex; flex-wrap:wrap; gap:6px; }
.segbtn{
  border:1px solid var(--border); background: var(--card-bg); color: var(--text);
  border-radius:10px; padding:6px 10px; cursor:pointer; font-size:13px; line-height:1.2;
}
.segbtn.active{ background: var(--primary-weak); border-color: var(--primary); color: var(--primary); }

/* AI / 手動 共用工具列 */
.ai-toolbar{ display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin-bottom:8px; }
.flex-title{ display:flex; flex-wrap:wrap; align-items:center; gap:8px; }
.mt-8{ margin-top:8px; }
.mt-12{ margin-top:12px; }
.w-full{ width:100%; }
.w220{ width:220px; max-width:100%; }
.w90{ width:90px; max-width:100%; }

/* 表格樣式（吃表頭/hover變數） */
.table-wrap{
  overflow:auto; border:1px solid var(--border); border-radius:12px;
}
.tbl{ width:100%; min-width:780px; border-collapse:collapse; }
.tbl th, .tbl td{
  padding:10px 12px; border-bottom:1px solid var(--border); text-align:left; vertical-align:top; font-size:13px; line-height:1.4;
}
.tbl thead th{ position:sticky; top:0; background: var(--thead-bg); color: var(--thead-text); z-index:1; }
.tbl tbody tr:hover td{ background: var(--hover-bg); }
.tbl .num{ text-align:right; }
.item-cell .name{ font-weight:600; }

/* 狀態徽章（語意色保留） */
.badge{
  display:inline-flex; align-items:center; justify-content:center;
  min-width:54px; height:24px; border-radius:999px; font-size:12px; line-height:1.2; padding:0 8px;
  border:1px solid var(--border); background: var(--hover-bg); color: var(--text);
}
.badge.pending{  background:#fff7ed; border-color:#fed7aa; color:#9a3412; }
.badge.draft{    background:#eef2ff; border-color:#c7d2fe; color:#3730a3; }
.badge.approved{ background:#ecfeff; border-color:#bae6fd; color:#075985; }
.badge.rejected{ background:#fef2f2; border-color:#fecaca; color:#7f1d1d; }
.badge.sent{     background:#f0fdf4; border-color:#86efac; color:#166534; }

/* 小標籤 */
.tags{ display:flex; flex-wrap:wrap; gap:6px; }
.pill{
  display:inline-flex; gap:4px; align-items:center;
  background:#eef2ff; border:1px solid #c7d2fe; border-radius:999px; padding:2px 8px; font-size:12px; line-height:1.2;
}

/* 來源管理卡 */
.vendor-list{ display:grid; gap:12px; }
.vendor-card{
  border:1px solid var(--border); border-radius:12px; background: var(--card-bg); padding:12px;
}
.vendor-head{ font-size:14px; font-weight:600; flex-wrap:wrap; }
.link{
  background:none; border:none; color: var(--primary); font-size:12px; line-height:1.2; cursor:pointer; padding:0;
}
.link.danger{ color:#b91c1c; }

/* Checkbox UI（吃變數） */
.ck input{ display:none; }
.ck span{
  width:18px; height:18px; border:1px solid var(--border); border-radius:4px; display:inline-block; background: var(--card-bg); position:relative;
}
.ck input:checked + span::after{ content:''; position:absolute; inset:2px; background: var(--primary); border-radius:2px; }

/* 共用按鈕樣式（吃變數） */
.btn{
  border:1px solid var(--primary);
  background: var(--card-bg);
  color: var(--primary);
  border-radius:10px; padding:8px 12px; cursor:pointer; font-size:13px; line-height:1.2;
}
.btn.primary{ background: var(--primary); border-color: var(--primary); color:#fff; }
.btn.ghost{ border-color: var(--border); color: var(--text); background: var(--card-bg); }
.btn.small{ padding:6px 10px; font-size:12px; line-height:1.2; }
.file-btn{ position:relative; overflow:hidden; }
.file-btn input{ position:absolute; inset:0; opacity:0; cursor:pointer; }

/* 頁面底部工具列 */
.bottom{
  max-width:1200px; margin:12px auto 0;
  background: var(--card-bg); border:1px solid var(--border); border-radius:16px; padding:12px;
}
.row.wrap{ flex-wrap:wrap; row-gap:8px; }

/* Toast */
.toast{
  position:fixed; left:50%; bottom:24px; transform:translateX(-50%);
  background: var(--text); color:#fff; font-size:13px; line-height:1.3;
  padding:10px 14px; border-radius:8px; box-shadow:0 10px 30px rgba(0,0,0,.4); z-index:9999;
}
.fade-enter-active, .fade-leave-active{ transition:opacity .18s; }
.fade-enter-from, .fade-leave-to{ opacity:0; }

/* RWD */
@media (max-width:1024px){
  .inv-grid{ grid-template-columns:1fr; }
  .side-list{ max-height:none; }
  .tbl{ min-width:640px; }
  .kpi-grid{ grid-template-columns:repeat(2,1fr); }
  .grid-2{ grid-template-columns:1fr; }
}
</style>
