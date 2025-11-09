<!-- HeaderBar.vue（可直接覆蓋原檔） -->
<template>
  <header class="hdr card" role="banner">
    <!-- 左：商家資訊 -->
    <div class="store">
      <div
        class="avatar"
        :style="avatarUrlFinal ? { backgroundImage: `url(${avatarUrlFinal})` } : {}"
        aria-hidden="true"
      />
      <div class="meta">
        <div class="name ell" :title="storeNameFinal">{{ storeNameFinal || '—' }}</div>
        <div class="muted small idline">ID：{{ storeIdFinal || '—' }}</div>
      </div>
    </div>

    <!-- 右：角色/動作 -->
    <div class="actions">
      <RoleBadge :role="roleFinal" />

      <button
        class="btn ghost"
        title="設定"
        aria-label="設定"
        type="button"
        @click="$emit('open-settings')"
      >
        ⚙️
      </button>

      <button
        class="btn"
        title="開合選單"
        aria-label="開合選單"
        type="button"
        @click="$emit('toggle-menu')"
      >
        ☰
      </button>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import RoleBadge from './RoleBadge.vue'
import { useScope } from '@/store/scope'
import seed from '@/seed/seedData'

/**
 * props：
 * - storeName   商家名稱（字串）
 * - storeId     商家 ID（字串）
 * - avatarUrl   大頭貼/店徽（選填）
 * - role        角色代稱（傳給 <RoleBadge>；如未傳會自動判斷）
 */
const props = defineProps({
  storeName: { type: String, default: '' },
  storeId:   { type: String, default: '' },
  avatarUrl: { type: String, default: '' },
  role:      { type: String, default: '' },
})

/**
 * emits：
 * - open-settings：開啟設定面板
 * - toggle-menu：開闔側欄/選單
 */
defineEmits(['open-settings', 'toggle-menu'])

/* ========= 自動回填：優先使用父層 props，否則使用 scope，再否則使用 seed 假資料 ========= */
const scope = useScope()
const seedRef = seed() // 讀一份只讀副本避免外部被改

// 找出預設門市（供最後一層 fallback）
const defaultStoreId = seedRef?.settings?.store?.defaultStoreId || (seedRef.stores?.[0]?.id || '')
const storeNameById = (id) => seedRef.stores?.find(s => s.id === id)?.name || ''

// 最終門市 ID 與名稱
const storeIdFinal = computed(() => props.storeId || scope.storeId || defaultStoreId)
const storeNameFinal = computed(() => {
  if (props.storeName) return props.storeName
  if (scope.storeName) return scope.storeName
  return storeNameById(storeIdFinal.value) || '—'
})

// 頭像：父層傳值優先；若 scope 有品牌圖可帶入（沒有就留空，使用灰底）
const avatarUrlFinal = computed(() => props.avatarUrl || scope.brandLogo || '')

// 角色推論（給 RoleBadge）：父層傳值優先；否則由 scope.userName / scope.roleName 粗略推斷
const roleFinal = computed(() => {
  if (props.role) return props.role
  // 若專案有更完整的角色字串，scope 可能帶著「老闆 / 店長 / 門市人員 / 中央廚房人員」
  if (scope.roleName) return scope.roleName
  // 簡單從名稱語意推斷（僅作為防呆）
  const n = (scope.userName || '').toLowerCase()
  if (/老闆|boss/.test(n)) return 'Boss'
  if (/店長|manager/.test(n)) return 'StoreManager'
  if (/廚|kitchen/.test(n)) return 'Kitchen'
  return 'Staff'
})
</script>

<style scoped>
.hdr{
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:10px 14px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  color: var(--text);
}

/* 左側商家資訊 */
.store{ display:flex; gap:10px; align-items:center; min-width:0 }
.avatar{
  width:38px; height:38px; border-radius:50%;
  background: #e5e7eb;
  background-size: cover;
  background-position: center;
  border: 1px solid var(--border);
  flex: 0 0 auto;
}
.meta{ display:flex; flex-direction:column; min-width:0 }
.name{ font-weight:700; line-height:1.2 }
.ell{ overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
.idline{ line-height:1.2 }

/* 右側動作區 */
.actions{ display:flex; gap:10px; align-items:center }

/* 小尺寸最佳化 */
.small{ font-size:12px }
.muted{ color: var(--muted) }

/* RWD：窄螢幕時收斂文字寬度，保留重點 */
@media (max-width: 480px){
  .hdr{ padding:8px 10px }
  .name{ max-width: 46vw }
  .idline{ display:none } /* 手機上隱藏 ID 行，版面更乾淨 */
}
</style>
