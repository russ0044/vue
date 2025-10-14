<template>
  <section>
    <h2 class="section-title">店面管理</h2>

    <div class="toolbar">
      <button class="btn" @click="open=true">新增店面</button>
      <span class="muted">預設店面：{{ defStoreName }}</span>
    </div>

    <div class="card">
      <table class="table">
        <thead><tr><th>名稱</th><th>地址</th><th>電話</th><th>類型</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="s in d.stores" :key="s.id">
            <td>{{ s.name }}</td>
            <td>{{ s.address }}</td>
            <td>{{ s.phone }}</td>
            <td>{{ s.type==='central'?'中央廚房':'門市' }}</td>
            <td>
              <button class="mini" @click="startEdit(s)">改名</button>
              <button class="mini ghost" @click="onDel(s)">刪除</button>
              <button class="mini" @click="setDefault(s.id)">設為預設</button>
            </td>
          </tr>
          <tr v-if="d.stores.length===0"><td colspan="5" class="muted">尚無店面</td></tr>
        </tbody>
      </table>
    </div>

    <!-- 新增 -->
    <dialog v-if="open" open class="dlg">
      <div class="dlg-card">
        <h3>新增店面</h3>
        <label>名稱<input v-model.trim="form.name"></label>
        <label>地址<input v-model.trim="form.address"></label>
        <label>電話<input v-model.trim="form.phone"></label>
        <label>類型
          <select v-model="form.type">
            <option value="branch">門市</option>
            <option value="central">中央廚房</option>
          </select>
        </label>
        <p v-if="msg" :class="ok?'ok':'err'">{{ msg }}</p>
        <div class="row">
          <button class="btn" @click="onAdd">新增</button>
          <button class="btn ghost" @click="open=false">取消</button>
        </div>
      </div>
    </dialog>

    <!-- 改名 -->
    <dialog v-if="editing" open class="dlg">
      <div class="dlg-card">
        <h3>修改名稱</h3>
        <input v-model.trim="newName" class="input" />
        <div class="row">
          <button class="btn" @click="onRename">儲存</button>
          <button class="btn ghost" @click="editing=null">取消</button>
        </div>
      </div>
    </dialog>
  </section>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { read, addStore, renameStore, deleteStore, setDefaultStore } from '@/store/datasource'

const d = reactive(read())
const open = ref(false)
const form = reactive({ name:'', address:'', phone:'', type:'branch' })
const msg = ref(''), ok = ref(false)

const editing = ref(null); const newName = ref('')
const defStoreName = computed(()=> d.stores.find(s=>s.id===d?.settings?.store?.defaultStoreId)?.name || '-')

function refresh(){ Object.assign(d, read()) }
function onAdd(){
  try{ addStore(form); ok.value=true; msg.value='新增完成'; open.value=false; Object.assign(form,{name:'',address:'',phone:'',type:'branch'}); refresh() }
  catch(e){ ok.value=false; msg.value=e.message||'新增失敗' }
}
function onDel(s){
  if(!confirm(`刪除店面「${s.name}」？`)) return
  try{ deleteStore(s.id); refresh() }catch(e){ alert(e.message||'刪除失敗') }
}
function startEdit(s){ editing.value=s; newName.value=s.name }
function onRename(){
  try{ renameStore(editing.value.id, newName.value); editing.value=null; refresh() }
  catch(e){ alert(e.message||'儲存失敗') }
}
function setDefault(id){ setDefaultStore(id); refresh() }
</script>

<style scoped>
.section-title{font-size:20px;margin:6px 0 10px}
.toolbar{display:flex;gap:10px;align-items:center;margin-bottom:10px}
.btn{padding:.5rem .8rem;border:none;border-radius:8px;background:#2563eb;color:#fff;cursor:pointer}
.btn.ghost{background:#e5e7eb;color:#222}
.mini{padding:.35rem .5rem;border:1px solid #cbd5e1;border-radius:6px;background:#fff;cursor:pointer}
.card{background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:auto}
.table{width:100%;border-collapse:collapse}
.table th,.table td{padding:10px;border-bottom:1px solid #f1f5f9;text-align:left}
.muted{color:#64748b;text-align:center}
.dlg{border:none;background:transparent}
.dlg-card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:14px;min-width:320px}
.row{display:flex;gap:8px;justify-content:flex-end;margin-top:8px}
.ok{color:#16a34a}.err{color:#dc2626}
.input{padding:.45rem .6rem;border:1px solid #cbd5e1;border-radius:8px}
</style>
