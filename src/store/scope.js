import { reactive } from 'vue'

const state = reactive({
  storeId: localStorage.getItem('emp-store-id') || 's1',
  storeName: localStorage.getItem('emp-store-name') || '某某餐飲-1號',
})

function setStore({ id, name }) {
  state.storeId = id
  state.storeName = name
  localStorage.setItem('emp-store-id', id)
  localStorage.setItem('emp-store-name', name)
}

export function useScope () {
  return Object.assign(state, { setStore })
}
