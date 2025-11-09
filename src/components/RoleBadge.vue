<!-- src/components/RoleBadge.vue（可直接覆蓋） -->
<template>
  <span class="badge" :data-role="effectiveRole">{{ roleLabel }}</span>
</template>

<script setup>
import { computed, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useRoleStore } from '@/store/roleStore'
import * as ds from '@/store/datasource'

/**
 * 可選參數：
 * - role   ：外部強制指定要顯示的角色（若未傳入，使用 store 中的當前角色）
 * - labels ：自訂顯示字串（優先於 datasource 設定）
 *   例如：{ Boss:'老闆', Employee:'櫃台', Kitchen:'中央廚房', StoreManager:'店長' }
 */
const props = defineProps({
  role: { type: String, default: '' },
  labels: {
    type: Object,
    default: () => ({})
  }
})

const { state } = useRoleStore()

/* 後台設定（可即時訂閱） */
const settings = reactive({
  roles: {
    boss: '老闆',
    emp: '員工',
    manager: '店長',    // 👉 補上 manager（若遠端也有會被覆蓋）
    kitchen: '中央廚房'
  }
})

let unsub = null
function applySnapshot(snap) {
  if (!snap) return
  const r = snap?.settings?.roles || {}
  settings.roles.boss    = String(r.boss ?? settings.roles.boss)
  settings.roles.emp     = String(r.emp ?? settings.roles.emp)
  settings.roles.manager = String(r.manager ?? settings.roles.manager)
  settings.roles.kitchen = String(r.kitchen ?? settings.roles.kitchen)
}

onMounted(() => {
  // 初始化
  try { applySnapshot(ds.read?.() || {}) } catch {}
  // 訂閱即時更新（mock / firebase 皆支援）
  unsub = ds.subscribe?.((snap) => applySnapshot(snap))
})
onBeforeUnmount(() => { unsub?.() })

/* ===== 角色推斷 =====
 * 優先順序：props.role > state.roleName（含『店長』等自然語）> state.role
 * 若 roleName 含『店長』或 roleGroupId === 'rg-store-manager'，對應 StoreManager
 */
const inferredFromStore = computed(() => {
  const roleName = String(state.roleName || '')
  const role     = String(state.role || '')
  const rgid     = String(state.roleGroupId || '')

  // 店長判定：中文字或英文字樣、或群組 ID
  if (/店長/i.test(roleName) || /store\s*manager/i.test(roleName) || rgid === 'rg-store-manager') {
    return 'StoreManager'
  }

  // 其餘直接用 state.role
  return role || ''
})

/* 最終角色字串（輸出到 data-role 也使用它） */
const effectiveRole = computed(() => (props.role || inferredFromStore.value || '').trim())

/* ===== 顯示文字：props.labels > settings.roles > fallback 原字串 ===== */
const roleLabel = computed(() => {
  const r = effectiveRole.value
  if (!r) return '未知角色'

  // external overrides
  if (props.labels && typeof props.labels === 'object' && props.labels[r] != null) {
    return String(props.labels[r])
  }

  // datasource settings（大小寫不敏感）
  if (/^boss$/i.test(r))          return settings.roles.boss
  if (/^store\s*manager$/i.test(r)) return settings.roles.manager
  if (/^employee$/i.test(r) || /^staff$/i.test(r)) return settings.roles.emp
  if (/^(kitchen|ck)$/i.test(r))  return settings.roles.kitchen

  // fallback：不在既定清單，直接顯示原字串
  return r
})
</script>

<style scoped>
.badge{
  display:inline-block;
  user-select:none;
  font-size:12px;
  line-height:1.2;
  font-weight:600;
  padding:.3rem .6rem;
  border-radius:999px;
  border:1px solid var(--border);
  background: var(--card-bg);
  color: var(--text);
  transition: background .15s ease, color .15s ease, border-color .15s ease;
}

/* 針對不同角色加一點辨識（可依需求客製） */
.badge[data-role="Boss"],
.badge[data-role="boss"]{
  background: var(--primary-weak);
  border-color: var(--primary);
  color: var(--primary);
}
.badge[data-role="Employee"],
.badge[data-role="employee"]{
  background: color-mix(in oklab, var(--primary-weak) 55%, transparent);
  border-color: color-mix(in oklab, var(--primary) 65%, var(--border));
  color: var(--text);
}
.badge[data-role="StoreManager"],
.badge[data-role="storemanager"]{
  background: color-mix(in oklab, var(--primary-weak) 45%, transparent);
  border-color: color-mix(in oklab, var(--primary) 60%, var(--border));
  color: var(--text);
}
.badge[data-role="Kitchen"],
.badge[data-role="kitchen"],
.badge[data-role="ck"]{
  background: color-mix(in oklab, var(--primary-weak) 35%, transparent);
  border-color: color-mix(in oklab, var(--primary) 50%, var(--border));
  color: var(--text);
}

/* 暗色下維持對比（你的 theme.css 已定義 .dark 變數，這裡只微調） */
:global(.dark) .badge{
  border-color: var(--border);
}
</style>
