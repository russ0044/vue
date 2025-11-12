<template>
  <div class="wrap">
    <form class="card" @submit.prevent="onJoin">
      <h1>以邀請碼加入</h1>

      <!-- 邀請碼 -->
      <label class="field">
        <span class="label">邀請碼</span>
        <input
          v-model.trim="code"
          @input="onCodeInput"
          class="input"
          placeholder="XXXX-XXXX（8 碼）"
          maxlength="9"
          autocomplete="one-time-code"
          required
        />
        <small class="hint">格式：英數 4-4（系統會自動轉大寫）</small>
      </label>

      <!-- 邀請碼檢查結果 -->
      <div v-if="checked" class="check">
        <p v-if="inviteOk" class="ok">
          邀請碼有效，角色：<b>{{ roleLabel(invite.role) }}</b>，有效至 {{ fmt(invite.expiresAt) }}
        </p>
        <p v-else class="err">{{ inviteMsg }}</p>
      </div>

      <!-- 基本資料 -->
      <label class="field">
        <span class="label">姓名</span>
        <input v-model.trim="name" class="input" placeholder="請輸入姓名" required />
      </label>

      <label class="field">
        <span class="label">聯絡電話（選填）</span>
        <input v-model.trim="phone" class="input" placeholder="0912-345-678" />
      </label>

      <!-- 密碼 -->
      <label class="field">
        <span class="label">設定密碼</span>
        <div class="pw-box">
          <input
            :type="show ? 'text' : 'password'"
            v-model.trim="password"
            class="input pw-input"
            placeholder="至少 8 碼，需含大小寫與數字"
            required
          />
          <button type="button" class="ghost" @click="show=!show">
            {{ show ? '隱藏' : '顯示' }}
          </button>
        </div>
        <small class="hint" v-if="password && !pwOk">
          密碼需至少 8 碼，並包含大寫、小寫與數字。
        </small>
      </label>

      <!-- 系統訊息 -->
      <p v-if="msg" :class="ok ? 'ok' : 'err'">{{ msg }}</p>

      <!-- 動作 -->
      <div class="actions">
        <button class="primary" type="submit" :disabled="!canSubmit || loading">
          {{ loading ? '加入中…' : '確認加入' }}
        </button>
        <button type="button" class="btn" @click="goLogin" :disabled="loading">返回登入</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/store/auth'
import { useRoleStore } from '@/store/roleStore'
/* 修正重點：這裡要用命名空間 import，而不是 { ds } */
import * as ds from '@/store/datasource'

const router = useRouter()
const { login } = useAuth()
const { setRole } = useRoleStore()

/* 狀態 */
const code = ref('')
const name = ref('')
const phone = ref('')
const password = ref('')
const show = ref(false)
const msg = ref('')
const ok = ref(false)
const loading = ref(false)

const invite = ref({ role: '', expiresAt: 0, code: '' })
const checked = ref(false)

/* 監看：變更邀請碼就清除訊息 */
watch(code, () => { checked.value = false; msg.value = '' })

/* 邀請碼輸入：自動大寫、補上中間連字號（4-4） */
function onCodeInput (e) {
  const raw = String(e.target.value || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  const fmt = raw.slice(0, 8).replace(/^([A-Z0-9]{0,4})([A-Z0-9]{0,4}).*$/, (_, a, b) => (b ? `${a}-${b}` : a))
  code.value = fmt
}

/* 小工具：允許 verifyInvite 回傳值或 Promise（相容各資料源實作） */
async function maybeAsync(fn, ...args) {
  try {
    const ret = fn?.(...args)
    return typeof ret?.then === 'function' ? await ret : ret
  } catch (e) {
    return { ok:false, reason: e?.message || 'error' }
  }
}

/* 檢查邀請碼（每次讀取最新結果，不先固定） */
const inviteCheck = computed(() => code.value ? { ok:true } : { ok:false, reason:'empty' })
const inviteOk = computed(() => checked.value && inviteCheck.value.ok)
const inviteMsg = computed(() => {
  if (!checked.value) return ''
  const r = inviteCheck.value.reason
  return r === 'not_found' ? '邀請碼不存在或已被撤銷'
       : r === 'expired'   ? '邀請碼已到期'
       : r === 'used'      ? '邀請碼已被使用'
       : r === 'error'     ? '驗證時發生錯誤'
       : '邀請碼無效'
})

/* 密碼驗證 */
const pwOk = computed(() => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password.value))
const canSubmit = computed(() => !!code.value && !!name.value && pwOk.value && !loading.value)

