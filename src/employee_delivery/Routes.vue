<template>
  <div class="login-page ios-safe">
    <div class="bg"></div><div class="bg-overlay"></div>

    <div class="card">
      <div class="top-bar">
        <div class="title-box">🗺️ 配送路線</div>
        <button class="gear-icon" @click="goSetting">⚙</button>
      </div>

      <!-- 路線摘要 -->
      <div class="route-summary">
        <div class="row"><span>單號</span><span>{{ route.no }}</span></div>
        <div class="row"><span>司機</span><span>{{ route.driver }}</span></div>
        <div class="row"><span>預估里程</span><span>{{ route.km }} km</span></div>
        <div class="row"><span>預估時間</span><span>{{ route.duration }}</span></div>
      </div>

      <!-- 站點列表 -->
      <div class="scrollbar">
        <ol class="stops">
          <li v-for="(s, i) in route.stops" :key="i">
            <div class="stop-row">
              <div class="idx">{{ i+1 }}</div>
              <div class="info">
                <div class="name">{{ s.name }}</div>
                <div class="meta">ETA {{ s.eta }} ・ {{ s.addr }}</div>
              </div>
              <div class="tag" :data-state="s.state">
                {{ s.state==='pending' ? '未到' : s.state==='done' ? '完成' : '配送中' }}
              </div>
            </div>
          </li>
        </ol>
      </div>

      <div class="button-group">
        <button class="btn ghost" @click="goBack">返回</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import {reactive} from 'vue'
import {useRouter, useRoute} from 'vue-router'
const router = useRouter()
const goBack = () => router.back()
const goSetting = () => router.push('/setting')

const route = reactive({
  no: (useRoute().query.id || 'DL-250910-01'),
  driver: '王小明',
  km: 18.4,
  duration: '2 小時',
  stops: [
    { name:'A 店', eta:'10:30', addr:'台北市中山區南京東路 100 號', state:'done' },
    { name:'B 店', eta:'11:10', addr:'台北市大安區復興南路 200 號', state:'onway' },
    { name:'A 店（二次補貨）', eta:'14:20', addr:'台北市中山區南京東路 100 號', state:'pending' },
  ]
})
</script>

<style scoped>
.login-page{position:relative;min-height:100vh;display:grid;place-items:center;background:#dceeff;overflow:hidden}
.bg{position:absolute;inset:0;background-image:url('@/assets/food-bg.jpg');background-size:cover;background-position:center;filter:saturate(1.05);transform:scale(1.02)}
.bg-overlay{position:absolute;inset:0;background:radial-gradient(60vmax 60vmax at 80% 20%, rgba(14,165,233,.28), transparent 60%),radial-gradient(50vmax 50vmax at 10% 90%, rgba(99,102,241,.22), transparent 60%),linear-gradient(180deg,#dceeff,#fff);mix-blend-mode:multiply}
.card{position:relative;width:320px;max-width:calc(100% - 32px);background:#fff;border-radius:16px;box-shadow:0 8px 24px rgba(0,0,0,.12);padding:20px;border:1px solid rgba(0,0,0,.08);display:flex;flex-direction:column;z-index:1;height:90vh}

.top-bar{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
.title-box{border:2px solid #000;background:#fff;padding:10px 14px;font-size:1rem;font-weight:700;border-radius:12px;margin:0}
.gear-icon{background:none;border:none;font-size:20px;cursor:pointer}

/* 摘要 */
.route-summary{border:1px solid #000;border-radius:12px;background:#fff;padding:12px;margin-bottom:8px}
.route-summary .row{display:flex;justify-content:space-between;padding:6px 0;border-top:1px dashed #e5e7eb}
.route-summary .row:first-of-type{border-top:none}

/* 站點列表 */
.scrollbar{flex:1;overflow-y:auto;padding-right:4px}
.stops{margin:0;padding-left:0;list-style:none;display:grid;gap:8px}
.stop-row{display:grid;grid-template-columns:28px 1fr auto;gap:8px;align-items:center;border:1px solid #000;border-radius:12px;background:#f8fafc;padding:10px}
.idx{width:28px;height:28px;border:1px solid #000;border-radius:999px;display:grid;place-items:center;font-weight:800;background:#fff}
.info .name{font-weight:800}
.info .meta{font-size:.85rem;color:#64748b}
.tag{padding:4px 8px;border:1px solid #000;border-radius:999px;font-size:.85rem;background:#fff}
.tag[data-state="onway"]{background:#fef9c3}
.tag[data-state="done"]{background:#dcfce7}

/* 返回 */
.button-group{margin-top:10px}
.btn{width:100%;padding:12px;border:none;border-radius:12px;cursor:pointer;font-weight:700;font-size:1rem}
.ghost{background:#e5e7eb;color:#0f172a}
</style>
