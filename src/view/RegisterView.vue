<template>
  <div class="reg-shell">
    <form class="card" @submit.prevent="onSubmit">
      <!-- 標題區 -->
      <header class="head">
        <h1 class="title">建立老闆帳號</h1>
        <p class="subtitle">
          這會成為主控帳號。完成後，你就可以登入後台、管理門市、邀請員工與中央廚房。
        </p>
      </header>

      <!-- 系統訊息 -->
      <div v-if="msg" class="alert" :data-type="ok ? 'ok' : 'err'">
        {{ msg }}
      </div>

      <!-- 帳號資訊 -->
      <section class="section">
        <h2 class="section-title">帳號資訊</h2>
        <div class="grid">
          <label class="field">
            <span class="label">登入 Email</span>
            <input
              type="email"
              v-model.trim="email"
              class="input"
              placeholder="boss@example.com"
              required
            >
            <small class="hint" v-if="email && !emailOk">請輸入有效的 Email。</small>
          </label>

          <label class="field pw-field">
            <span class="label">登入密碼</span>
            <div class="pw-box">
              <input
                :type="showPw ? 'text' : 'password'"
                v-model.trim="password"
                class="input pw-input"
                placeholder="至少 8 碼，需含大小寫與數字"
                required
              >
              <button type="button" class="pw-toggle" @click="showPw = !showPw">
                {{ showPw ? '隱藏' : '顯示' }}
              </button>
            </div>
            <small class="hint" v-if="password && !pwOk">
              密碼需至少 8 碼，並包含大寫、小寫與數字。
            </small>
          </label>
        </div>
      </section>

      <!-- 品牌 / 店家資訊 -->
      <section class="section">
        <h2 class="section-title">品牌 / 公司資訊</h2>
        <div class="grid">
          <label class="field">
            <span class="label">品牌 / 店名（顯示給員工看）</span>
            <input
              v-model.trim="brandName"
              class="input"
              placeholder="例如：湖南雞專賣 / 小林炸物"
              required
            >
          </label>

          <label class="field">
            <span class="label">聯絡電話</span>
            <input
              v-model.trim="brandPhone"
              class="input"
              placeholder="02-12345678 / 0912-345-678"
              required
            >
          </label>
        </div>
      </section>

      <!-- 第 1 個據點（門市 or 中央廚房） -->
      <section class="section">
        <div class="section-head">
          <h2 class="section-title">建立第一個據點</h2>
          <span class="section-note">
            這個據點會成為系統的預設據點，之後你可再新增更多店面或中央廚房。
          </span>
        </div>

        <div class="grid">
          <label class="field">
            <span class="label">據點名稱</span>
            <input
              v-model.trim="storeName"
              class="input"
              placeholder="例如：台北門市 / 中央廚房 A"
              required
            >
          </label>

          <label class="field">
            <span class="label">電話</span>
            <input
              v-model.trim="storePhone"
              class="input"
              placeholder="02-00000000"
              required
            >
          </label>

          <label class="field wide">
            <span class="label">地址</span>
            <input
              v-model.trim="storeAddr"
              class="input"
              placeholder="台北市內湖區成功路一段 123 號"
              required
            >
          </label>

          <label class="field">
            <span class="label">據點類型</span>
            <select v-model="storeType" class="input">
              <option value="branch">門市</option>
              <option value="central">中央廚房</option>
            </select>
          </label>

          <label class="field info-block">
            <span class="label row">
              <span>營運型態</span>
              <span class="badge">可選</span>
            </span>
            <div class="choice-col">
              <label class="radio-line">
                <input
                  type="radio"
                  class="radio"
                  value="single"
                  v-model="businessMode"
                >
                <span>單一據點營運（只有這家門市，暫時沒有中央廚房）</span>
              </label>

              <label class="radio-line">
                <input
                  type="radio"
                  class="radio"
                  value="multi"
                  v-model="businessMode"
                >
                <span>多據點 / 含中央廚房（之後會有多家門市領貨）</span>
              </label>
            </div>
            <small class="hint">
              這是用來幫後續預設權限與流程，不影響你之後再新增店面。
            </small>
          </label>
        </div>
      </section>

      <!-- 說明區 -->
      <section class="section subtle">
        <p class="info-line">
          註冊完成後，你將成為
          <b>老闆 / 系統管理者</b>，
          並可以在後台產生「邀請碼」給員工或中央廚房人員。
        </p>
        <p class="info-line">
          員工與中央廚房人員 <b>不需要在這裡註冊</b>，他們會在登入頁使用邀請碼加入。
        </p>
      </section>

      <!-- 動作按鈕 -->
      <footer class="actions">
        <button
          class="primary"
          type="submit"
          :disabled="!canSubmit || loading"
        >
          {{ loading ? '建立中…' : '完成註冊並進入系統' }}
        </button>

        <button
          type="button"
          class="ghost"
          :disabled="loading"
          @click="goLogin"
        >
          返回登入
        </button>
      </footer>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/store/auth'
