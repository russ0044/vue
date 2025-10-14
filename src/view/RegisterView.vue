<template>
  <div class="wrap">
    <form class="card" @submit.prevent="onSubmit">
      <h1>註冊新帳號</h1>

      <!-- 邀請碼提示 -->
      <div v-if="inviteInfo.checked" class="notice" :data-type="inviteInfo.ok ? 'ok' : 'err'">
        <template v-if="inviteInfo.ok">
          來自邀請碼：<code>{{ inviteInfo.code }}</code>（角色：<b>{{ roleLabel(inviteInfo.role) }}</b>），
          有效至 {{ fmt(inviteInfo.expiresAt) }}。角色已鎖定。
        </template>
        <template v-else>邀請碼無效：{{ inviteInfoMsg }}</template>
      </div>

      <label>Email
        <input type="email" v-model.trim="email" placeholder="you@example.com" required>
      </label>

      <label>密碼（至少8碼，含大小寫與數字）
        <input :type="showPw?'text':'password'" v-model.trim="password" required>
      </label>
      <button type="button" class="ghost" @click="showPw=!showPw">{{ showPw?'隱藏':'顯示' }}</button>

      <label>我是（角色）
        <select v-model="role" :disabled="inviteInfo.ok">
          <option value="Boss">老闆（主帳號管理者）</option>
          <option value="Employee">員工</option>
          <option value="Kitchen">中央廚房</option>
        </select>
      </label>

      <hr>
      <h2>店家資訊</h2>
      <label>店家名稱<input v-model.trim="shopName" required></label>
      <label>聯絡電話<input v-model.trim="shopPhone" required></label>

      <details>
        <summary>建立第一家門市 / 中央廚房</summary>
        <label>門市名稱<input v-model.trim="storeName" required></label>
        <label>地址<input v-model.trim="storeAddr" required></label>
        <label>電話<input v-model.trim="storePhone" required></label>
        <label>類型
          <select v-model="storeType">
            <option value="branch">門市</option>
            <option value="central">中央廚房</option>
          </select>
        </label>
      </details>

      <p v-if="msg" :class="ok?'ok':'err'">{{ msg }}</p>

      <div class="actions">
        <button class="primary" type="submit" :disabled="!canSubmit || loading">{{ loading?'建立中…':'完成註冊' }}</button>
        <button type="button" @click="goLogin" :disabled="loading">返回登入</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/store/auth'
import { useRoleStore } from '@/store/roleStore'
import { ds, verifyInvite, markInviteUsed, emailExists, addUser, addStore, read, setDefaultStore } from '@/store/datasource'

const router = useRouter(), route = useRoute()
const { login } = useAuth()
const { setRole } = useRoleStore()

// 表單
const email = ref(''), password = ref(''), showPw = ref(false)
const role = ref('Boss')
const shopName = ref(''), shopPhone = ref('')
const storeName = ref('雲科店'), storeAddr = ref('斗六鎮學府路1號'), storePhone = ref('05-1234567'), storeType = ref('branch')
const msg = ref(''), ok = ref(false), loading = ref(false)

// 邀請碼資訊
const inviteInfo = ref({ checked:false, ok:false, role:'', expiresAt:0, code:'', reason:'' })
const inviteInfoMsg = computed(()=>{
  if(!inviteInfo.value.checked || inviteInfo.value.ok) return ''
  const r=inviteInfo.value.reason
  return r==='not_found'?'邀請碼不存在或已被撤銷':r==='expired'?'邀請碼已到期':r==='used'?'邀請碼已被使用':'邀請碼無效'
})
onMounted(()=>{
  const code = route.query.invite
  if(!code){ inviteInfo.value.checked=true; return }
  const res = verifyInvite(code)
  inviteInfo.value = { checked:true, ...res, code }
  if(res.ok) role.value = res.role
})

const emailOk = computed(()=> /\S+@\S+\.\S+/.test(email.value))
const pwOk = computed(()=> /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password.value))
const baseOk = computed(()=> shopName.value && shopPhone.value && storeName.value && storeAddr.value && storePhone.value)
const inviteOk = computed(()=> !inviteInfo.value.checked || inviteInfo.value.ok)
const canSubmit = computed(()=> emailOk.value && pwOk.value && baseOk.value && inviteOk.value)

const role2Group = r => r==='Boss'?'RG-BOSS':r==='Employee'?'RG-EMP':'RG-CK'
const roleLabel = r => r==='Boss'?'老闆':r==='Kitchen'?'中央廚房':'員工'
function fmt(t){ const d=new Date(t); const z=n=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}` }
function goLogin(){ router.push('/login') }

async function onSubmit(){
  msg.value=''; ok.value=false
  if(!emailOk.value){ msg.value='請輸入有效的電子郵件地址'; return }
  if(!pwOk.value){ msg.value='密碼需 8 碼以上，並包含大寫、小寫與數字'; return }
  if(!inviteOk.value){ msg.value=inviteInfoMsg.value; return }

  try{
    loading.value=true
    if(emailExists(email.value)){ msg.value='此電子郵件已被註冊，請使用其他信箱註冊'; return }

    addUser({ email:email.value, name:shopName.value, phone:shopPhone.value, roleGroupId:role2Group(role.value) })
    addStore({ name:storeName.value, address:storeAddr.value, phone:storePhone.value, type:storeType.value })
    const all = read(); const last = [...(all.stores||[])].pop(); if(last?.id) setDefaultStore(last.id)
    if(inviteInfo.value.ok && inviteInfo.value.code) markInviteUsed(inviteInfo.value.code)

    login({ name:shopName.value, role:role.value, email:email.value }); setRole(role.value)
    ok.value=true; msg.value='註冊成功，前往店面管理…'
    setTimeout(()=> router.push('/boss/stores'), 500)
  }catch(e){ msg.value = e?.message || '註冊失敗，請稍後再試' }
  finally{ loading.value=false }
}
</script>

<style scoped>
.wrap{min-height:100vh;display:grid;place-items:center;background:#f1f5f9;padding:16px}
.card{background:#fff;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.06);padding:20px;width:min(92vw,560px)}
h1{margin:.2rem 0 8px} h2{margin:10px 0 6px;font-size:1.05rem}
label{display:flex;flex-direction:column;gap:6px;margin:6px 0}
input,select{padding:.6rem .7rem;border:1px solid #cbd5e1;border-radius:10px}
details{margin:6px 0;padding:8px;border:1px dashed #e5e7eb;border-radius:10px;background:#fcfcfd}
.actions{display:flex;gap:8px;margin-top:10px}
.primary{background:#2563eb;color:#fff;border:none;border-radius:10px;padding:10px 14px}
.ghost{align-self:flex-start;margin-top:-6px;border:1px solid #e2e8f0;background:#fff;border-radius:8px;padding:4px 8px}
.err{color:#dc2626;font-size:.9rem} .ok{color:#16a34a;font-size:.9rem}
.notice{margin:6px 0 10px;padding:10px;border-radius:10px}
.notice[data-type="ok"]{background:#e7f3ff;border:1px solid #bfd7ff}
.notice[data-type="err"]{background:#ffe8e8;border:1px solid #ffc9c9}
code{background:#f1f5f9;padding:2px 6px;border-radius:6px}
</style>