/* 顯示用 */
function roleLabel(r) { return r === 'Boss' ? '老闆' : r === 'Kitchen' ? '中央廚房' : '員工' }
function fmt(t) {
  const d = new Date(t)
  const z = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}`
}
function goLogin(){ router.push('/login') }

/* 主流程 */
async function onJoin () {
  msg.value = ''; ok.value = false

  if (!pwOk.value) {
    msg.value = '密碼需至少 8 碼，並包含大寫、小寫與數字'
    return
  }

  // 第一次按下 → 先檢查一次（顯示狀態列）
  if (!checked.value) {
    const res = await maybeAsync(ds.verifyInvite, code.value)
    checked.value = true
    if (!res?.ok) { msg.value = inviteMsg.value || '邀請碼無效'; return }
    invite.value = res
    // 不 return，直接往下完成加入（提升體驗）
  }

  // 再檢一次，確保有效（避免 race）
  const res = await maybeAsync(ds.verifyInvite, code.value)
  if (!res?.ok) { msg.value = inviteMsg.value || '邀請碼無效'; return }

  try {
    loading.value = true

    // 決定角色群組（示例：Employee→RG-EMP、Kitchen→RG-CK；Boss 不在加入流程）
    const role = res.role || 'Employee'
    const roleGroupId = role === 'Employee' ? 'RG-EMP' : role === 'Kitchen' ? 'RG-CK' : 'RG-EMP'

    // 建立使用者（無需真 Email 的 demo 方式；實務可改為 Firebase Auth 建帳）
    const fakeEmail = `${(globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2))}@invite.local`
    ds.addUser?.({ email: fakeEmail, name: name.value, phone: phone.value, roleGroupId })

    // 標記邀請碼已使用
    await maybeAsync(ds.markInviteUsed, res.code)

    // 自動登入
    login({ name: name.value, role })
    setRole(role)

    ok.value = true
    msg.value = '加入成功，正在導向…'

    // 依角色導頁（依你現有路由調整）
    if (role === 'Kitchen') {
      router.push('/kitchen/orders')
    } else {
      // 預設視為員工端
      router.push('/employee')
    }
  } catch (e) {
    msg.value = e?.message || '加入失敗，請稍後再試'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.wrap{
  min-height:100vh;
  display:grid;
  place-items:center;
  background: var(--bg, #f1f5f9);
  padding:16px;
  color: var(--text, #1e293b);
  font-family: "Noto Sans TC","Microsoft JhengHei",system-ui,sans-serif;
}
.card{
  background: var(--card-bg, #fff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius:16px;
  box-shadow:0 10px 30px rgba(0,0,0,.06);
  padding:20px;
  width:min(92vw,560px);
}
h1{ font-size:1.25rem; margin:0 0 .75rem; }
.field{ display:grid; gap:6px; margin:10px 0; }
.label{ font-size:.85rem; font-weight:600; color: var(--text, #1e293b); }
.input{
  padding:.6rem .7rem;
  border:1px solid var(--border, #cbd5e1);
  border-radius:10px;
  background: var(--card-bg, #fff);
  color: var(--text, #0f172a);
}
.input:focus{ outline:2px solid color-mix(in oklab, var(--primary, #2563eb) 35%, transparent); border-color: var(--primary, #2563eb); }

.pw-box{ display:flex; gap:8px; align-items:stretch; }
.pw-input{ flex:1; }
.ghost{
  border:1px solid var(--border, #e2e8f0);
  background: var(--card-bg, #fff);
  color: var(--muted, #475569);
  border-radius:8px;
  padding:0 .6rem;
  white-space:nowrap;
  cursor:pointer;
}

.check{ margin:6px 0; }
.err{ color:#dc2626; font-size:.9rem; }
.ok{ color:#16a34a; font-size:.9rem; }
.hint{ color: var(--muted, #94a3b8); font-size:.75rem; }

.actions{ display:flex; gap:8px; margin-top:12px; }
.primary{
  background: var(--primary, #2563eb);
  color:#fff; border:none; border-radius:10px; padding:.65rem 1rem;
  font-weight:600; cursor:pointer;
  box-shadow:0 10px 20px rgba(37,99,235,.18);
}
.primary:disabled{ background:#94a3b8; box-shadow:none; cursor:not-allowed; }
.btn{
  border:1px solid var(--border, #cbd5e1);
  background: var(--card-bg, #fff);
  color: var(--text, #475569);
  border-radius:10px; padding:.65rem 1rem; font-weight:500; cursor:pointer;
}
</style>
  