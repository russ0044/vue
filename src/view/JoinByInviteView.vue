<template>
  <div class="wrap">
    <form class="card" @submit.prevent="onJoin">
      <h1>以邀請碼加入</h1>

      <label>邀請碼
        <input v-model.trim="code" placeholder="輸入邀請碼（8 碼）" required />
      </label>

      <div v-if="checked">
        <p v-if="inviteOk" class="ok">
          邀請碼有效，角色：<b>{{ roleLabel(invite.role) }}</b>，有效至 {{ fmt(invite.expiresAt) }}
        </p>
        <p v-else class="err">{{ inviteMsg }}</p>
      </div>

      <label>姓名<input v-model.trim="name" required /></label>
      <label>聯絡電話<input v-model.trim="phone" /></label>

      <!-- 讓受邀者自行設定密碼（之後接 Firebase Auth 就能用） -->
      <label>設定密碼（至少8碼，含大小寫與數字）
        <input :type="show?'text':'password'" v-model.trim="password" required />
      </label>
      <button type="button" class="ghost" @click="show=!show">{{ show?'隱藏':'顯示' }}</button>

      <p v-if="msg" :class="ok?'ok':'err'">{{ msg }}</p>

      <div class="actions">
        <button class="primary" type="submit" :disabled="!canSubmit || loading">
          {{ loading ? '加入中…' : '確認加入' }}
        </button>
        <button type="button" @click="goLogin" :disabled="loading">返回登入</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/store/auth'
import { useRoleStore } from '@/store/roleStore'
import { ds } from '@/store/datasource'

const router = useRouter()
const { login } = useAuth()
const { setRole } = useRoleStore()

const code = ref('')
const name = ref('')
const phone = ref('')
const password = ref('')
const show = ref(false)
const msg = ref('')
const ok = ref(false)
const loading = ref(false)

const invite = ref({ role:'', expiresAt:0 })
const checked = ref(false)

watch(code, v => { checked.value=false; msg.value='' })

const inviteCheck = computed(()=>{
  if(!code.value) return { ok:false, reason:'empty' }
  return ds.verifyInvite(code.value)
})
const inviteOk = computed(()=> checked.value && inviteCheck.value.ok)
const inviteMsg = computed(()=>{
  if(!checked.value) return ''
  const r = inviteCheck.value.reason
  return r==='not_found' ? '邀請碼不存在或已被撤銷'
       : r==='expired'   ? '邀請碼已到期'
       : r==='used'      ? '邀請碼已被使用'
       : '邀請碼無效'
})

const pwOk = computed(()=> /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password.value))
const canSubmit = computed(()=> code.value && name.value && pwOk.value)

function roleLabel(r){ return r==='Boss'?'老闆':r==='Kitchen'?'中央廚房':'員工' }
function fmt(t){ const d=new Date(t); const z=n=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}` }
function goLogin(){ router.push('/login') }

async function onJoin(){
  msg.value=''; ok.value=false
  if(!pwOk.value){ msg.value='密碼需 8 碼以上，並包含大寫、小寫與數字'; return }

  // 第一次按「確認加入」→ 先檢查一次邀請碼
  if(!checked.value){
    const res = inviteCheck.value
    checked.value = true
    if(!res.ok){ msg.value = inviteMsg.value; return }
    invite.value = res
    // 不 return，繼續往下直接完成加入（體驗更順）
  }

  const res = inviteCheck.value
  if(!res.ok){ msg.value = inviteMsg.value; return }

  try{
    loading.value = true
    // 新增使用者（受邀者）：老闆以外的角色，由邀請碼決定
    const role = res.role
    const roleGroupId = role==='Employee' ? 'RG-EMP' : 'RG-CK'
    ds.addUser({ email: `${crypto.randomUUID()}@invite.local`, name: name.value, phone: phone.value, roleGroupId })
    ds.markInviteUsed(res.code)

    // 自動登入（之後接 Firebase 就改為 Auth 建帳 + signIn）
    login({ name: name.value, role })
    setRole(role)

    ok.value = true
    msg.value = '加入成功，前往庫存頁…'
    router.push('/boss/inventory')
  }catch(e){
    msg.value = e?.message || '加入失敗，請稍後再試'
  }finally{
    loading.value = false
  }
}
</script>

<style scoped>
.wrap{min-height:100vh;display:grid;place-items:center;background:#f1f5f9;padding:16px}
.card{background:#fff;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.06);padding:20px;width:min(92vw,560px)}
label{display:flex;flex-direction:column;gap:6px;margin:6px 0}
input,select{padding:.6rem .7rem;border:1px solid #cbd5e1;border-radius:10px}
.actions{display:flex;gap:8px;margin-top:10px}
.primary{background:#2563eb;color:#fff;border:none;border-radius:10px;padding:10px 14px}
.ghost{align-self:flex-start;margin-top:-6px;border:1px solid #e2e8f0;background:#fff;border-radius:8px;padding:4px 8px}
.err{color:#dc2626;font-size:.9rem} .ok{color:#16a34a;font-size:.9rem}
</style>
