<template>
  <div class="login-page ios-safe">
    <div class="bg"></div><div class="bg-overlay"></div>

    <div class="card">
      <div class="top-bar">
        <div class="title-box">📊 銷售分析</div>
        <button class="gear-icon" @click="goSetting">⚙</button>
      </div>

      <div class="filters">
        <select v-model="range" class="input">
          <option value="7">最近 7 天</option>
          <option value="30">最近 30 天</option>
          <option value="90">最近 90 天</option>
        </select>
        <select v-model="store" class="input">
          <option value="">全部門市</option>
          <option value="A">A 店</option>
          <option value="B">B 店</option>
        </select>
      </div>

      <div class="scrollbar">
        <!-- Top 商品 -->
        <div class="section">
          <div class="section-title">熱銷商品 TOP 5</div>
          <ol class="rank">
            <li v-for="(p,i) in topProducts" :key="i">
              <span>{{ i+1 }}.</span>
              <span class="name">{{ p.name }}</span>
              <span class="value">$ {{ p.sales.toLocaleString() }}</span>
            </li>
          </ol>
        </div>

        <!-- 簡要 KPI -->
        <div class="section kpi">
          <div class="kpi-item">
            <div class="kpi-label">總銷售額</div>
            <div class="kpi-value">$ {{ kpi.revenue.toLocaleString() }}</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-label">訂單數</div>
            <div class="kpi-value">{{ kpi.orders.toLocaleString() }}</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-label">客單價</div>
            <div class="kpi-value">$ {{ Math.round(kpi.revenue / kpi.orders).toLocaleString() }}</div>
          </div>
        </div>
      </div>

      <div class="button-group">
        <button class="btn ghost" @click="goBack">返回</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref} from 'vue'
import {useRouter} from 'vue-router'
const router = useRouter()
const goBack = () => router.back()
const goSetting = () => router.push('/setting')

const range = ref('7')
const store = ref('')

const topProducts = ref([
  { name:'雞腿便當', sales: 35200 },
  { name:'牛排餐',   sales: 24800 },
  { name:'蔬食沙拉', sales: 18200 },
  { name:'烤魚套餐', sales: 16500 },
  { name:'玉米濃湯', sales: 9200 },
])

const kpi = ref({ revenue: 1_039_500, orders: 2_430 })
</script>

<style scoped>
.login-page{position:relative;min-height:100vh;display:grid;place-items:center;background:#dceeff;overflow:hidden}
.bg{position:absolute;inset:0;background-image:url('@/assets/food-bg.jpg');background-size:cover;background-position:center;filter:saturate(1.05);transform:scale(1.02)}
.bg-overlay{position:absolute;inset:0;background:radial-gradient(60vmax 60vmax at 80% 20%, rgba(14,165,233,.28), transparent 60%),radial-gradient(50vmax 50vmax at 10% 90%, rgba(99,102,241,.22), transparent 60%),linear-gradient(180deg,#dceeff,#fff);mix-blend-mode:multiply}
.card{position:relative;width:320px;max-width:calc(100% - 32px);background:#fff;border-radius:16px;box-shadow:0 8px 24px rgba(0,0,0,.12);padding:20px;border:1px solid rgba(0,0,0,.08);display:flex;flex-direction:column;z-index:1;height:90vh}
.top-bar{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
.title-box{border:2px solid #000;background:#fff;padding:10px 14px;font-size:1rem;font-weight:700;border-radius:12px}
.gear-icon{background:none;border:none;font-size:20px;cursor:pointer}
.filters{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px}
.input{width:100%;padding:10px;border-radius:10px;border:1px solid #cbd5e1;background:#fff}
.scrollbar{flex:1;overflow-y:auto;padding-right:4px}
.section{border:1px solid #000;border-radius:12px;background:#fff;padding:12px;margin-bottom:12px}
.section-title{font-weight:700;margin-bottom:8px}
.rank{margin:0;padding-left:0;list-style:none;display:grid;gap:6px}
.rank li{display:grid;grid-template-columns:20px 1fr auto;gap:8px;padding:8px;border:1px solid #e5e7eb;border-radius:8px;background:#f8fafc}
.kpi{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.kpi-item{border:1px solid #e5e7eb;border-radius:10px;background:#f8fafc;padding:10px;text-align:center}
.kpi-label{font-size:.85rem;color:#64748b}
.kpi-value{font-weight:800;font-size:1rem}
.button-group{margin-top:10px}
.btn{width:100%;padding:12px;border:none;border-radius:12px;cursor:pointer;font-weight:700;font-size:1rem}
.ghost{background:#e5e7eb;color:#0f172a}
</style>
