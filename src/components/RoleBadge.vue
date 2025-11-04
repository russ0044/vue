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
 *   例如：{ Boss:'老闆', Employee:'櫃台', Kitchen:'中央廚房' }
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
    kitchen: '中央廚房'
  }
})

let unsub = null
function applySnapshot(snap) {
  if (!snap) return
  const r = snap?.settings?.roles || {}
  settings.roles.boss    = String(r.boss ?? settings.roles.boss)
  settings.roles.emp     = String(r.emp ?? settings.roles.emp)
  settings.roles.kitchen = String(r.kitchen ?? settings.roles.kitchen)
}

onMounted(() => {
  // 初始化
  try { applySnapshot(ds.read?.() || {}) } catch {}
  // 訂閱即時更新（mock / firebase 皆支援）
  unsub = ds.subscribe?.((snap) => applySnapshot(snap))
})
onBeforeUnmount(() => { unsub?.() })

/* 最終要用的角色（外部 > store） */
const effectiveRole = computed(() => (props.role || state.role || '').trim())

/* 角色對應文字：props.labels > settings.roles > 原字串/未知角色 */
const roleLabel = computed(() => {
  const role = effectiveRole.value
  if (!role) return '未知角色'

  // external overrides
  if (props.labels && typeof props.labels === 'object') {
    if (props.labels[role] != null) return String(props.labels[role])
  }

  // datasource settings
  if (/^boss$/i.test(role))    return settings.roles.boss
  if (/^employee$/i.test(role))return settings.roles.emp
  if (/^(kitchen|ck)$/i.test(role)) return settings.roles.kitchen

  // fallback：不在既定清單，直接顯示原字串
  return role
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
