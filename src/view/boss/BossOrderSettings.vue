<!-- src/view/boss/BossOrderSettings.vue -->
<template>
  <section class="inv-page">
    <!-- 頁首 -->
    <header class="inv-header card-lite sticky-top">
      <div class="title">
        <span v-if="isBoss">老闆訂單設定 / 中央控管</span>
        <span v-else>員工訂單中心</span>
      </div>
      <div class="spacer"></div>

      <div class="today-counters">
        <span class="tiny muted">今日</span>
        <span class="pill stat">總單 {{ kpi.todayTotal }}</span>
        <span class="pill warn">待審 {{ kpi.todayPending }}</span>
        <span class="pill ok">核准 {{ kpi.todayApproved }}</span>
        <span class="pill">送出 {{ kpi.todaySent }}</span>
      </div>

      <!-- 範圍切換（員工隱藏） -->
      <div v-if="isBoss" class="scope-row">
        <select class="input h32" v-model="scopeType" @change="onScopeChange">
          <option value="all">全部門市</option>
          <option value="store">單店</option>
        </select>
        <select v-if="scopeType==='store'" class="input h32" v-model="scopeStoreId">
          <option v-for="s in stores" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
      </div>
    </header>

    <!-- 分頁 -->
    <div class="inv-tabs">
      <button :class="['tab', tab==='overview' && 'active']" @click="tab='overview'">訂單情況</button>
      <button :class="['tab', tab==='compose'  && 'active']" @click="tab='compose'">
        {{ isBoss ? '管理打單 / 設定' : '管理打單' }}
      </button>
      <button :class="['tab', tab==='logs'     && 'active']" @click="tab='logs'">打單紀錄</button>
      <div class="spacer"></div>
    </div>

    <div class="inv-grid">
      <!-- 左側：草稿/待審核 -->
      <aside class="inv-side">
        <div class="side-tools">
          <div class="search">
            <span>🔎</span>
            <input class="input bare" v-model.trim="qList" placeholder="搜尋來源 / 門市 / 日期（草稿 / 待審）…" />
          </div>

          <div class="chips">
            <button
              v-for="v in vendorChipsVisible"
              :key="v.id"
              class="chip"
              :class="{ on: vendorFilter.has(v.id) }"
              @click="toggleVendorFilter(v.id)"
            >#{{ v.name }}</button>

            <button
              v-if="vendors.length > MAX_TAGS"
              class="chip ghost"
              @click="showAllTags = !showAllTags"
            >{{ showAllTags ? '收起' : `展開 ${vendors.length - MAX_TAGS}` }}</button>
          </div>

          <div class="row gap">
            <button class="btn primary w-full" @click="startManual">＋ 新增手動打單</button>
          </div>
        </div>

        <div class="side-list">
          <div
            v-for="o in filteredOrders"
            :key="o.id"
            class="side-item"
            :class="{ active: o.id===selectedOrderId }"
            @click="openOrder(o.id)"
          >
            <div class="left-col">
              <div class="badge" :class="o.status">{{ statusText(o.status) }}</div>
            </div>

            <div class="grow">
              <div class="row top-row">
                <strong>{{ vendorName(o.vendorId) }}</strong>
                <span class="muted tiny">｜{{ storeName(o.storeId) }}</span>
              </div>
              <div class="muted small">{{ o.date }}｜{{ o.items.length }} 項</div>
            </div>

            <div class="action-col">
              <button
                v-if="o.status==='pending' && isBoss"
                class="mini-ghost"
                @click.stop="approveOrder(o.id)"
              >核准</button>
            </div>
          </div>

          <p v-if="!filteredOrders.length" class="muted center small">目前沒有草稿或待審核的訂單</p>
        </div>
      </aside>

      <!-- 右側主體 -->
      <main class="inv-main card">
        <!-- 概覽 -->
        <template v-if="tab==='overview'">
          <div class="kpi-grid">
            <div class="kpi"><div class="kpi-title">今日總單數</div><div class="kpi-value">{{ kpi.todayTotal }}</div></div>
            <div class="kpi"><div class="kpi-title">待審核</div><div class="kpi-value warn">{{ kpi.todayPending }}</div></div>
            <div class="kpi"><div class="kpi-title">已核准</div><div class="kpi-value ok">{{ kpi.todayApproved }}</div></div>
            <div class="kpi"><div class="kpi-title">已送出</div><div class="kpi-value">{{ kpi.todaySent }}</div></div>
          </div>

          <section class="card-lite">
            <div class="section-head">
              <h3 class="h3">近 7 天概覽</h3>
              <div class="seg">
                <button :class="['segbtn', overviewTab==='vendor' && 'active']" @click="overviewTab='vendor'">來源排行</button>
                <button :class="['segbtn', overviewTab==='items'  && 'active']" @click="overviewTab='items'">熱門品項</button>
              </div>
            </div>

            <div class="table-wrap x-scroll">
              <table v-if="overviewTab==='vendor'" class="tbl">
                <thead><tr><th>來源</th><th class="num">單數</th></tr></thead>
                <tbody>
                  <tr v-for="r in topVendors" :key="r.id">
                    <td>{{ vendorName(r.id) }}</td>
                    <td class="num">{{ r.count }}</td>
                  </tr>
                  <tr v-if="!topVendors.length"><td colspan="2" class="muted">近 7 天沒有資料</td></tr>
                </tbody>
              </table>

              <table v-else class="tbl">
                <thead><tr><th>品項</th><th class="num">總數量</th></tr></thead>
                <tbody>
                  <tr v-for="r in hotItems" :key="r.id">
                    <td>{{ ingredientName(r.id) }}</td>
                    <td class="num">{{ r.qty }}</td>
                  </tr>
                  <tr v-if="!hotItems.length"><td colspan="2" class="muted">近 7 天沒有資料</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="card-lite alert-block" v-if="suspiciousOrders.length">
            <div class="section-head">
              <h3 class="h3 warn-text">可疑 / 異常訂單</h3>
              <div class="hint muted tiny">單量異常、或同來源短時間連續下單。</div>
            </div>
            <div class="table-wrap x-scroll">
              <table class="tbl">
                <thead><tr><th>日期</th><th>門市</th><th>來源</th><th class="num">品項數</th><th class="num">狀態</th><th class="num">處理</th></tr></thead>
                <tbody>
                  <tr v-for="o in suspiciousOrders" :key="o.id">
                    <td>{{ o.date }}</td>
                    <td>{{ storeName(o.storeId) }}</td>
                    <td>{{ vendorName(o.vendorId) }}</td>
                    <td class="num">{{ o.items.length }}</td>
                    <td class="num"><span class="badge" :class="o.status">{{ statusText(o.status) }}</span></td>
                    <td class="num"><button class="btn small" @click="openOrder(o.id); tab='compose'; mode='pending'">檢視</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </template>

        <!-- 管理打單 -->
        <template v-else-if="tab==='compose'">
          <div class="compose-head">
            <div class="seg">
              <button :class="['segbtn', mode==='ai'      && 'active']" @click="mode='ai'">AI 建議</button>
              <button :class="['segbtn', mode==='manual'  && 'active']" @click="mode='manual'">手動打單</button>
              <button :class="['segbtn', mode==='setup'   && 'active']" @click="mode='setup'">{{ isBoss ? '來源/品項（管理）' : '來源/品項（查看）' }}</button>
              <button :class="['segbtn', mode==='pending' && 'active']" @click="mode='pending'">待審核</button>
            </div>
            <div class="spacer"></div>
            <div class="row gap">
              <input type="date" class="input" v-model="ui.date" />
              <select class="input" v-model="ui.vendorId">
                <option v-for="v in vendors" :key="v.id" :value="v.id">{{ v.name }}</option>
              </select>
              <!-- 店面：老闆可切、員工鎖定 -->
              <select class="input" v-model="ui.storeId" :disabled="!isBoss">
                <option v-for="s in stores" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
            </div>
          </div>

          <!-- AI 模式 -->
          <template v-if="mode==='ai'">
            <div class="card-lite" v-if="isBoss">
              <div class="section-head">
                <h3 class="h3">AI 建議規則設定（老闆端）</h3>
                <div class="hint muted tiny">這些權重會影響員工端的 AI 建議結果。</div>
              </div>
              <div class="row gap mt-8">
                <label>星期影響 <input class="input w90" type="number" min="0.5" max="1.5" step="0.01" v-model.number="aiConfig.weekdayWeight"></label>
                <label>天氣影響 <input class="input w90" type="number" min="0.5" max="1.5" step="0.01" v-model.number="aiConfig.weatherWeight"></label>
                <label>節慶影響 <input class="input w90" type="number" min="0.5" max="1.5" step="0.01" v-model.number="aiConfig.holidayWeight"></label>
                <label>趨勢敏感度 <input class="input w90" type="number" min="0.8" max="1.2" step="0.01" v-model.number="aiConfig.trendSensitivity"></label>
                <label>類別加成 <input class="input w90" type="number" min="1.0" max="1.2" step="0.01" v-model.number="aiConfig.tagBoost"></label>
                <div class="spacer"></div>
                <button class="btn primary small" @click="saveAIConfig">儲存規則</button>
              </div>
            </div>

            <div class="ai-toolbar">
              <div class="row gap">
                <button class="btn" @click="runAI">{{ isBoss ? '套用規則並預覽' : '重新產生建議' }}</button>
                <span class="muted small">
                  {{ isBoss ? '此區為預覽；員工端將依此規則計算。' : '依近 30 天銷售/星期/天氣/節慶估算需求，可手動微調。' }}
                </span>
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

              <div class="table-wrap x-scroll">
                <table class="tbl">
                  <thead>
                  <tr>
                    <th style="width:28px"></th>
                    <th>品項</th>
                    <th class="num">現有庫存</th>
                    <th class="num">建議數量</th>
                    <th>影響因素</th>
                    <th class="num">調整後</th>
                    <th class="num">＋／－</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr v-for="row in aiRows" :key="row.id">
                    <td><label class="ck"><input type="checkbox" v-model="row.checked"><span /></label></td>
                    <td><div class="item-cell"><div class="name">{{ row.name }}</div><div class="muted tiny">單位：{{ row.unit }}</div></div></td>
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
                <button class="btn small" @click="selectAllAI(true)">全選</button>
                <button class="btn small" @click="selectAllAI(false)">全不選</button>
                <div class="muted small">已選 {{ aiRows.filter(r=>r.checked).length }} 項</div>
                <div class="spacer"></div>
                <div class="muted small">合計：<strong>{{ sumAI }}</strong></div>
              </div>
            </div>
          </template>

          <!-- 手動 -->
          <template v-else-if="mode==='manual'">
            <div class="ai-toolbar">
              <div class="row gap">
                <input class="input w220" placeholder="搜尋可下單品項…" v-model.trim="qProduct">
                <button class="btn" @click="addAllFiltered">加入清單</button>
              </div>
              <div class="spacer"></div>
              <div class="row gap">
                <button class="btn ghost small" @click="saveDraft('MANUAL')">存成草稿</button>
                <button class="btn primary small" :disabled="!manualRows.length" @click="submitOrder('MANUAL')">送出審核</button>
              </div>
            </div>

            <div class="card-lite">
              <h3 class="h3">手動打單</h3>
              <div class="table-wrap x-scroll">
                <table class="tbl">
                  <thead><tr><th>品項</th><th class="num">現有庫存</th><th class="num">下單數量</th><th class="num">移除</th></tr></thead>
                  <tbody>
                    <tr v-for="row in manualRows" :key="row.id">
                      <td><div class="item-cell"><div class="name">{{ row.name }}</div><div class="muted tiny">單位：{{ row.unit }}</div></div></td>
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

          <!-- 來源/品項：員工只顯示老闆已選品項 -->
          <template v-else-if="mode==='setup'">
            <div class="card-lite">
              <div class="section-head">
                <h3 class="h3">{{ isBoss ? '來源／供應單位設定' : '來源／品項（查看）' }}</h3>
                <div class="hint muted tiny">
                  {{ isBoss ? '點擊來源展開，切換可下單品項；亦可新增/更名/刪除來源。' : '僅顯示老闆開放的來源與品項。' }}
                </div>
              </div>

              <div class="row gap mt-8" v-if="isBoss">
                <input class="input w220" placeholder="新增來源名稱" v-model.trim="newVendorName">
                <button class="btn" :disabled="!newVendorName" @click="createVendor">新增來源</button>
              </div>

              <div class="vendor-list mt-12">
                <details v-for="v in visibleVendors" :key="v.id" class="vendor-card">
                  <summary class="vendor-head">
                    <strong>{{ v.name }}</strong>
                    <template v-if="isBoss">
                      <button class="link" @click.prevent="renameVendor(v)">更名</button>
                      <button class="link danger" @click.prevent="removeVendor(v.id)">刪除</button>
                    </template>
                    <span class="muted tiny ml8">可下單品項：{{ vendorProducts(v.id).length }} 項</span>
                  </summary>

                  <!-- 老闆：顯示全部品項並可切換；員工：只顯示被選到的品項 -->
                  <div class="chips mt-8" v-if="isBoss">
                    <button
                      v-for="it in ingredients"
                      :key="it.id"
                      class="chip"
                      :class="{ on: v.productIds.includes(it.id) }"
                      @click="toggleProduct(v.id, it.id)"
                    >{{ it.name }}</button>
                  </div>
                  <div class="chips mt-8" v-else>
                    <template v-if="vendorProducts(v.id).length">
                      <span class="pill" v-for="it in vendorProducts(v.id)" :key="it.id">{{ it.name }}</span>
                    </template>
                    <div v-else class="muted tiny">此來源目前未開放任何品項</div>
                  </div>
                </details>
              </div>
            </div>
          </template>

          <!-- 待審核 -->
          <template v-else>
            <div class="card-lite">
              <div class="section-head">
                <h3 class="h3">待審核訂單</h3>
                <div class="hint muted tiny">{{ isBoss ? '可切換範圍檢視並核准/退回。' : '僅可查看本店待審單。' }}</div>
              </div>
              <div class="table-wrap x-scroll">
                <table class="tbl">
                  <thead><tr><th>日期</th><th>來源</th><th>門市</th><th class="num">品項數</th><th>狀態</th><th class="num">動作</th></tr></thead>
                  <tbody>
                    <tr v-for="o in scopeOrders.filter(x=>x.status==='pending')" :key="o.id">
                      <td>{{ o.date }}</td>
                      <td>{{ vendorName(o.vendorId) }}</td>
                      <td>{{ storeName(o.storeId) }}</td>
                      <td class="num">{{ o.items.length }}</td>
                      <td><span class="badge pending">待審核</span></td>
                      <td class="num">
                        <template v-if="isBoss">
                          <button class="btn small" @click="approveOrder(o.id)">核准</button>
                          <button class="btn small" @click="rejectOrder(o.id)">退回</button>
                        </template>
                        <button class="btn small" @click="openOrder(o.id); tab='compose'; mode='manual'">檢視</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </template>
        </template>

        <!-- 打單紀錄 -->
        <template v-else>
          <div class="card-lite">
            <div class="section-head">
              <h3 class="h3">打單紀錄</h3>
              <div class="hint muted tiny">已核准 / 已送出 / 退回等歷史資料（可篩選）。</div>
            </div>

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
                <option v-for="v in vendors" :key="v.id" :value="v.id">{{ v.name }}</option>
              </select>
              <div class="spacer"></div>
              <button class="btn ghost small" @click="resetLogFilter">清空篩選</button>
            </div>

            <div class="table-wrap mt-12 x-scroll">
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
                    <td><span class="badge" :class="o.status">{{ statusText(o.status) }}</span></td>
                    <td class="num">
                      <button class="btn small" @click="o._open = !o._open">{{ o._open ? '收起' : '明細' }}</button>
                      <button v-if="isBoss && o.status==='approved'" class="btn small" @click="sendOrder(o.id)">送出</button>
                    </td>
                  </tr>
                  <tr v-for="o in filteredLogs.filter(x=>x._open)" :key="o.id+'-detail'">
                    <td colspan="7">
                      <div class="chips">
                        <span class="pill" v-for="it in o.items" :key="it.ingredientId">
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

    <footer class="bottom card">
      <div class="row gap wrap">
        <button class="btn ghost small" @click="exportJSON">匯出 JSON</button>
        <label class="btn ghost small file-btn">匯入 JSON
          <input type="file" accept="application/json" @change="importJSON">
        </label>
        <div class="spacer"></div>
        <div class="muted tiny">資料皆存於本機（或由系統設定切換至 Firebase）。</div>
      </div>
    </footer>

    <transition name="fade"><div v-if="toastMsg" class="toast">{{ toastMsg }}</div></transition>
  </section>
