// 預留 Firebase 版本（之後串 Firestore/Auth 時替換）
// 目前全部拋 TODO，避免誤用

export function ensureSeed(){/* noop */}
export function read(){ throw new Error('TODO: Firestore read') }

export function emailExists(){ throw new Error('TODO: Firebase query') }
export function addUser(){ throw new Error('TODO: Firebase Auth + Firestore') }

export function addStore(){ throw new Error('TODO: Firestore write') }
export function renameStore(){ throw new Error('TODO: Firestore update') }
export function deleteStore(){ throw new Error('TODO: Firestore batch') }
export function saveThreshold(){ throw new Error('TODO: Firestore update') }
export function setDefaultStore(){ throw new Error('TODO: Firestore update') }

export function recordInventoryChange(){ throw new Error('TODO: Transaction + log') }

export function listIngredients(){ throw new Error('TODO') }
export function addIngredient(){ throw new Error('TODO') }
export function updateIngredient(){ throw new Error('TODO') }
export function deleteIngredient(){ throw new Error('TODO') }

export function listInvites(){ throw new Error('TODO') }
export function createInvite(){ throw new Error('TODO') }
export function revokeInvite(){ throw new Error('TODO') }
export function purgeExpiredInvites(){ throw new Error('TODO') }
export function verifyInvite(){ throw new Error('TODO') }
export function markInviteUsed(){ throw new Error('TODO') }

export function setRoleLabels(){ throw new Error('TODO') }
