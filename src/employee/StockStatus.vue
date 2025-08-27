<template>
  <div class="dashboard-container">
    <div class="dashboard-box">
      <!-- 上方標題與設定 -->
      <div class="top-bar">
        <div class="title-box">門市庫存狀況</div>
        <button class="gear-icon" @click="goToSetting">⚙</button>
      </div>

      <!-- 搜尋區 -->
      <div class="search-area">
        <input
          type="text"
          class="search-input"
          placeholder="輸入名稱或標籤"
          v-model="searchQuery"
        />
        <button class="search-button">🔍</button>
      </div>

      <!-- 分類標籤 -->
      <div class="tag-area">
        <button
          class="tag-button"
          :class="{ active: activeTag === tag }"
          v-for="tag in tags"
          :key="tag"
          @click="toggleTag(tag)"
        >
          {{ tag }}
        </button>
      </div>

      <!-- 可捲動的清單 -->
      <div class="scrollbar">
        <div
          class="item-card"
          v-for="(item, index) in filteredItems"
          :key="index"
        >
          <div class="item-left">
            <div class="item-image">{{ item.image }}</div>
            <div class="item-info">
              <div class="item-name">{{ item.name }}</div>
              <div class="item-tag">{{ item.tag }}</div>
              <div class="item-expire">有效期：{{ item.expireDate }}</div>
            </div>
          </div>
          <div class="item-right">
            <div class="item-qty">{{ item.quantity }}</div>
            <div v-if="item.warning" class="alert-dot">!</div>
          </div>
        </div>
      </div>

      <!-- 左下返回 -->
      <button class="back-button" @click="goBack">◀</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const searchQuery = ref('')
const activeTag = ref('')

const tags = ['肉類', '冷藏', '香料', '水果', '熟食']

const items = ref([
  {
    name: '大力士菠菜',
    tag: '冷藏',
    image: '🥬',
    quantity: 12,
    expireDate: '08/25',
    warning: true
  },
  {
    name: '小力士菠菜',
    tag: '冷藏',
    image: '🥬',
    quantity: 76,
    expireDate: '08/24',
    warning: false
  },
  {
    name: '香煎雞腿排',
    tag: '肉類',
    image: '🍗',
    quantity: 8,
    expireDate: '08/22',
    warning: true
  },
  {
    name: '低溫熟成牛排',
    tag: '肉類',
    image: '🥩',
    quantity: 45,
    expireDate: '08/30',
    warning: false
  },
  {
    name: '青蔥',
    tag: '香料',
    image: '🧄',
    quantity: 34,
    expireDate: '08/26',
    warning: false
  },
  {
    name: '鳳梨',
    tag: '水果',
    image: '🍍',
    quantity: 4,
    expireDate: '08/19',
    warning: true
  },
  {
    name: '義式番茄醬',
    tag: '熟食',
    image: '🍅',
    quantity: 21,
    expireDate: '09/01',
    warning: false
  }
])

const filteredItems = computed(() => {
  return items.value.filter((item) => {
    const matchName = item.name.includes(searchQuery.value)
    const matchTag =
      !activeTag.value || item.tag === activeTag.value
    return matchName && matchTag
  })
})

const toggleTag = (tag) => {
  activeTag.value = activeTag.value === tag ? '' : tag
}

const goBack = () => {
  router.back()
}

const goToSetting = () => {
  router.push('/setting')
}
</script>

<style scoped>
.dashboard-container {
  background-color: #dceeff;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.dashboard-box {
  background-color: #ffffff;
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  width: 320px; 
  height: 90vh;
  display: flex;
  flex-direction: column;
  position: relative;
}


/* 標題 + 設定 */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-box {
  border: 2px solid black;
  padding: 12px 16px;
  font-size: 18px;
  font-weight: bold;
  background-color: white;
}

.gear-icon {
  font-size: 20px;
  background: none;
  border: none;
  cursor: pointer;
}

/* 搜尋 */
.search-area {
  display: flex;
  margin-top: 12px;
  margin-bottom: 8px;
}

.search-input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #999;
  border-radius: 4px 0 0 4px;
}

.search-button {
  background-color: #ccc;
  border: 1px solid #999;
  padding: 6px 10px;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
}

/* 分類 */
.tag-area {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.tag-button {
  background-color: #eee;
  border: 1px solid #aaa;
  border-radius: 20px;
  padding: 4px 10px;
  font-size: 14px;
  cursor: pointer;
}

.tag-button.active {
  background-color: #333;
  color: white;
  border-color: #333;
}

/* 滾動清單 */
.scrollbar {
  flex: 1;
  overflow-y: auto;
  padding-right: 6px;
}

/* 單項卡片 */
.item-card {
  border: 1px solid black;
  border-radius: 10px;
  padding: 10px;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.item-left {
  display: flex;
  align-items: center;
}

.item-image {
  width: 40px;
  height: 40px;
  background-color: #ccc;
  margin-right: 10px;
  text-align: center;
  line-height: 40px;
  font-weight: bold;
}

.item-info {
  text-align: left;
}

.item-name {
  font-weight: bold;
}

.item-tag {
  font-size: 14px;
  color: #666;
}

.item-expire {
  font-size: 12px;
  color: #999;
}

/* 數量與紅點 */
.item-right {
  position: relative;
  font-size: 18px;
  font-weight: bold;
}

.item-qty {
  border: 1px solid #000;
  border-radius: 6px;
  padding: 4px 10px;
  background-color: white;
}

.alert-dot {
  position: absolute;
  top: -8px;
  right: -10px;
  width: 20px;
  height: 20px;
  background-color: red;
  color: white;
  border-radius: 50%;
  font-weight: bold;
  font-size: 14px;
  line-height: 20px;
  text-align: center;
}

/* 返回按鈕 */
.back-button {
  position: absolute;
  bottom: 12px;
  left: 12px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
}
</style>
