import { reactive } from 'vue'

const state = reactive({ loaded:false, grants:[] })
const DEFAULT = ['inventory.view','inventory.edit','orders.view','orders.create','reports.view','delivery.view']

export function usePerm(){
  function ensureLoaded(){
    if (state.loaded) return
    const raw = localStorage.getItem('emp-perm-grants')
    try{
      state.grants = raw ? JSON.parse(raw) : DEFAULT
    }catch{
      state.grants = DEFAULT
    }
    state.loaded = true
  }
  function can(code){ return state.grants.includes(code) }
  function setGrants(list){
    state.grants = list; localStorage.setItem('emp-perm-grants', JSON.stringify(list))
  }
  return { state, ensureLoaded, can, setGrants }
}

/* v-can：沒有權限就隱藏節點（畫面級） */
export default { install(app){
  app.directive('can',{
    mounted(el,binding){
      const { ensureLoaded, can } = usePerm()
      ensureLoaded()
      if (!can(binding.value)) el.style.display='none'
    }
  })
}}
