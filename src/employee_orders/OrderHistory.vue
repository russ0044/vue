<template>
  <div class="dashboard-container">
    <div class="dashboard-box">
      <div class="top-bar">
        <div class="title-box">訂單紀錄</div>
        <button class="gear-icon" @click="goToSetting">⚙</button>
      </div>

      <div class="toolbar">
        <input class="date" type="date" v-model="date" />
        <select class="select" v-model="status">
          <option value="">全部</option>
          <option value="pending">待處理</option>
          <option value="preparing">備餐中</option>
          <option value="ready">可取餐</option>
          <option value="done">已完成</option>
          <option value="cancelled">已取消</option>
        </select>
      </div>

      <div class="scrollbar">
        <div class="record-card" v-for="r in filtered" :key="r.id">
          <div class="row">
            <div class="id">#{{ r.id }}</div>
            <div class="state">{{ stateText(r.state) }}</div>
          </div>
          <div class="row small">
            <div>顧客：{{ r.customer }}</div>
            <div>日期：{{ r.date }} {{ r.time }}</div>
          </div>
          <div class="row small">
            <div>金額：$ {{ r.amount }}</div>
            <div>品項數：{{ r.items }}</div>
          </div>
        </div>
      </div>

      <button class="back-button" @click="goBack">◀</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()

const date = ref('')
const status = ref('')
const records = ref([
  { id:'H2001', customer:'王小明', state:'done',      date:'2025-08-25', time:'12:03', amount:320, items:3 },
  { id:'H2002', customer:'陳小美', state:'cancelled', date:'2025-08-25', time:'12:20', amount:0,   items:0 },
  { id:'H2003', customer:'李先生', state:'done',      date:'2025-08-26', time:'09:45', amount:520, items:4 },
  { id:'H2004', customer:'林小姐', state:'ready',     date:'2025-08-27', time:'10:10', amount:260, items:2 },
])

const filtered = computed(() =>
  records.value.filter(r =>
    (date.value ? r.date === date.value : true) &&
    (status.value ? r.state === status.value : true)
  )
)

const stateText = (s) => ({pending:'待處理',preparing:'備餐中',ready:'可取餐',done:'已完成',cancelled:'已取消'}[s] || s)
const goBack = () => router.back()
const goToSetting = () => router.push('/setting')
</script>

<style scoped>
.dashboard-container {
  background: #dceeff;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.dashboard-box {
  background: #fff;
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0,0,0,.1);
  width: 320px;
  height: 90vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-box {
  border: 2px solid #000;
  background: #fff;
  padding: 12px 16px;
  font-size: 18px;
  font-weight: bold;
}

.gear-icon {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
}

.toolbar {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.date,
.select {
  border: 1px solid #999;
  border-radius: 6px;
  padding: 6px 10px;
}

.scrollbar {
  flex: 1;
  overflow-y: auto;
  padding-right: 6px;
  margin-top: 12px;
}

.record-card {
  border: 1px solid #000;
  border-radius: 10px;
  padding: 10px;
  background: #fff;
  margin-bottom: 12px;
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.row.small {
  font-size: 12px;
  color: #666;
  margin-top: 6px;
}

.id {
  font-weight: bold;
}

.state {
  border: 1px solid #000;
  border-radius: 999px;
  padding: 2px 8px;
  background: #fafafa;
}

.back-button {
  position: absolute;
  bottom: 12px;
  left: 12px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
}
</style>
