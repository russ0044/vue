// src/seed/seedData.js
// 統一假資料 / 本地初始資料
// - 門市、庫存、中央廚房單據、供應商、邀請碼
// - 老闆端 / 門市端 / 中央廚房端 都用同一份
// - runtime.mode / runtime.theme 讓各頁直接讀「現在系統是在 local 還是 firebase」&「目前主題」
//
// 注意：如果要修改主題或資料來源模式，請在系統設定頁修改並回寫 runtime，而不是在頁面內硬改。

export const seedData = {
  /* =========================
   * 門市 / 據點
   * ========================= */
  stores: [
    { id: 'hn-taipei',        name: '海南雞 台北店' },
    { id: 'hn-taichung',      name: '海南雞 台中店' },
    { id: 'hn-kaohsiung',     name: '海南雞 高雄店' },
    { id: 'central-kitchen',  name: '海南雞 中央廚房', isCentral: true },
  ],

  /* =========================
   * 各據點即時庫存（含中央廚房原料）
   * exp: yyyy-mm-dd 或 null
   * ========================= */
  inventory: [
    // 台北店
    { storeId: 'hn-taipei', sku: 'CK-001', name: '去骨雞腿',     qty: 22,  unit: '份',   exp: '2025-11-06' },
    { storeId: 'hn-taipei', sku: 'SA-010', name: '海南辣醬',     qty: 18,  unit: '罐',   exp: '2026-04-01' },
    { storeId: 'hn-taipei', sku: 'CH-020', name: '朝天椒',       qty:  6,  unit: '公斤', exp: '2025-11-03' },
    { storeId: 'hn-taipei', sku: 'RI-030', name: '台梗九號白米', qty: 45,  unit: '公斤', exp: null },
    { storeId: 'hn-taipei', sku: 'VE-040', name: '高麗菜',       qty: 12,  unit: '顆',   exp: '2025-11-02' },
    { storeId: 'hn-taipei', sku: 'EG-050', name: '雞蛋',         qty:  8,  unit: '盒',   exp: '2025-11-01' },
    { storeId: 'hn-taipei', sku: 'GA-060', name: '蒜頭',         qty:  7,  unit: '公斤', exp: '2025-11-04' },
    { storeId: 'hn-taipei', sku: 'GI-061', name: '老薑',         qty:  6,  unit: '公斤', exp: '2025-11-07' },
    { storeId: 'hn-taipei', sku: 'OI-070', name: '芥花油',       qty: 10,  unit: '桶',   exp: '2026-02-01' },
    { storeId: 'hn-taipei', sku: 'PK-080', name: '外帶紙盒(大)', qty: 90,  unit: '個',   exp: null },

    // 台中店
    { storeId: 'hn-taichung', sku: 'CK-001', name: '去骨雞腿',     qty: 14, unit: '份',   exp: '2025-11-05' },
    { storeId: 'hn-taichung', sku: 'SA-010', name: '海南辣醬',     qty: 10, unit: '罐',   exp: '2026-04-01' },
    { storeId: 'hn-taichung', sku: 'CH-020', name: '朝天椒',       qty:  4, unit: '公斤', exp: '2025-11-02' },
    { storeId: 'hn-taichung', sku: 'RI-030', name: '台梗九號白米', qty: 60, unit: '公斤', exp: null },
    { storeId: 'hn-taichung', sku: 'VE-040', name: '高麗菜',       qty:  6, unit: '顆',   exp: '2025-11-02' },
    { storeId: 'hn-taichung', sku: 'EG-050', name: '雞蛋',         qty:  5, unit: '盒',   exp: '2025-11-01' },
    { storeId: 'hn-taichung', sku: 'GA-060', name: '蒜頭',         qty:  3, unit: '公斤', exp: '2025-11-04' },
    { storeId: 'hn-taichung', sku: 'GI-061', name: '老薑',         qty:  3, unit: '公斤', exp: '2025-11-06' },
    { storeId: 'hn-taichung', sku: 'OI-070', name: '芥花油',       qty:  6, unit: '桶',   exp: '2026-02-01' },
    { storeId: 'hn-taichung', sku: 'PK-080', name: '外帶紙盒(大)', qty: 60, unit: '個',   exp: null },

    // 高雄店
    { storeId: 'hn-kaohsiung', sku: 'CK-001', name: '去骨雞腿',     qty: 16, unit: '份',   exp: '2025-11-06' },
    { storeId: 'hn-kaohsiung', sku: 'SA-010', name: '海南辣醬',     qty: 12, unit: '罐',   exp: '2026-04-01' },
    { storeId: 'hn-kaohsiung', sku: 'CH-020', name: '朝天椒',       qty:  5, unit: '公斤', exp: '2025-11-03' },
    { storeId: 'hn-kaohsiung', sku: 'RI-030', name: '台梗九號白米', qty: 55, unit: '公斤', exp: null },
    { storeId: 'hn-kaohsiung', sku: 'VE-040', name: '高麗菜',       qty: 10, unit: '顆',   exp: '2025-11-02' },
    { storeId: 'hn-kaohsiung', sku: 'EG-050', name: '雞蛋',         qty:  7, unit: '盒',   exp: '2025-11-01' },
    { storeId: 'hn-kaohsiung', sku: 'GA-060', name: '蒜頭',         qty:  4, unit: '公斤', exp: '2025-11-05' },
    { storeId: 'hn-kaohsiung', sku: 'GI-061', name: '老薑',         qty:  4, unit: '公斤', exp: '2025-11-06' },
    { storeId: 'hn-kaohsiung', sku: 'OI-070', name: '芥花油',       qty:  7, unit: '桶',   exp: '2026-02-01' },
    { storeId: 'hn-kaohsiung', sku: 'PK-080', name: '外帶紙盒(大)', qty: 70, unit: '個',   exp: null },

    // 中央廚房：半成品/原物料
    { storeId: 'central-kitchen', sku: 'MK-100', name: '醃料（秘製）',         qty: 30,  unit: '桶',   exp: '2026-01-15' },
    { storeId: 'central-kitchen', sku: 'PF-110', name: '去骨雞腿（真空包）',   qty: 120, unit: '包',   exp: '2025-11-20' },
    { storeId: 'central-kitchen', sku: 'BR-120', name: '雞高湯基底',           qty: 40,  unit: '桶',   exp: '2025-12-15' },
    { storeId: 'central-kitchen', sku: 'SP-130', name: '香料混合包',           qty: 80,  unit: '包',   exp: '2026-05-01' },
    { storeId: 'central-kitchen', sku: 'RI-030', name: '台梗九號白米',         qty: 300, unit: '公斤', exp: null },
    { storeId: 'central-kitchen', sku: 'OI-070', name: '芥花油',               qty: 40,  unit: '桶',   exp: '2026-02-01' },
  ],

  /* =========================
   * 安全庫存/警戒門檻
   * ========================= */
  thresholds: [
    { id: 'hn-taipei',        storeId: 'hn-taipei',        minQty: 6 },
    { id: 'hn-taichung',      storeId: 'hn-taichung',      minQty: 6 },
    { id: 'hn-kaohsiung',     storeId: 'hn-kaohsiung',     minQty: 6 },
    { id: 'central-kitchen',  storeId: 'central-kitchen',  minQty: 20 }, // 廚房的備料要求較高
  ],

  /* =========================
   * 系統設定
   * ========================= */
  settings: {
    store: {
      allowNegativeStock: false,
      defaultStoreId: 'hn-taipei',
      defaultExpDays: 3,
    },
  },

  /* =========================
   * 供應商 / 來源（老闆打單頁會用到）
   * 例如：中央廚房本身可以當「來源」
   * ========================= */
  vendors: [
    { id: 'vendor-central', name: '中央廚房' },
    { id: 'vendor-poultry', name: '生鮮雞肉供應商' },
    { id: 'vendor-veg',     name: '在地蔬菜行' },
    { id: 'vendor-pack',    name: '包材供應商' },
  ],

  /* =========================
   * 可下單品項清單 / 來源對應
   * （這是老闆端「AI 建議下單 / 手動打單 / 來源設定」要用的資料池）
   * id 對應的是食材 / 品項，vendorIds 是哪些來源提供
   * cat 可以拿來分區顯示在中央廚房頁（熟食區 / 雜項區）
   * ========================= */
  products: [
    { id: 'CK-001', name: '去骨雞腿',         unit: '份',   safeStock: 20, cat: '熟食區',  vendorIds: ['vendor-central','vendor-poultry'] },
    { id: 'SA-010', name: '海南辣醬',         unit: '罐',   safeStock: 10, cat: '雜項區',  vendorIds: ['vendor-central'] },
    { id: 'CH-020', name: '朝天椒',           unit: '公斤', safeStock:  5, cat: '雜項區',  vendorIds: ['vendor-veg'] },
    { id: 'RI-030', name: '台梗九號白米',     unit: '公斤', safeStock: 50, cat: '雜項區',  vendorIds: ['vendor-central'] },
    { id: 'VE-040', name: '高麗菜',           unit: '顆',   safeStock: 10, cat: '雜項區',  vendorIds: ['vendor-veg'] },
    { id: 'EG-050', name: '雞蛋',             unit: '盒',   safeStock: 10, cat: '熟食區',  vendorIds: ['vendor-poultry'] },
    { id: 'GA-060', name: '蒜頭',             unit: '公斤', safeStock:  5, cat: '雜項區',  vendorIds: ['vendor-veg'] },
    { id: 'GI-061', name: '老薑',             unit: '公斤', safeStock:  5, cat: '雜項區',  vendorIds: ['vendor-veg'] },
    { id: 'OI-070', name: '芥花油',           unit: '桶',   safeStock: 10, cat: '雜項區',  vendorIds: ['vendor-pack'] },
    { id: 'PK-080', name: '外帶紙盒(大)',     unit: '個',   safeStock: 80, cat: '雜項區',  vendorIds: ['vendor-pack'] },

    // 中央廚房專屬半成品
    { id: 'MK-100', name: '醃料（秘製）',         unit: '桶',   safeStock: 10, cat: '熟食區',  vendorIds: ['vendor-central'] },
    { id: 'PF-110', name: '去骨雞腿（真空包）',   unit: '包',   safeStock: 50, cat: '熟食區',  vendorIds: ['vendor-central','vendor-poultry'] },
    { id: 'BR-120', name: '雞高湯基底',           unit: '桶',   safeStock: 15, cat: '熟食區',  vendorIds: ['vendor-central'] },
    { id: 'SP-130', name: '香料混合包',           unit: '包',   safeStock: 40, cat: '雜項區',  vendorIds: ['vendor-central'] },
  ],

  /* =========================
   * 中央廚房流程資料
   * 1. kitchenRequests：門市送來的「請貨單」
   * 2. kitchenOrders：中央廚房準備出貨的「訂單」
   * 3. kitchenRecords：已經完成並留檔的出貨紀錄
   *
   * 這三組就是中央廚房頁面三個 tab 對應的資料來源
   * ========================= */
  kitchenRequests: [
    {
      id: 'KR-1',
      storeId: 'hn-taipei',
      date: '2025-10-31',
      status: 'pending',        // pending | partial | done
      allowPartial: false,
      items: [
        { key:'r1', cat:'熟食區', name:'去骨雞腿（真空包）', unit:'包', qty:30, ready:0, note:'' },
        { key:'r2', cat:'熟食區', name:'雞高湯基底',         unit:'桶', qty:10, ready:0, note:'' },
        { key:'r3', cat:'雜項區', name:'芥花油',             unit:'桶', qty: 4, ready:0, note:'' },
      ]
    },
    {
      id: 'KR-2',
      storeId: 'hn-taichung',
      date: '2025-10-31',
      status: 'pending',
      allowPartial: true,
      items: [
        { key:'r4', cat:'熟食區', name:'去骨雞腿（真空包）', unit:'包', qty:20, ready:10, note:'午高峰優先' },
        { key:'r5', cat:'雜項區', name:'外帶紙盒(大)',       unit:'個', qty:40, ready:40, note:'' },
      ]
    },
  ],

  kitchenOrders: [
    // 通常是 kitchenRequests 轉過來的「準備出貨單」
    {
      id: 'KO-1',
      storeId: 'hn-taichung',
      date: '2025-10-31',
      items: [
        { key:'o1', cat:'熟食區', name:'去骨雞腿（真空包）', unit:'包', qty:10, note:'第一批' },
        { key:'o2', cat:'雜項區', name:'外帶紙盒(大)',       unit:'個', qty:40, note:'' },
      ]
    }
  ],

  kitchenRecords: [
    // 出貨完的留存紀錄
    {
      id: 'KD-1',
      storeId: 'hn-taipei',
      date: '2025-10-30',
      summary: '完成出貨：2 項，共 35 單位',
      items: [
        { key:'d1', cat:'熟食區', name:'去骨雞腿（真空包）', unit:'包', qty:25, note:'' },
        { key:'d2', cat:'雜項區', name:'芥花油',             unit:'桶', qty:10, note:'補週末' },
      ]
    }
  ],

  /* =========================
   * 帳號 / 邀請碼
   * ========================= */
  users: [
    { id: 'U001', role: 'boss',    name: '老闆',         email: 'boss@hunanchicken.example' },
    { id: 'U101', role: 'staff',   name: '台北店員A',   email: 'taipeiA@hunanchicken.example',    storeId: 'hn-taipei' },
    { id: 'U201', role: 'staff',   name: '台中店員A',   email: 'taichungA@hunanchicken.example',  storeId: 'hn-taichung' },
    { id: 'U301', role: 'staff',   name: '高雄店員A',   email: 'kaohsiungA@hunanchicken.example', storeId: 'hn-kaohsiung' },
    { id: 'U900', role: 'kitchen', name: '中央廚房人員', email: 'kitchen@hunanchicken.example',   storeId: 'central-kitchen' },
  ],

  invites: [
    { code: 'JOIN-HN-TPE-001', role: 'staff',   storeId: 'hn-taipei',        used: false },
    { code: 'JOIN-HN-TXG-001', role: 'staff',   storeId: 'hn-taichung',      used: false },
    { code: 'JOIN-HN-KHH-001', role: 'staff',   storeId: 'hn-kaohsiung',     used: false },
    { code: 'JOIN-HN-CK-001',  role: 'kitchen', storeId: 'central-kitchen',  used: false },
  ],

  /* =========================
   * 執行階段設定（會隨使用者操作改變）
   * - mode: 'local' | 'firebase'
   *   由你的「系統設置」頁面控制
   * - theme: 'light' | 'dark'
   *   由 UI 切換主題時更新
   * ========================= */
  runtime: {
    mode: 'local',   // 初始為 local。系統設定切到 Firebase 後更新成 'firebase'
    theme: 'light',  // 或 'dark'；主題切換時可以同步寫回來，讓所有頁面吃同一套變數
  },
};

/**
 * default export：
 * 回傳一份深拷貝，避免其他模組直接改 seedData 常數本體
 */
export default function seed() {
  return JSON.parse(JSON.stringify(seedData));
}
