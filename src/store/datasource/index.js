// src/store/datasource/index.js
import * as local from './local'
import * as fb from './firebase' // 預留：上雲切這裡

const ACTIVE = 'local' // 'firebase'
export const ds = ACTIVE === 'firebase' ? fb : local

export const {
  ensureSeed, read,
  // 使用者
  emailExists, addUser,
  // 店面
  addStore, renameStore, updateStore, deleteStore, saveThreshold, setDefaultStore,
  // 庫存
  recordInventoryChange,
  // 食材
  listIngredients, addIngredient, updateIngredient, deleteIngredient,
  // 邀請碼
  listInvites, createInvite, revokeInvite, purgeExpiredInvites,
  verifyInvite, markInviteUsed,
  // 系統設定
  setRoleLabels, setUI
} = ds