</template>

<script setup>
import { reactive, ref, computed, watch } from 'vue'
import { read } from '@/store/datasource'

defineOptions({ name: 'BossOrderSettings' })
const props = defineProps({ role: { type: String, default: 'boss' } })
const isBoss = computed(() => props.role === 'boss')

/* 工具 */
const rid   = () => crypto?.randomUUID?.() ?? 'id-' + Math.random().toString(36).slice(2,10)
const today = () => new Date().toISOString().slice(0,10)
const dateOffset = (d, off) => { const x = new Date(d); x.setDate(x.getDate()+off); return x.toISOString().slice(0,10) }
const hash = s => { let h=0; for (let i=0;i<s.length;i++){ h=((h<<5)-h)+s.charCodeAt(i); h|=0 } return Math.abs(h) }

/* 範圍（老闆可切，員工鎖定） */
const scopeType = ref('all')
const scopeStoreId = ref('')

/* 資料載入 */
const stores = reactive(loadStores())
const ingredients = reactive(loadIngredients())
const vendors = reactive(loadVendors())
const orders  = reactive(loadOrders())

/* 員工鎖店（如有你的 useScope，可替換這段） */
if (!isBoss.value) {
  scopeType.value = 'store'
  scopeStoreId.value = stores[0]?.id || ''
}

