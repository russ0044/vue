<!-- HeaderBar.vue（可直接覆蓋原檔） -->
<template>
  <header class="hdr card" role="banner">
    <!-- 左：商家資訊 -->
    <div class="store">
      <div
        class="avatar"
        :style="avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : {}"
        aria-hidden="true"
      />
      <div class="meta">
        <div class="name ell" :title="storeName">{{ storeName || '—' }}</div>
        <div class="muted small idline">ID：{{ storeId || '—' }}</div>
      </div>
    </div>

    <!-- 右：角色/動作 -->
    <div class="actions">
      <RoleBadge :role="role" />

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
import RoleBadge from './RoleBadge.vue'

/**
 * props：
 * - storeName   商家名稱（字串）
 * - storeId     商家 ID（字串）
 * - avatarUrl   大頭貼/店徽（選填）
 * - role        角色代稱，傳給 <RoleBadge>
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