import { useRoleStore } from '@/store/roleStore'
import { ds, read } from '@/store/datasource'

// router / stores
const router = useRouter()
const { login } = useAuth()
const { setRole } = useRoleStore()

// 表單狀態
const email = ref('')
const password = ref('')
const showPw = ref(false)

const brandName = ref('')
const brandPhone = ref('')

const storeName = ref('')
const storeAddr = ref('')
const storePhone = ref('')
const storeType = ref('branch')   // 'branch' | 'central'
const businessMode = ref('single') // 'single' | 'multi'，只是輔助設定

// UI 狀態
const msg = ref('')
const ok = ref(false)
const loading = ref(false)

// 驗證邏輯
const emailOk = computed(() =>
  /\S+@\S+\.\S+/.test(email.value)
)

const pwOk = computed(() =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password.value)
)

const baseOk = computed(() =>
  brandName.value &&
  brandPhone.value &&
  storeName.value &&
  storeAddr.value &&
  storePhone.value
)

// 只有老闆可以註冊 → 沒有邀請碼流程，所以 canSubmit 很單純
const canSubmit = computed(() =>
  emailOk.value &&
  pwOk.value &&
  baseOk.value
)

// 導回登入
function goLogin() {
  router.push('/login')
}

// 提交
async function onSubmit() {
  msg.value = ''
  ok.value = false

  if (!canSubmit.value) {
    msg.value = '請完整填寫資訊，並確認密碼格式'
    return
  }

  // 檢查 email 是否已存在
  if (ds.emailExists(email.value)) {
    msg.value = '此 Email 已被使用，請改用其他信箱'
    return
  }

  try {
    loading.value = true

    // 1. 新增老闆帳號到資料源
    ds.addUser({
      email: email.value,
      // 系統內部保存老闆名稱，預設用品牌名稱
      name: brandName.value,
      phone: brandPhone.value,
      // 角色群組：老闆就是 BOSS 群組
      roleGroupId: 'RG-BOSS',
      role: 'Boss',
    })

    // 2. 建立第一個據點（門市或中央廚房）
    ds.addStore({
      name: storeName.value,
      address: storeAddr.value,
      phone: storePhone.value,
      type: storeType.value, // branch / central
    })

    // 3. 把剛新增的店設為預設店
    const snapshotAfter = read()
    const lastStore = (snapshotAfter.stores || [])[snapshotAfter.stores.length - 1]
    if (lastStore && lastStore.id) {
      ds.setDefaultStore(lastStore.id)
    }

    // 4. 根據模式選擇一些預設策略（businessMode）
    //    目前先不寫入別的資料表，保持穩定可執行。
    //    未來你可以在這裡根據 businessMode 去自動建立「中央廚房」storeGroups 或其他初始設定。

    // 5. 自動登入
    login({
      name: brandName.value,
      role: 'Boss',
      email: email.value,
    })
    setRole('Boss')

    ok.value = true
    msg.value = '註冊成功，正在進入系統…'

    // 導向老闆後台的店面管理頁
    setTimeout(() => {
      router.push('/boss/stores')
    }, 500)
  } catch (e) {
    console.error(e)
    msg.value = e?.message || '註冊失敗，請稍後再試'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* 版面外層：置中 + 柔和背景 */
.reg-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at 20% 20%, #eef2ff 0%, #f8fafc 60%);
  padding: 16px;
  font-family: "Noto Sans TC","Microsoft JhengHei",system-ui,sans-serif;
}

/* 表單卡片 */
.card {
  background: #fff;
  border-radius: 20px;
  box-shadow:
    0 30px 80px rgba(0,0,0,.08),
    0 4px 16px rgba(0,0,0,.04);
  border: 1px solid #e2e8f0;
  width: min(94vw, 640px);
  padding: 20px 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 頁首文字 */
.head {
  display: grid;
  gap: 6px;
}
.title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.3;
}
.subtitle {
  font-size: .9rem;
  color: #475569;
  line-height: 1.5;
}

/* 區塊標題 */
.section {
  background: #fff;
  border-radius: 16px;
  border: 1px solid #f1f5f9;
  box-shadow: 0 2px 4px rgba(0,0,0,.02);
  padding: 12px 14px;
  display: grid;
  gap: 12px;
}
.section.subtle {
  background: #f8fafc;
  border-style: dashed;
  border-color: #e2e8f0;
  color: #475569;
}
.section-head {
  display: grid;
  gap: 4px;
}
.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.4;
}
.section-note {
  font-size: .8rem;
  color: #64748b;
  line-height: 1.4;
}