/* UI 狀態 */
const tab  = ref('overview')
const overviewTab = ref('vendor')
const mode = ref('ai')
const ui = reactive({
  date: today(),
  vendorId: vendors[0]?.id ?? '',
  storeId: isBoss.value ? (stores[0]?.id ?? '') : (scopeStoreId.value || stores[0]?.id || '')
})

/* 左欄 */
const qList = ref('')
const vendorFilter = reactive(new Set())
const selectedOrderId = ref(null)
const MAX_TAGS = 5
const showAllTags = ref(false)
const vendorChipsVisible = computed(() => showAllTags.value ? vendors : vendors.slice(0, MAX_TAGS))

const filteredOrders = computed(() => {
  const q = qList.value.trim()
  return orders
    .filter(o => (o.status==='draft' || o.status==='pending'))
    .filter(o => scopeType.value==='all' ? true : o.storeId === scopeStoreId.value)
    .filter(o => !vendorFilter.size || vendorFilter.has(o.vendorId))
    .filter(o => !q || vendorName(o.vendorId).includes(q) || storeName(o.storeId).includes(q) || o.date.includes(q))
    .sort((a,b)=> (a.date < b.date ? 1 : -1))
})
const toggleVendorFilter = id => (vendorFilter.has(id) ? vendorFilter.delete(id) : vendorFilter.add(id))
const vendorName = id => vendors.find(v=>v.id===id)?.name ?? '（已刪除）'
const storeName = id => stores.find(s=>s.id===id)?.name ?? '（已刪除）'
const ingredientName = id => ingredients.find(i=>i.id===id)?.name ?? '（已刪除）'

