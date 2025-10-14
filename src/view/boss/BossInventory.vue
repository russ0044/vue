<template>
  <section>
    <h2 class="section-title">店面庫存</h2>

    <div class="toolbar">
      <label>店面：
        <select v-model="storeId" class="input">
          <option v-for="s in d.stores" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
      </label>
      <input class="input" v-model.trim="q" placeholder="搜尋品名 / SKU" />
    </div>

    <div class="card">
      <table class="table">
        <thead>
          <tr><th>SKU</th><th>品名</th><th>數量</th><th>單位</th><th>效期</th><th>狀態</th></tr>
        </thead>
        <tbody>
          <tr v-for="i in filtered" :key="i.storeId+i.sku">
            <td>{{ i.sku }}</td>
            <td>{{ i.name }}</td>
            <td>{{ i.qty }}</td>
            <td>{{ i.unit }}</td>
            <td>{{ i.exp || '-' }}</td>
            <td><span :class="badge(i)">{{ stateText(i) }}</span></td>
          </tr>
          <tr v-if="filtered.length===0"><td colspan="6" class="muted">無資料</td></tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { reactive, ref, computed, watch } from 'vue'
import { read } from '@/store/datasource'

const d = reactive(read())
const storeId = ref(d.settings?.store?.defaultStoreId || d.stores[0]?.id || '')
const q = ref('')
watch(()=>read(), v=>Object.assign(d, v)) // 簡單同步

const filtered = computed(()=>{
  const list = d.inventory.filter(i=>i.storeId===storeId.value)
  if(!q.value) return list
  const k=q.value.toLowerCase()
  return list.filter(i=> i.name.toLowerCase().includes(k) || i.sku.toLowerCase().includes(k))
})

const thDict = computed(()=> Object.fromEntries(d.thresholds.map(t=>[t.storeId,t])))
function stateText(i){
  const rule = thDict.value[i.storeId]
  const low = rule?.minQty ?? i.low ?? 0  
  if ((i.qty||0) < low) return '低於門檻'
  return 'OK'
}
function badge(i){ return stateText(i)==='OK' ? 'badge-ok':'badge-warn' }
</script>

<style scoped>
.section-title{font-size:20px;margin:6px 0 10px}
.toolbar{display:flex;gap:10px;align-items:center;margin-bottom:10px}
.input{padding:.45rem .6rem;border:1px solid #cbd5e1;border-radius:8px}
.card{background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:auto}
.table{width:100%;border-collapse:collapse}
.table th,.table td{padding:10px;border-bottom:1px solid #f1f5f9;text-align:left}
.muted{color:#64748b;text-align:center}
.badge-ok{color:#059669}
.badge-warn{color:#b45309}
</style>
