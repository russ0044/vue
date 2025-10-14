<template>
  <div class="page" style="padding:0">
    <div class="em-shell" style="display:grid;grid-template-columns:260px 1fr;min-height:100vh;">
      <!-- 固定左欄 -->
      <aside class="side" :class="{open:drawerOpen}" style="border-right:1px solid var(--border);border-radius:0">
        <div class="side-head" style="display:flex;align-items:center;gap:10px">
          <div class="thumb sm" style="width:40px;height:40px;border-radius:50%;background:#eef2ff;display:grid;place-items:center;border:none">🏪</div>
          <div class="grow">
            <div class="h2">某某餐飲</div>
            <div class="muted small">店：{{ scope.storeName }}</div>
          </div>
        </div>
        <nav style="padding:10px;display:flex;flex-direction:column;gap:8px">
          <RouterLink :to="{name:'emp-inventory'}" class="tab" :class="{active:route.name==='emp-inventory'}">門市庫存</RouterLink>
          <RouterLink :to="{name:'emp-orders'}"    class="tab" :class="{active:route.name==='emp-orders'}"    v-can="'orders.view'">訂單情況</RouterLink>
          <RouterLink :to="{name:'emp-reports'}"   class="tab" :class="{active:route.name==='emp-reports'}"   v-can="'reports.view'">檢視報表</RouterLink>
          <RouterLink :to="{name:'emp-delivery'}"  class="tab" :class="{active:route.name==='emp-delivery'}"  v-can="'delivery.view'">配送情況</RouterLink>
        </nav>
      </aside>

      <transition name="fade"><div v-if="drawerOpen" class="backdrop" @click="drawerOpen=false"></div></transition>

      <!-- 右側內容 -->
      <main class="page" style="padding:14px">
        <header class="main-head">
          <button class="icon-btn only-mobile" @click="drawerOpen=true">☰</button>
          <div class="h1">{{ route.meta?.title || '' }}</div>
          <div class="spacer"></div>
          <button class="btn ghost small" @click="goHome">主頁</button>
          <button class="btn danger small" @click="onLogout">登出</button>
        </header>
        <section class="card">
          <RouterView />
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/store/auth'
import { useScope } from '@/store/scope'
import { usePerm } from '@/store/perm'

const route = useRoute()
const router = useRouter()
const { logout } = useAuth()
const scope = useScope()
usePerm().ensureLoaded()

const drawerOpen = ref(false)
function goHome(){ router.push({ name:'emp-inventory' }) }
function onLogout(){
  logout()
  router.replace({ name:'login' }) // 統一回登入，不再跳 Boss
}
onMounted(()=> drawerOpen.value=false)
</script>