function openOrder(id){
  const o = orders.find(x=>x.id===id); if(!o) return
  ui.vendorId = o.vendorId; ui.date = o.date; ui.storeId = o.storeId
  mode.value = 'manual'; tab.value = 'compose'
  manualRows.splice(0)
  o.items.forEach(it=>{
    const ing = ingredients.find(x=>x.id===it.ingredientId)
    if (ing) manualRows.push({ id:ing.id, name:ing.name, unit:ing.unit, stock:ing.stock ?? 0, qty:it.qty })
  })
  selectedOrderId.value = id
}
const onScopeChange = () => { if (scopeType.value === 'store') scopeStoreId.value ||= stores[0]?.id || '' }

/* AI 建議 */
const weekdayFactor = d => { const w=new Date(d).getDay(); return w===0?1.15 : w===6?1.10 : 1.0 }
const weatherFactorBase = w => w==='hot'?1.08 : w==='cold'?0.95 : w==='rainy'?0.92 : 1.0
const holidayFactorBase = h => h==='festival'?1.12 : 1.0
const holidayOf = d => ([1,15].includes(new Date(d).getDate()) ? 'festival' : 'none')
const fakeWeatherOf = d => ['sunny','rainy','hot','cold'][hash('w-'+d)%4]
const salesHistory = (ingId, n) => {
  const out=[]
  for (let i=1;i<=n;i++){
    const day = dateOffset(ui.date,-i)
    const seed=hash(`${ingId}-${day}`)
    const base=(seed%7)+3
    const w=weekdayFactor(day)
    const h=holidayFactorBase(holidayOf(day))
    out.push(Math.round(base*w*h))
  }
  return out
}
const avgLastNDays = (id,n) => { const arr=salesHistory(id,n); return arr.length? arr.reduce((s,x)=>s+x,0)/arr.length : 0 }
const trendFactor = id => {
  const last7=salesHistory(id,7).reduce((s,x)=>s+x,0)
  const prev7=salesHistory(id,14).slice(0,7).reduce((s,x)=>s+x,0)
  if(!prev7) return 1.0
  const r=last7/prev7
  return r>1.1?aiConfig.trendSensitivity : r<0.9?(2-aiConfig.trendSensitivity) : 1.0
}

/* 老闆規則 */
const AI_CFG_KEY = 'boss-ai-config'
const aiConfig = reactive(loadAIConfig())
function loadAIConfig(){
  const raw = localStorage.getItem(AI_CFG_KEY)
  const def = { weekdayWeight:1.00, weatherWeight:1.00, holidayWeight:1.00, trendSensitivity:1.06, tagBoost:1.03 }
  if(!raw) return def
  try{ return Object.assign(def, JSON.parse(raw)||{}) }catch{ return def }
}
function saveAIConfig(){ localStorage.setItem(AI_CFG_KEY, JSON.stringify(aiConfig)); toast('已儲存 AI 規則') }

