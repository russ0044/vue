<template>
  <div class="app-root">
    <SideBar />
    <div class="app-main">
      <TopBar />
      <!-- 固定高度的頁面外殼，所有頁都在此滾動 -->
      <router-view v-slot="{ Component }">
        <div class="route-shell">
          <component :is="Component" />
        </div>
      </router-view>
    </div>
  </div>
</template>

<style>
/* 鎖住 body，避免全域捲軸忽隱忽現造成版面寬度改變 */
html, body, #app { height: 100%; }
body { margin: 0; overflow: hidden; }
/* 永遠預留捲軸寬度（舊新瀏覽器都穩定） */
html { overflow-y: scroll; scrollbar-gutter: stable both-edges; }

/* 兩欄骨架（依你現有結構調整命名亦可） */
.app-root { height: 100%; display: flex; min-width: 0; }
.app-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }

/* ✅ 核心：固定高度＋頁內滾動，不影響左側欄 */
.route-shell{
  flex: 1 1 auto;
  min-height: 0;
  height: 100dvh;     /* 行動裝置地址列收合也穩定 */
  overflow: auto;
  contain: layout paint;
}
</style>
