// src/store/roleStore.js
import { reactive } from 'vue'

const state = reactive({
  // 允許 'Boss' | 'Employee' | 'Kitchen'
  role: 'Boss'
})

export function useRoleStore () {
  function setRole (r) { state.role = r }
  return { state, setRole }
}