/* 表單格線 */
.grid {
  display: grid;
  gap: 12px;
}
@media(min-width:600px){
  .grid {
    grid-template-columns: 1fr 1fr;
  }
  .field.wide {
    grid-column: span 2;
  }
  .field.info-block {
    grid-column: span 2;
  }
}

/* 表單欄位 */
.field {
  display: grid;
  gap: 6px;
}
.label {
  font-size: .8rem;
  font-weight: 600;
  color: #334155;
  display: flex;
  align-items: center;
  gap: .5rem;
}
.row {
  display: flex;
  align-items: center;
  gap: .5rem;
}
.badge {
  background:#e0e7ff;
  color:#4338ca;
  font-size:.7rem;
  line-height:1;
  border-radius:999px;
  padding:2px 6px;
  font-weight:500;
  border:1px solid #c7d2fe;
}
.input {
  width: 100%;
  padding: .65rem .7rem;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-size: .9rem;
  background: #fff;
  color:#0f172a;
  line-height:1.4;
}
.input:focus {
  outline: 2px solid #2563eb33;
  border-color: #2563eb;
}

/* 密碼欄位 */
.pw-field { position: relative; }
.pw-box {
  display: flex;
  align-items: stretch;
  gap: 8px;
}
.pw-input {
  flex: 1;
}
.pw-toggle {
  white-space: nowrap;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background:#fff;
  color:#475569;
  font-size:.8rem;
  padding:0 .6rem;
  cursor:pointer;
}
.pw-toggle:hover {
  background:#f8fafc;
}

/* radio 區塊（營運型態） */
.choice-col {
  display: grid;
  gap: 8px;
  background:#f8fafc;
  border:1px solid #e2e8f0;
  border-radius:12px;
  padding:10px 12px;
}
.radio-line {
  display:flex;
  align-items:flex-start;
  gap:8px;
  font-size:.85rem;
  color:#334155;
  line-height:1.4;
}
.radio {
  margin-top:4px;
  accent-color:#2563eb;
}

/* 下方資訊文字 */
.info-line {
  font-size: .8rem;
  line-height: 1.5;
  color: #475569;
}

/* 系統訊息 */
.alert {
  border-radius: 12px;
  font-size: .85rem;
  line-height: 1.4;
  padding: 10px 12px;
  border: 1px solid;
}
.alert[data-type="ok"] {
  background: #ecfdf5;
  border-color: #6ee7b7;
  color: #065f46;
}
.alert[data-type="err"] {
  background: #fff1f2;
  border-color: #fecdd3;
  color: #9f1239;
}

/* hint 小字 */
.hint {
  font-size: .7rem;
  color: #9ca3af;
  line-height: 1.4;
}

/* footer 動作按鈕 */
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
  border-top: 1px solid #e2e8f0;
  padding-top: 12px;
  margin-top: 4px;
}
.primary {
  background:#2563eb;
  color:#fff;
  border:none;
  border-radius:10px;
  padding:.7rem 1rem;
  font-size:.9rem;
  font-weight:600;
  cursor:pointer;
  box-shadow:0 10px 20px rgba(37,99,235,.25);
}
.primary:disabled {
  background:#94a3b8;
  box-shadow:none;
  cursor:not-allowed;
}
.ghost {
  border:1px solid #cbd5e1;
  background:#fff;
  color:#475569;
  border-radius:10px;
  padding:.7rem 1rem;
  font-size:.9rem;
  font-weight:500;
  cursor:pointer;
}
.ghost:disabled {
  opacity:.5;
  cursor:not-allowed;
}
</style>
