// src/seed/seedData.js
// 具名輸出：你在 local.js 用的是 { seedData }
// 本版本以「湖南雞」為範例，包含：台北店、台中店、高雄店與「中央廚房」；
// 假資料之 storeId / inventory / thresholds / users / invites 彼此一致可用。

export const seedData = {
  stores: [
    { id: 'hn-taipei',    name: '海南雞 台北店' },
    { id: 'hn-taichung',  name: '海南雞 台中店' },
    { id: 'hn-kaohsiung', name: '海南雞 高雄店' },
    { id: 'central-kitchen', name: '海南雞 中央廚房', isCentral: true },
  ],

  // --- 各據點庫存（含中央廚房）。exp 使用 yyyy-mm-dd；無效期請用 null。---
  inventory: [
    // 台北店
    { storeId: 'hn-taipei', sku: 'CK-001', name: '去骨雞腿',     qty: 22, unit: '份',  exp: '2025-11-06' },
    { storeId: 'hn-taipei', sku: 'SA-010', name: '海南辣醬',     qty: 18, unit: '罐',  exp: '2026-04-01' },
    { storeId: 'hn-taipei', sku: 'CH-020', name: '朝天椒',       qty:  6, unit: '公斤', exp: '2025-11-03' },
    { storeId: 'hn-taipei', sku: 'RI-030', name: '台梗九號白米', qty: 45, unit: '公斤', exp: null },
    { storeId: 'hn-taipei', sku: 'VE-040', name: '高麗菜',       qty: 12, unit: '顆',  exp: '2025-11-02' },
    { storeId: 'hn-taipei', sku: 'EG-050', name: '雞蛋',         qty:  8, unit: '盒',  exp: '2025-11-01' },
    { storeId: 'hn-taipei', sku: 'GA-060', name: '蒜頭',         qty:  7, unit: '公斤', exp: '2025-11-04' },
    { storeId: 'hn-taipei', sku: 'GI-061', name: '老薑',         qty:  6, unit: '公斤', exp: '2025-11-07' },
    { storeId: 'hn-taipei', sku: 'OI-070', name: '芥花油',       qty: 10, unit: '桶',  exp: '2026-02-01' },
    { storeId: 'hn-taipei', sku: 'PK-080', name: '外帶紙盒(大)', qty: 90, unit: '個',  exp: null },

    // 台中店
    { storeId: 'hn-taichung', sku: 'CK-001', name: '去骨雞腿',     qty: 14, unit: '份',  exp: '2025-11-05' },
    { storeId: 'hn-taichung', sku: 'SA-010', name: '海南辣醬',     qty: 10, unit: '罐',  exp: '2026-04-01' },
    { storeId: 'hn-taichung', sku: 'CH-020', name: '朝天椒',       qty:  4, unit: '公斤', exp: '2025-11-02' },
    { storeId: 'hn-taichung', sku: 'RI-030', name: '台梗九號白米', qty: 60, unit: '公斤', exp: null },
    { storeId: 'hn-taichung', sku: 'VE-040', name: '高麗菜',       qty:  6, unit: '顆',  exp: '2025-11-02' },
    { storeId: 'hn-taichung', sku: 'EG-050', name: '雞蛋',         qty:  5, unit: '盒',  exp: '2025-11-01' },
    { storeId: 'hn-taichung', sku: 'GA-060', name: '蒜頭',         qty:  3, unit: '公斤', exp: '2025-11-04' },
    { storeId: 'hn-taichung', sku: 'GI-061', name: '老薑',         qty:  3, unit: '公斤', exp: '2025-11-06' },
    { storeId: 'hn-taichung', sku: 'OI-070', name: '芥花油',       qty:  6, unit: '桶',  exp: '2026-02-01' },
    { storeId: 'hn-taichung', sku: 'PK-080', name: '外帶紙盒(大)', qty: 60, unit: '個',  exp: null },

    // 高雄店
    { storeId: 'hn-kaohsiung', sku: 'CK-001', name: '去骨雞腿',     qty: 16, unit: '份',  exp: '2025-11-06' },
    { storeId: 'hn-kaohsiung', sku: 'SA-010', name: '海南辣醬',     qty: 12, unit: '罐',  exp: '2026-04-01' },
    { storeId: 'hn-kaohsiung', sku: 'CH-020', name: '朝天椒',       qty:  5, unit: '公斤', exp: '2025-11-03' },
    { storeId: 'hn-kaohsiung', sku: 'RI-030', name: '台梗九號白米', qty: 55, unit: '公斤', exp: null },
    { storeId: 'hn-kaohsiung', sku: 'VE-040', name: '高麗菜',       qty: 10, unit: '顆',  exp: '2025-11-02' },
    { storeId: 'hn-kaohsiung', sku: 'EG-050', name: '雞蛋',         qty:  7, unit: '盒',  exp: '2025-11-01' },
    { storeId: 'hn-kaohsiung', sku: 'GA-060', name: '蒜頭',         qty:  4, unit: '公斤', exp: '2025-11-05' },
    { storeId: 'hn-kaohsiung', sku: 'GI-061', name: '老薑',         qty:  4, unit: '公斤', exp: '2025-11-06' },
    { storeId: 'hn-kaohsiung', sku: 'OI-070', name: '芥花油',       qty:  7, unit: '桶',  exp: '2026-02-01' },
    { storeId: 'hn-kaohsiung', sku: 'PK-080', name: '外帶紙盒(大)', qty: 70, unit: '個',  exp: null },

    // 中央廚房（半成品、原物料）
    { storeId: 'central-kitchen', sku: 'MK-100', name: '醃料（秘製）',       qty: 30, unit: '桶',  exp: '2026-01-15' },
    { storeId: 'central-kitchen', sku: 'PF-110', name: '去骨雞腿（真空包）', qty: 120, unit: '包', exp: '2025-11-20' },
    { storeId: 'central-kitchen', sku: 'BR-120', name: '雞高湯基底',         qty: 40, unit: '桶',  exp: '2025-12-15' },
    { storeId: 'central-kitchen', sku: 'SP-130', name: '香料混合包',         qty: 80, unit: '包',  exp: '2026-05-01' },
    { storeId: 'central-kitchen', sku: 'RI-030', name: '台梗九號白米',       qty: 300, unit: '公斤', exp: null },
    { storeId: 'central-kitchen', sku: 'OI-070', name: '芥花油',             qty: 40, unit: '桶',  exp: '2026-02-01' },
  ],

  thresholds: [
    { id: 'hn-taipei',   storeId: 'hn-taipei',   minQty: 6 },
    { id: 'hn-taichung', storeId: 'hn-taichung', minQty: 6 },
    { id: 'hn-kaohsiung', storeId: 'hn-kaohsiung', minQty: 6 },
    { id: 'central-kitchen', storeId: 'central-kitchen', minQty: 20 }, // 中央廚房備料門檻較高
  ],

  settings: {
    store: {
      allowNegativeStock: false,
      defaultStoreId: 'hn-taipei',
      defaultExpDays: 3,
    },
  },

  // 使用者與邀請碼（支援老闆、店員、中央廚房角色）
  users: [
    { id: 'U001', role: 'boss',    name: '老闆',   email: 'boss@hunanchicken.example' },
    { id: 'U101', role: 'staff',   name: '台北店員A', email: 'taipeiA@hunanchicken.example',   storeId: 'hn-taipei' },
    { id: 'U201', role: 'staff',   name: '台中店員A', email: 'taichungA@hunanchicken.example', storeId: 'hn-taichung' },
    { id: 'U301', role: 'staff',   name: '高雄店員A', email: 'kaohsiungA@hunanchicken.example', storeId: 'hn-kaohsiung' },
    { id: 'U900', role: 'kitchen', name: '中央廚房人員', email: 'kitchen@hunanchicken.example', storeId: 'central-kitchen' },
  ],

  invites: [
    { code: 'JOIN-HN-TPE-001',    role: 'staff',   storeId: 'hn-taipei',        used: false },
    { code: 'JOIN-HN-TXG-001',    role: 'staff',   storeId: 'hn-taichung',      used: false },
    { code: 'JOIN-HN-KHH-001',    role: 'staff',   storeId: 'hn-kaohsiung',     used: false },
    { code: 'JOIN-HN-CK-001',     role: 'kitchen', storeId: 'central-kitchen',  used: false },
  ],
};

// 預設輸出（如果哪裡用的是 default import 也能用）
export default function seed() {
  // 傳回一份乾淨拷貝，避免被修改到原始常數
  return JSON.parse(JSON.stringify(seedData));
}