function buildAIContext(d){
  const weather=fakeWeatherOf(d)
  const holiday=holidayOf(d)
  const weekdayName='日一二三四五六'[new Date(d).getDay()]
  const reasons=[`星期${weekdayName}`, weather==='sunny'?'晴朗':weather==='rainy'?'降雨':weather==='hot'?'高溫':'降溫', holiday==='festival'?'節慶':'一般日']
  return { weather, holiday, reasons }
}

const aiRows = reactive([])
const step = r => Math.max(1, Math.round((r.suggest||1)*0.1))
const sumAI = computed(()=> aiRows.filter(r=>r.checked).reduce((s,r)=> s + (Number(r.finalQty)||0), 0))
const selectAllAI = on => aiRows.forEach(r => (r.checked = !!on))
const runAI = () => {
  aiRows.splice(0)
  const v = vendors.find(x=>x.id===ui.vendorId)
  const sourceIds = (v?.productIds?.length ? v.productIds : ingredients.map(x=>x.id))
  const ctx = buildAIContext(ui.date)

  sourceIds.map(id=>ingredients.find(i=>i.id===id)).filter(Boolean).forEach(it=>{
    const base = avgLastNDays(it.id, 30)
    const wday = weekdayFactor(ui.date) ** aiConfig.weekdayWeight
    const trend= trendFactor(it.id)
    const weather = (weatherFactorBase(ctx.weather)) ** aiConfig.weatherWeight
    const holiday = (holidayFactorBase(ctx.holiday)) ** aiConfig.holidayWeight
    const tag = it.tags?.length ? aiConfig.tagBoost : 1.0

    const demand = Math.max(0, Math.round(base*wday*trend*weather*holiday*tag))
    const safe  = it.safeStock ?? 0
    const stock = it.stock ?? 0
    const suggest = Math.max(0, demand + safe - stock)
    aiRows.push({ id:it.id, name:it.name, unit:it.unit, stock, suggest, finalQty:suggest, checked:suggest>0, reasons:ctx.reasons })
  })
}
watch(() => [ui.date, ui.vendorId], () => runAI(), { immediate: true })

/* 手動打單 */
const qProduct = ref('')
const manualRows = reactive([])
const filteredProducts = computed(()=>{
  const v = vendors.find(x=>x.id===ui.vendorId)
  const allowed = new Set(v?.productIds?.length ? v.productIds : ingredients.map(i=>i.id))
  const q = qProduct.value.trim()
  return ingredients.filter(i=>allowed.has(i.id)).filter(i=>!q || i.name.includes(q))
})
function addAllFiltered(){ filteredProducts.value.forEach(it=>{ if(!manualRows.some(r=>r.id===it.id)) manualRows.push({ id:it.id, name:it.name, unit:it.unit, stock:it.stock??0, qty:0 }) }) }
const removeManualRow = id => { const i=manualRows.findIndex(r=>r.id===id); if(i>=0) manualRows.splice(i,1) }
function startManual(){ tab.value='compose'; mode.value='manual'; manualRows.splice(0) }
const sumManual = computed(()=> manualRows.reduce((s,r)=> s + (Number(r.qty)||0), 0))

/* 建單流程 */
function buildOrderItemsFromCurrentForm(){
  return mode.value==='ai'
    ? aiRows.filter(r=>r.checked && r.finalQty>0).map(r=>({ ingredientId:r.id, qty:r.finalQty }))
    : manualRows.filter(r=>r.qty>0).map(r=>({ ingredientId:r.id, qty:r.qty }))
}
function saveDraft(source){
  const items = buildOrderItemsFromCurrentForm()
  const o = { id:rid(), date:ui.date, vendorId:ui.vendorId, storeId:ui.storeId, source, status:'draft', items }
  orders.unshift(o); persistOrders(); toast('已存成草稿')
}
function submitOrder(source){
  const items = buildOrderItemsFromCurrentForm()
  if (!items.length) return toast('沒有可送出的品項')
  const o = { id:rid(), date:ui.date, vendorId:ui.vendorId, storeId:ui.storeId, source, status:'pending', items }
  orders.unshift(o); persistOrders(); toast('已送出審核')
}
function approveOrder(id){ if(!isBoss.value) return; const o=orders.find(x=>x.id===id); if(!o) return; o.status='approved'; persistOrders(); toast('已核准') }
function rejectOrder(id){ if(!isBoss.value) return; const o=orders.find(x=>x.id===id); if(!o) return; o.status='rejected'; persistOrders(); toast('已退回') }
function sendOrder(id){ if(!isBoss.value) return; const o=orders.find(x=>x.id===id); if(!o) return; o.status='sent'; persistOrders(); toast('已送出') }
const statusText = s => s==='draft'?'草稿':s==='pending'?'待審核':s==='approved'?'已核准':s==='rejected'?'已退回':'已送出'

/* 依範圍 orders */
const scopeOrders = computed(() =>
  orders.filter(o => isBoss.value
    ? (scopeType.value==='all' ? true : o.storeId===scopeStoreId.value)
    : o.storeId === ui.storeId)
)

