<template>
  <div class="login-page ios-safe">
    <div class="bg"></div><div class="bg-overlay"></div>

    <div class="card">
      <!-- 左標題／右設定 -->
      <div class="top-bar">
        <div class="title-box">🚚 今日配送</div>
        <button class="gear-icon" @click="goSetting">⚙</button>
      </div>

      <!-- 篩選 -->
      <div class="filters">
        <select v-model="store" class="input">
          <option value="">全部門市</option>
          <option value="A">A 店</option>
          <option value="B">B 店</option>
        </select>
        <select v-model="status" class="input">
          <option value="">全部狀態</option>
          <option value="pending">待出發</option>
          <option value="onway">配送中</option>
          <option value="done">已完成</option>
        </select>
      </div>

      <!-- 配送卡片列表 -->
      <div class="scrollbar">
        <div class="ship-card" v-for="s in shipments" :key="s.id">
          <div class="ship-header">
            <div class="ship-no">#{{ s.id }}</div>
            <div class="ship-status" :data-state="s.state">
              {{ stateLabel(s.state) }}
            </div>
          </div>
          <div class="ship-row">
            <span>門市</span><span>{{ s.store }}</span>
          </div>
          <div class="ship-row">
            <span>預計抵達</span><span>{{ s.eta }}</span>
          </div>
          <div class="ship-row">
            <span>司機</span><span>{{ s.driver }}</span>
          </div>
          <div class="ship-actions">
            <button class="mini-btn" @click="view(s.id)">查看</button>
            <button class="mini-btn" @click="markDone(s.id)">完成</button>
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

const store = ref('')
const status = ref('')
const shipments = ref([
  { id:'DL-250910-01', store:'A 店', eta:'10:30', driver:'王小明', state:'pending' },
  { id:'DL-250910-02', store:'B 店', eta:'11:10', driver:'李大華', state:'onway'  },
  { id:'DL-250910-03', store:'A 店', eta:'14:20', driver:'陳阿松', state:'done'   },
])

const stateLabel = (s) =>
  s==='pending' ? '待出發' : s==='onway' ? '配送中' : '已完成'

const view = (id)=> router.push({ path:'/delivery/routes', query:{ id }})
const markDone = (id)=> alert(`${id} 已標記完成`)
</script>

<style scoped>
/* 背景與卡片（一致） */
.login-page{position:relative;min-height:100vh;display:grid;place-items:center;background:#dceeff;overflow:hidden}
.bg{position:absolute;inset:0;background-image:url('@/assets/food-bg.jpg');background-size:cover;background-position:center;filter:saturate(1.05);transform:scale(1.02)}
.bg-overlay{position:absolute;inset:0;background:radial-gradient(60vmax 60vmax at 80% 20%, rgba(14,165,233,.28), transparent 60%),radial-gradient(50vmax 50vmax at 10% 90%, rgba(99,102,241,.22), transparent 60%),linear-gradient(180deg,#dceeff,#fff);mix-blend-mode:multiply}
.card{position:relative;width:320px;max-width:calc(100% - 32px);background:#fff;border-radius:16px;box-shadow:0 8px 24px rgba(0,0,0,.12);padding:20px;border:1px solid rgba(0,0,0,.08);display:flex;flex-direction:column;z-index:1;height:90vh}

/* 標題列 */
.top-bar{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
.title-box{border:2px solid #000;background:#fff;padding:10px 14px;font-size:1rem;font-weight:700;border-radius:12px;margin:0}
.gear-icon{background:none;border:none;font-size:20px;cursor:pointer}

/* 篩選 */
.filters{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px}
.input{width:100%;padding:10px;border-radius:10px;border:1px solid #cbd5e1;background:#fff}

/* 列表 */
.scrollbar{flex:1;overflow-y:auto;padding-right:4px}
.ship-card{border:1px solid #000;border-radius:12px;background:#fff;padding:12px;margin-bottom:12px}
.ship-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
.ship-no{font-weight:800}
.ship-status{font-size:.85rem;padding:4px 8px;border:1px solid #000;border-radius:999px}
.ship-status[data-state="pending"]{background:#fff}
.ship-status[data-state="onway"]{background:#fef9c3}
.ship-status[data-state="done"]{background:#dcfce7}
.ship-row{display:flex;justify-content:space-between;padding:6px 0;border-top:1px dashed #e5e7eb}
.ship-row:first-of-type{border-top:none}
.ship-actions{display:flex;gap:8px;margin-top:10px}
.mini-btn{flex:1;padding:8px 10px;border:1px solid #000;border-radius:10px;background:#f8fafc;cursor:pointer;font-weight:700}

/* 返回 */
.button-group{margin-top:10px}
.btn{width:100%;padding:12px;border:none;border-radius:12px;cursor:pointer;font-weight:700;font-size:1rem}
.ghost{background:#e5e7eb;color:#0f172a}
</style>
