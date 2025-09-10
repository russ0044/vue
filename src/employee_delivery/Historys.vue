 <template>
  <div class="login-page ios-safe">
    <div class="bg"></div><div class="bg-overlay"></div>

    <div class="card">
      <div class="top-bar">
        <div class="title-box">🗂️ 歷史配送</div>
        <button class="gear-icon" @click="goSetting">⚙</button>
      </div>

      <div class="filters">
        <input type="date" v-model="start" class="input" />
        <input type="date" v-model="end" class="input" />
      </div>

      <div class="scrollbar">
        <div class="table">
          <div class="thead">
            <span>日期</span><span>單號</span><span>門市</span><span>狀態</span>
          </div>
          <div class="trow" v-for="h in history" :key="h.id">
            <span>{{ h.date }}</span>
            <span>{{ h.id }}</span>
            <span>{{ h.store }}</span>
            <span>{{ stateLabel(h.state) }}</span>
          </div>
        </div>

        <div class="summary">
          共 {{ history.length }} 筆
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

const start = ref('2025-09-01')
const end   = ref('2025-09-10')

const history = ref([
  { date:'2025/09/09', id:'DL-250909-01', store:'A 店', state:'done' },
  { date:'2025/09/08', id:'DL-250908-02', store:'B 店', state:'done' },
  { date:'2025/09/08', id:'DL-250908-01', store:'A 店', state:'done' },
])

const stateLabel = (s)=> s==='done' ? '已完成' : s==='onway' ? '配送中' : '待出發'
</script>

<style scoped>
.login-page{position:relative;min-height:100vh;display:grid;place-items:center;background:#dceeff;overflow:hidden}
.bg{position:absolute;inset:0;background-image:url('@/assets/food-bg.jpg');background-size:cover;background-position:center;filter:saturate(1.05);transform:scale(1.02)}
.bg-overlay{position:absolute;inset:0;background:radial-gradient(60vmax 60vmax at 80% 20%, rgba(14,165,233,.28), transparent 60%),radial-gradient(50vmax 50vmax at 10% 90%, rgba(99,102,241,.22), transparent 60%),linear-gradient(180deg,#dceeff,#fff);mix-blend-mode:multiply}
.card{position:relative;width:320px;max-width:calc(100% - 32px);background:#fff;border-radius:16px;box-shadow:0 8px 24px rgba(0,0,0,.12);padding:20px;border:1px solid rgba(0,0,0,.08);display:flex;flex-direction:column;z-index:1;height:90vh}

.top-bar{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
.title-box{border:2px solid #000;background:#fff;padding:10px 14px;font-size:1rem;font-weight:700;border-radius:12px;margin:0}
.gear-icon{background:none;border:none;font-size:20px;cursor:pointer}

.filters{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px}
.input{width:100%;padding:10px;border-radius:10px;border:1px solid #cbd5e1;background:#fff}

.scrollbar{flex:1;overflow-y:auto;padding-right:4px}
.table{border:1px solid #000;border-radius:12px;overflow:hidden;background:#fff}
.thead,.trow{display:grid;grid-template-columns:1fr 1.2fr .8fr .8fr;gap:8px;padding:10px 12px}
.thead{background:#f1f5f9;font-weight:700;border-bottom:1px solid #000}
.trow + .trow{border-top:1px solid #e5e7eb}

.summary{margin-top:10px;font-weight:700;text-align:right}

.button-group{margin-top:10px}
.btn{width:100%;padding:12px;border:none;border-radius:12px;cursor:pointer;font-weight:700;font-size:1rem}
.ghost{background:#e5e7eb;color:#0f172a}
</style>