/* KPI / 排行 / 異常 */
const kpi = computed(()=> {
  const d=today(), ts=scopeOrders.value.filter(o=>o.date===d)
  return { todayTotal: ts.length, todayPending: ts.filter(o=>o.status==='pending').length, todayApproved: ts.filter(o=>o.status==='approved').length, todaySent: ts.filter(o=>o.status==='sent').length }
})
const topVendors = computed(()=> {
  const since=dateOffset(today(),-7), map=new Map()
  scopeOrders.value.filter(o=>o.date>=since).forEach(o=> map.set(o.vendorId,(map.get(o.vendorId)||0)+1))
  return Array.from(map,([id,count])=>({id,count})).sort((a,b)=>b.count-a.count).slice(0,6)
})
const hotItems = computed(()=> {
  const since=dateOffset(today(),-7), map=new Map()
  scopeOrders.value.filter(o=>o.date>=since).forEach(o=> o.items.forEach(it=> map.set(it.ingredientId,(map.get(it.ingredientId)||0)+it.qty)))
  return Array.from(map,([id,qty])=>({id,qty})).sort((a,b)=>b.qty-a.qty).slice(0,6)
})
const suspiciousOrders = computed(()=> {
  const out=[], byKey=new Map()
  scopeOrders.value.forEach(o=>{ const key=`${o.date}|${o.storeId}|${o.vendorId}`; byKey.set(key,(byKey.get(key)||0)+1) })
  scopeOrders.value.forEach(o=>{ const qty=o.items.reduce((s,it)=>s+Number(it.qty||0),0); const key=`${o.date}|${o.storeId}|${o.vendorId}`; const burst=(byKey.get(key)||0); if(burst>=3 || qty>=50) out.push(o) })
  const since=dateOffset(today(),-2)
  return out.filter(o=>o.date>=since).sort((a,b)=> (a.date<b.date?1:-1))
})

/* 設定頁：僅顯示有被勾選品項的來源（員工） */
const visibleVendors = computed(() => {
  return isBoss.value ? vendors : vendors.filter(v => Array.isArray(v.productIds) && v.productIds.length > 0)
})
function vendorProducts(vid){
  const v = vendors.find(x=>x.id===vid)
  const ids = new Set(v?.productIds || [])
  return ingredients.filter(i => ids.has(i.id))
}

/* 紀錄 */
const logFilter = reactive({ from:'', to:'', status:'', vendorId:'' })
const filteredLogs = computed(()=> scopeOrders.value
  .filter(o=> !logFilter.status   || o.status===logFilter.status)
  .filter(o=> !logFilter.vendorId || o.vendorId===logFilter.vendorId)
  .filter(o=> !logFilter.from     || o.date>=logFilter.from)
  .filter(o=> !logFilter.to       || o.date<=logFilter.to)
  .sort((a,b)=> (a.date<b.date?1:-1))
)
const resetLogFilter = () => { logFilter.from=''; logFilter.to=''; logFilter.status=''; logFilter.vendorId='' }

/* 來源維護（老闆） */
const newVendorName = ref('')
function createVendor(){ if(!isBoss.value) return; const v = { id: rid(), name: newVendorName.value, productIds: [] }; vendors.push(v); newVendorName.value=''; persistVendors(); toast('已新增來源') }
function renameVendor(v){ if(!isBoss.value) return; const n = prompt('輸入新名稱', v.name); if(!n) return; v.name = n; persistVendors(); toast('已更名') }
function removeVendor(id){ if(!isBoss.value) return; if(!confirm('確定刪除此來源？')) return; const i=vendors.findIndex(x=>x.id===id); if(i>=0) vendors.splice(i,1); persistVendors(); toast('已刪除') }
function toggleProduct(vid,pid){
  if(!isBoss.value) return
  const v = vendors.find(x=>x.id===vid); if(!v) return
  const set = new Set(v.productIds||[])
  set.has(pid) ? set.delete(pid) : set.add(pid)
  v.productIds = Array.from(set); persistVendors()
}

