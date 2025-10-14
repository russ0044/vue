<template>
  <div class="screen">
    <header class="topbar">
      <div class="brand">
        <div class="avatar"></div>
        <div>
          <div class="title">某某餐飲店</div>
          <div class="sub">ID: 123456789</div>
        </div>
      </div>

      <div class="actions">
        <button class="icon-btn" @click="goSettings" title="系統設定">⚙</button>
        <RoleBadge />
        <button class="logout" @click="onLogout">登出</button>
      </div>
    </header>

    <div class="body">
      <aside class="sidebar">
        <button :class="btnClass('inventory')"       @click="go('inventory')">檢視店面庫存</button>
        <button :class="btnClass('ingredients')"     @click="go('ingredients')">食材資料</button>
        <button :class="btnClass('rolegroups')"      @click="go('rolegroups')">群組權限</button>
        <button :class="btnClass('stores')"          @click="go('stores')">店面管理</button>
        <button :class="btnClass('thresholds')"      @click="go('thresholds')">警示門檻</button>
        <button :class="btnClass('store-settings')"  @click="go('store-settings')">店面設定</button>
        <button :class="btnClass('order-settings')"  @click="go('order-settings')">訂單設定</button>
        <button :class="btnClass('invite')"          @click="go('invite')">生成邀請碼</button>
        <button :class="btnClass('reports')"         @click="go('reports')">報表中心</button>
      </aside>

      <main class="content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/store/auth'
import RoleBadge from '@/components/RoleBadge.vue'

const route = useRoute()
const router = useRouter()
const { logout } = useAuth()

const current = computed(()=> route.path.split('/').pop())
const go  = (name)=> router.push(`/boss/${name}`)
const btnClass = (name)=> ['navbtn', current.value===name?'active':''].join(' ')
function onLogout(){ logout(); router.push('/login') }
function goSettings(){ router.push('/settings') }
</script>

<style scoped>
.screen{max-width:1180px;margin:16px auto;background:#f8fafc;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.06);overflow:hidden}
.topbar{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;background:#fff;border-bottom:1px solid #e5e7eb}
.brand{display:flex;gap:12px;align-items:center}
.avatar{width:42px;height:42px;border-radius:50%;background:#e5e7eb}
.title{font-weight:700}
.sub{font-size:.85rem;color:#64748b}
.body{display:flex;min-height:560px}
.sidebar{width:260px;padding:16px;background:#fff;border-right:1px solid #e5e7eb;display:flex;flex-direction:column;gap:12px}
.navbtn{padding:14px 16px;border:1px solid #d1d5db;border-radius:14px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.03);text-align:center;cursor:pointer}
.navbtn:hover{transform:translateY(-1px);box-shadow:0 4px 14px rgba(0,0,0,.08)}
.navbtn.active{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.12)}
.content{flex:1;padding:18px}
.actions{display:flex;align-items:center;gap:12px}
.icon-btn{background:#fff;border:1px solid #d1d5db;border-radius:50%;width:36px;height:36px;cursor:pointer;font-size:18px;line-height:1;text-align:center;display:flex;align-items:center;justify-content:center}
.icon-btn:hover{background:#f1f5f9}
.logout{background:#ef4444;color:#fff;border:none;padding:6px 12px;border-radius:8px;cursor:pointer;font-size:14px}
.logout:hover{background:#dc2626}
</style>