/* 匯入/匯出 */
function exportJSON(){
  const data = { vendors, orders }
  const blob = new Blob([JSON.stringify(data,null,2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href=url; a.download='boss-orders.json'; a.click()
  URL.revokeObjectURL(url)
}
function importJSON(e){
  const f = e.target.files?.[0]; if(!f) return
  const reader = new FileReader()
  reader.onload = () => {
    try{
      const obj = JSON.parse(String(reader.result))
      if (obj.vendors && isBoss.value) { vendors.splice(0); obj.vendors.forEach(v=>vendors.push(v)); persistVendors() }
      if (obj.orders)  { orders.splice(0);  obj.orders.forEach(o=>orders.push(o));  persistOrders() }
      toast('已匯入資料')
    }catch{ toast('匯入失敗：格式錯誤') }
  }
  reader.readAsText(f,'utf-8')
}

/* 本地儲存 + seed */
function loadStores(){
  const snap = read?.() || {}
  if (Array.isArray(snap.stores) && snap.stores.length) {
    return snap.stores.map(s=>({ id:String(s.id), name:String(s.name) }))
  }
  const raw = localStorage.getItem('boss-stores'); if(raw){ try{ return JSON.parse(raw) }catch{} }
  const s = [
    { id: rid(), name:'海南雞 台北店' },
    { id: rid(), name:'海南雞 台中店' },
    { id: rid(), name:'海南雞 高雄店' },
    { id: rid(), name:'海南雞 中央廚房' },
  ]
  localStorage.setItem('boss-stores', JSON.stringify(s)); return s
}
function loadIngredients(){
  const snap = read?.() || {}
  if (Array.isArray(snap.products) && snap.products.length){
    return snap.products.map(p => ({
      id: String(p.id), name: p.name, unit: p.unit || '份',
      stock: 0, safeStock: Number(p.safeStock ?? 0), tags: p.cat ? [p.cat] : []
    }))
  }
  if (Array.isArray(snap.inventory) && snap.inventory.length){
    const bySku = new Map()
    snap.inventory.forEach(r=>{
      const key = r.sku || r.id || r.name
      if (!bySku.has(key)) bySku.set(key, { id:String(key), name:r.name, unit:r.unit||'份', stock:0, safeStock:5, tags:[] })
      bySku.get(key).stock += (r.qty??0)
    })
    return Array.from(bySku.values())
  }
  const raw = localStorage.getItem('boss-ingredients'); if(raw){ try{
    const obj=JSON.parse(raw); if(Array.isArray(obj.ingredients)) return obj.ingredients; if(Array.isArray(obj)) return obj
  }catch{} }
  const ing = [
    { id: rid(), name:'去骨雞腿（真空包，生）', unit:'包', stock:60, safeStock:20, tags:['半成品'] },
    { id: rid(), name:'雞高湯基底', unit:'桶', stock:12, safeStock: 5, tags:['半成品'] },
    { id: rid(), name:'薑蓉醬', unit:'罐', stock:18, safeStock:10, tags:['調味'] },
    { id: rid(), name:'小黃瓜', unit:'條', stock:50, safeStock:15, tags:['蔬菜'] },
  ]
  localStorage.setItem('boss-ingredients', JSON.stringify({ ingredients: ing, tags: [] }))
  return ing
}
function loadVendors(){
  const raw = localStorage.getItem('boss-vendors'); if(raw){ try{ return JSON.parse(raw) }catch{} }
  const v = [
    { id: rid(), name:'中央廚房',  productIds: ingredients.map(i=>i.id).slice(0,3) },
    { id: rid(), name:'在地蔬菜行', productIds: ingredients.filter(i=>i.tags?.includes('蔬菜')).map(i=>i.id) },
    { id: rid(), name:'生鮮雞肉供應商', productIds: ingredients.filter(i=>/雞/.test(i.name)).map(i=>i.id) },
    { id: rid(), name:'調味品供應', productIds: ingredients.filter(i=>i.tags?.includes('調味')).map(i=>i.id) },
  ]
  localStorage.setItem('boss-vendors', JSON.stringify(v))
  return v
}
function loadOrders(){
  const raw = localStorage.getItem('boss-orders'); if(raw){ try{ return JSON.parse(raw) }catch{} }
  return []
}
const persistOrders  = () => localStorage.setItem('boss-orders', JSON.stringify(orders))
const persistVendors = () => localStorage.setItem('boss-vendors', JSON.stringify(vendors))

/* Toast */
const toastMsg = ref(''); const toast = m => { toastMsg.value=m; setTimeout(()=>toastMsg.value='',1400) }
</script>

<style scoped>
/* 版面與主題 */
.inv-page{ padding:16px; background:var(--bg); color:var(--text); min-height:100%; height:auto; overflow:visible; }
.sticky-top{ position:sticky; top:0; z-index:5; background:var(--card-bg); }
.inv-header{ display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:12px; }
.title{ font-size:20px; font-weight:800; }
.spacer{ flex:1; }

.scope-row{ display:flex; gap:6px; align-items:center; }
.h32{ height:32px; }

.today-counters{ display:flex; gap:6px; align-items:center; }
.pill{ border:1px solid var(--border); background:var(--card-bg); border-radius:999px; padding:4px 8px; font-size:12px }
.pill.ok{ color:#15803d; border-color:#86efac; background:#f0fdf4; }
.pill.warn{ color:#b45309; border-color:#fed7aa; background:#fff7ed; }

.muted{ color:var(--muted); } .small{ font-size:12px } .tiny{ font-size:11px }

/* Tabs */
.inv-tabs{ display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin:8px 0 12px; }
.tab{ border:1px solid var(--border); background:var(--card-bg); color:var(--text); border-radius:10px; padding:8px 12px; cursor:pointer; font-size:14px; }
.tab.active{ background:var(--primary-weak); border-color:var(--primary); color:var(--primary); }

/* Grid */
.inv-grid{ display:grid; grid-template-columns:minmax(260px, 340px) 1fr; gap:12px; min-width:0; }
.card{ background:var(--card-bg); border:1px solid var(--border); border-radius:16px; padding:12px; }
.card-lite{ border:1px dashed var(--border); border-radius:12px; padding:12px; margin-bottom:12px; background:var(--card-bg); }

/* 左側 */
.inv-side{ border:1px solid var(--border); border-radius:16px; overflow:hidden; display:flex; flex-direction:column; }
.side-tools{ display:flex; flex-direction:column; gap:10px; padding:12px; border-bottom:1px solid var(--border); }
.search{ display:flex; align-items:center; gap:6px; border:1px solid var(--border); border-radius:12px; padding:0 10px; min-height:38px; background:var(--card-bg); }
.input{ padding:8px 10px; border-radius:8px; border:1px solid var(--border); background:var(--card-bg); color:var(--text); font-size:14px; }
.input.bare{ border:none; background:transparent; }
.row{ display:flex; align-items:center; } .row.gap{ gap:8px; flex-wrap:wrap; }
.chips{ display:flex; gap:8px; flex-wrap:wrap; }
.chip{ border:1px solid var(--border); border-radius:999px; background:var(--card-bg); color:var(--text); padding:6px 10px; cursor:pointer; font-size:13px; }
.chip.on{ background:var(--primary-weak); border-color:var(--primary); color:var(--primary); }
.chip.ghost{ opacity:.75; }
.chip.disabled{ opacity:.6; pointer-events:none; }

.side-list{ flex:1; max-height:calc(100vh - 260px); overflow:auto; padding:10px 12px 16px; }
.side-item{ display:flex; align-items:flex-start; gap:10px; border:1px solid var(--border); border-radius:10px; padding:10px; margin-bottom:8px; cursor:pointer; background:var(--card-bg); color:var(--text); }
.side-item.active{ outline:2px solid var(--primary); }
.left-col{ display:flex; flex-direction:column; align-items:flex-start; min-width:60px; }
.top-row{ display:flex; gap:6px; flex-wrap:wrap; }
.action-col{ margin-left:auto; align-self:flex-start; }
.mini-ghost{ border:1px solid var(--border); background:var(--card-bg); color:var(--text); border-radius:8px; font-size:12px; padding:4px 8px; cursor:pointer; }

/* 主內容 */
.section-head{ display:flex; flex-wrap:wrap; align-items:flex-start; justify-content:space-between; gap:4px 8px; }
.h3{ margin:0 0 4px; font-size:15px; font-weight:600; }
.hint{ line-height:1.4; }
.warn-text{ color:#b91c1c; }

.kpi-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:12px; }
.kpi{ background:var(--card-bg); border:1px solid var(--border); border-radius:14px; padding:16px; }
.kpi-title{ color:var(--muted); font-size:13px; margin-bottom:6px; }
.kpi-value{ font-size:28px; font-weight:800; } .kpi-value.ok{ color:#15803d } .kpi-value.warn{ color:#b45309 }

.alert-block{ border-color:#fde68a; }

.compose-head{ display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin-bottom:8px; }
.seg{ display:flex; flex-wrap:wrap; gap:6px; }
.segbtn{ border:1px solid var(--border); background:var(--card-bg); color:var(--text); border-radius:10px; padding:6px 10px; cursor:pointer; font-size:13px; }
.segbtn.active{ background:var(--primary-weak); border-color:var(--primary); color:var(--primary); }

.ai-toolbar{ display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin-bottom:8px; }
.flex-title{ display:flex; flex-wrap:wrap; align-items:center; gap:8px; }
.mt-8{ margin-top:8px } .mt-12{ margin-top:12px } .w-full{ width:100% } .w220{ width:220px; max-width:100% } .w90{ width:90px; max-width:100% }

/* 表格 */
.table-wrap{ overflow:auto; border:1px solid var(--border); border-radius:12px; }
.x-scroll{ overflow:auto; }
.tbl{ width:100%; min-width:720px; border-collapse:collapse; }
.tbl th, .tbl td{ padding:10px 12px; border-bottom:1px solid var(--border); text-align:left; vertical-align:top; font-size:13px; }
.tbl thead th{ position:sticky; top:0; background:var(--thead-bg); color:var(--thead-text); z-index:1; }
.tbl tbody tr:hover td{ background:var(--hover-bg); }
.tbl .num{ text-align:right; }
.item-cell .name{ font-weight:600; }

/* 狀態徽章 */
.badge{ display:inline-flex; align-items:center; justify-content:center; min-width:54px; height:24px; border-radius:999px; font-size:12px; padding:0 8px; border:1px solid var(--border); background:var(--hover-bg); color:var(--text); }
.badge.pending{  background:#fff7ed; border-color:#fed7aa; color:#9a3412; }
.badge.draft{    background:#eef2ff; border-color:#c7d2fe; color:#3730a3; }
.badge.approved{ background:#ecfeff; border-color:#bae6fd; color:#075985; }
.badge.rejected{ background:#fef2f2; border-color:#fecaca; color:#7f1d1d; }
.badge.sent{     background:#f0fdf4; border-color:#86efac; color:#166534; }

.tags{ display:flex; flex-wrap:wrap; gap:6px; }
.pill{ display:inline-flex; gap:4px; align-items:center; background:#eef2ff; border:1px solid #c7d2fe; border-radius:999px; padding:2px 8px; font-size:12px; }

.vendor-list{ display:grid; gap:12px; }
.vendor-card{ border:1px solid var(--border); border-radius:12px; background:var(--card-bg); padding:10px 12px; }
.vendor-head{ font-size:14px; font-weight:600; display:flex; gap:8px; align-items:center; cursor:pointer; list-style:none; }
.vendor-head::-webkit-details-marker{ display:none; }
.link{ background:none; border:none; color:var(--primary); font-size:12px; cursor:pointer; padding:0; }
.link.danger{ color:#b91c1c; }
.ml8{ margin-left:8px; }

.ck input{ display:none; }
.ck span{ width:18px; height:18px; border:1px solid var(--border); border-radius:4px; display:inline-block; background:var(--card-bg); position:relative; }
.ck input:checked + span::after{ content:''; position:absolute; inset:2px; background:var(--primary); border-radius:2px; }

/* Buttons */
.btn{ border:1px solid var(--primary); background:var(--card-bg); color:var(--primary); border-radius:10px; padding:8px 12px; cursor:pointer; font-size:13px; }
.btn.primary{ background:var(--primary); border-color:var(--primary); color:#fff; }
.btn.ghost{ border-color:var(--border); color:var(--text); background:var(--card-bg); }
.btn.small{ padding:6px 10px; font-size:12px; }
.file-btn{ position:relative; overflow:hidden } .file-btn input{ position:absolute; inset:0; opacity:0; cursor:pointer }

/* 底部 */
.bottom{ max-width:1200px; margin:12px auto 0; background:var(--card-bg); border:1px solid var(--border); border-radius:16px; padding:12px; }
.row.wrap{ flex-wrap:wrap; row-gap:8px; }

/* Toast */
.toast{ position:fixed; left:50%; bottom:24px; transform:translateX(-50%); background:var(--text); color:#fff; font-size:13px; padding:10px 14px; border-radius:8px; box-shadow:0 10px 30px rgba(0,0,0,.4); z-index:9999; }
.fade-enter-active, .fade-leave-active{ transition:opacity .18s } .fade-enter-from, .fade-leave-to{ opacity:0 }

@media (max-width:1024px){
  .inv-grid{ grid-template-columns:1fr; }
  .side-list{ max-height:none; }
  .tbl{ min-width:640px; }
  .kpi-grid{ grid-template-columns:repeat(2,1fr); }
}
</style>
