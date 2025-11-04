// src/seed/seedData.js
// 統一假資料 / 本地初始資料（海南雞主題加強版，與路由/元件全面對齊）
// - 門市、庫存、中央廚房單據、供應商、邀請碼
// - 角色/權限：Boss、StoreManager（店長）、Staff（店員）、Kitchen（中央廚房），另增 Auditor（只讀報表）
// - 老闆端 / 門市端 / 中央廚房端 共用
// - settings.datasource.mode / settings.i18n.timezone / settings.roles 供 UI 直接讀取
// - storeGroups：各門市已套用的權限群組（BossRoleGroups 右側 Dock 會用）
// - runtime.theme 留給全域主題切換（搭配 :root.dark）

export const seedData = {
  /* =========================
   * 門市 / 據點
   * ========================= */
  stores: [
    { id: 'hn-taipei',       name: '海南雞 台北店' },
    { id: 'hn-taichung',     name: '海南雞 台中店' },
    { id: 'hn-kaohsiung',    name: '海南雞 高雄店' },
    { id: 'central-kitchen', name: '海南雞 中央廚房', isCentral: true },
  ],

  /* =========================
   * 角色群組 / 權限（與 router meta.requiresPerm 對齊）
   * 欄位統一用 permissions
   * ========================= */
  roleGroups: [
    {
      id: 'rg-boss',
      name: 'Boss（老闆）',
      permissions: [
        // 後台管理與查詢（全開）
        'inventory.view',
        'inventory.edit',
        'ingredients.view',
        'roles.manage',
        'stores.manage',
        'thresholds.manage',
        'orders.config',
        'invite.generate',
        'reports.view',
        // 門市端
        'orders.view',
        'orders.create',
        'delivery.view',
        // 廚房端
        'kitchen.manage',
      ],
    },
    {
      id: 'rg-store-manager',
      name: 'StoreManager（店長）',
      // 單店多數權限：可看報表、可看/編輯庫存、可看/建立訂單、可看配送
      permissions: [
        'inventory.view',
        'inventory.edit',   // ★ 新增：店長可編輯庫存（盤點/調整）
        'ingredients.view',
        'orders.view',
        'orders.create',    // ★ 新增：店長可送單/建立
        'delivery.view',
        'reports.view',
        // 不允許：roles.manage / stores.manage / thresholds.manage / orders.config / invite.generate / （不直接開）kitchen.manage
      ],
    },
    {
      id: 'rg-staff',
      name: 'Staff（店員）',
      // 一般員工：可查看庫存、可送單、可看配送；不開報表/主檔
      permissions: [
        'inventory.view',
        'orders.view',
        'orders.create',    // ★ 新增：維持員工可送單的體驗
        'delivery.view',
      ],
    },
    {
      id: 'rg-kitchen',
      name: 'Kitchen（中央廚房）',
      // 補齊廚房需要的訂單/庫存/報表權限
      permissions: [
        'kitchen.manage',
        'inventory.view',
        'inventory.edit',
        'orders.view',
        'orders.create',
        'reports.view',
      ],
    },
    {
      id: 'rg-auditor',
      name: 'Auditor（稽核/審計）',
      permissions: ['reports.view'],
    },
  ],

  /* =========================
   * 門市已套用的群組（BossRoleGroups 右側 Dock/Applied 使用）
   * - key = storeId, value = roleGroupId 陣列（順序可拖曳）
   * ========================= */
  storeGroups: {
    'hn-taipei':      ['rg-store-manager', 'rg-staff'],
    'hn-taichung':    ['rg-staff'],
    'hn-kaohsiung':   ['rg-staff'],
    'central-kitchen':['rg-kitchen'],
  },

  /* =========================
   * 各據點即時庫存（含中央廚房原料）
   * exp: yyyy-mm-dd 或 null
   * ========================= */
  inventory: [
    // 台北店（示範店長開放權限的那一間）
    { storeId: 'hn-taipei', sku: 'CK-001', name: '去骨雞腿（熟）',     qty: 22,  unit: '份',   exp: '2025-11-06' },
    { storeId: 'hn-taipei', sku: 'CK-002', name: '去骨雞胸（熟）',     qty: 10,  unit: '份',   exp: '2025-11-06' },
    { storeId: 'hn-taipei', sku: 'RI-030', name: '泰國香米',           qty: 45,  unit: '公斤', exp: null },
    { storeId: 'hn-taipei', sku: 'GI-061', name: '老薑',               qty:  6,  unit: '公斤', exp: '2025-11-07' },
    { storeId: 'hn-taipei', sku: 'GA-060', name: '蒜頭',               qty:  7,  unit: '公斤', exp: '2025-11-04' },
    { storeId: 'hn-taipei', sku: 'SC-090', name: '蔥',                 qty:  8,  unit: '把',   exp: '2025-11-03' },
    { storeId: 'hn-taipei', sku: 'CI-091', name: '香菜',               qty:  5,  unit: '把',   exp: '2025-11-02' },
    { storeId: 'hn-taipei', sku: 'CU-092', name: '小黃瓜',             qty: 18,  unit: '條',   exp: '2025-11-03' },
    { storeId: 'hn-taipei', sku: 'SO-093', name: '醬油',               qty:  8,  unit: '瓶',   exp: '2026-04-01' },
    { storeId: 'hn-taipei', sku: 'OI-070', name: '雞油（調和）',       qty:  6,  unit: '桶',   exp: '2026-02-01' },
    { storeId: 'hn-taipei', sku: 'SE-071', name: '香油',               qty:  4,  unit: '瓶',   exp: '2026-05-01' },
    { storeId: 'hn-taipei', sku: 'SA-010', name: '薑蓉醬',             qty: 12,  unit: '罐',   exp: '2026-04-01' },
    { storeId: 'hn-taipei', sku: 'SA-011', name: '辣椒醬',             qty: 14,  unit: '罐',   exp: '2026-04-01' },
    { storeId: 'hn-taipei', sku: 'SA-012', name: '甜醬油（海南雞）',   qty: 10,  unit: '罐',   exp: '2026-04-01' },
    { storeId: 'hn-taipei', sku: 'PK-080', name: '外帶紙盒(大)',       qty: 90,  unit: '個',   exp: null },
    { storeId: 'hn-taipei', sku: 'CP-081', name: '醬料杯（30ml）',     qty: 300, unit: '個',   exp: null },

    // 台中店
    { storeId: 'hn-taichung', sku: 'CK-001', name: '去骨雞腿（熟）',   qty: 14,  unit: '份',   exp: '2025-11-05' },
    { storeId: 'hn-taichung', sku: 'CK-002', name: '去骨雞胸（熟）',   qty:  8,  unit: '份',   exp: '2025-11-05' },
    { storeId: 'hn-taichung', sku: 'RI-030', name: '泰國香米',         qty: 60,  unit: '公斤', exp: null },
    { storeId: 'hn-taichung', sku: 'GI-061', name: '老薑',             qty:  3,  unit: '公斤', exp: '2025-11-06' },
    { storeId: 'hn-taichung', sku: 'GA-060', name: '蒜頭',             qty:  3,  unit: '公斤', exp: '2025-11-04' },
    { storeId: 'hn-taichung', sku: 'SC-090', name: '蔥',               qty:  5,  unit: '把',   exp: '2025-11-03' },
    { storeId: 'hn-taichung', sku: 'CI-091', name: '香菜',             qty:  3,  unit: '把',   exp: '2025-11-02' },
    { storeId: 'hn-taichung', sku: 'CU-092', name: '小黃瓜',           qty: 12,  unit: '條',   exp: '2025-11-03' },
    { storeId: 'hn-taichung', sku: 'SA-010', name: '薑蓉醬',           qty:  8,  unit: '罐',   exp: '2026-04-01' },
    { storeId: 'hn-taichung', sku: 'SA-011', name: '辣椒醬',           qty:  9,  unit: '罐',   exp: '2026-04-01' },
    { storeId: 'hn-taichung', sku: 'SA-012', name: '甜醬油（海南雞）', qty:  8,  unit: '罐',   exp: '2026-04-01' },
    { storeId: 'hn-taichung', sku: 'PK-080', name: '外帶紙盒(大)',     qty: 60,  unit: '個',   exp: null },
    { storeId: 'hn-taichung', sku: 'CP-081', name: '醬料杯（30ml）',   qty: 180, unit: '個',   exp: null },

    // 高雄店
    { storeId: 'hn-kaohsiung', sku: 'CK-001', name: '去骨雞腿（熟）',  qty: 16,  unit: '份',   exp: '2025-11-06' },
    { storeId: 'hn-kaohsiung', sku: 'CK-002', name: '去骨雞胸（熟）',  qty:  9,  unit: '份',   exp: '2025-11-06' },
    { storeId: 'hn-kaohsiung', sku: 'RI-030', name: '泰國香米',        qty: 55,  unit: '公斤', exp: null },
    { storeId: 'hn-kaohsiung', sku: 'GI-061', name: '老薑',            qty:  4,  unit: '公斤', exp: '2025-11-06' },
    { storeId: 'hn-kaohsiung', sku: 'GA-060', name: '蒜頭',            qty:  4,  unit: '公斤', exp: '2025-11-05' },
    { storeId: 'hn-kaohsiung', sku: 'SC-090', name: '蔥',              qty:  6,  unit: '把',   exp: '2025-11-03' },
    { storeId: 'hn-kaohsiung', sku: 'CI-091', name: '香菜',            qty:  4,  unit: '把',   exp: '2025-11-02' },
    { storeId: 'hn-kaohsiung', sku: 'CU-092', name: '小黃瓜',          qty: 15,  unit: '條',   exp: '2025-11-03' },
    { storeId: 'hn-kaohsiung', sku: 'SA-010', name: '薑蓉醬',          qty:  9,  unit: '罐',   exp: '2026-04-01' },
    { storeId: 'hn-kaohsiung', sku: 'SA-011', name: '辣椒醬',          qty: 11,  unit: '罐',   exp: '2026-04-01' },
    { storeId: 'hn-kaohsiung', sku: 'SA-012', name: '甜醬油（海南雞）',qty:  9,  unit: '罐',   exp: '2026-04-01' },
    { storeId: 'hn-kaohsiung', sku: 'PK-080', name: '外帶紙盒(大)',    qty: 70,  unit: '個',   exp: null },
    { storeId: 'hn-kaohsiung', sku: 'CP-081', name: '醬料杯（30ml）',  qty: 210, unit: '個',   exp: null },

    // 中央廚房：半成品/原物料（大宗）
    { storeId: 'central-kitchen', sku: 'PF-110', name: '去骨雞腿（真空包，生）', qty: 300, unit: '包',   exp: '2025-11-20' },
    { storeId: 'central-kitchen', sku: 'PF-111', name: '去骨雞胸（真空包，生）', qty: 200, unit: '包',   exp: '2025-11-20' },
    { storeId: 'central-kitchen', sku: 'BR-120', name: '雞高湯基底',             qty:  80, unit: '桶',   exp: '2025-12-15' },
    { storeId: 'central-kitchen', sku: 'MK-100', name: '醃料（秘製）',           qty:  50, unit: '桶',   exp: '2026-01-15' },
    { storeId: 'central-kitchen', sku: 'SP-130', name: '香料混合包',             qty: 160, unit: '包',  exp: '2026-05-01' },
    { storeId: 'central-kitchen', sku: 'RI-030', name: '泰國香米',               qty: 600, unit: '公斤', exp: null },
    { storeId: 'central-kitchen', sku: 'GI-061', name: '老薑',                   qty:  60, unit: '公斤', exp: '2025-11-20' },
    { storeId: 'central-kitchen', sku: 'GA-060', name: '蒜頭',                   qty:  60, unit: '公斤', exp: '2025-11-20' },
    { storeId: 'central-kitchen', sku: 'SC-090', name: '蔥',                     qty: 120, unit: '把',   exp: '2025-11-05' },
    { storeId: 'central-kitchen', sku: 'CI-091', name: '香菜',                   qty: 100, unit: '把',   exp: '2025-11-04' },
    { storeId: 'central-kitchen', sku: 'CU-092', name: '小黃瓜',                 qty: 200, unit: '條',   exp: '2025-11-05' },
    { storeId: 'central-kitchen', sku: 'OI-070', name: '芥花油',                 qty:  40, unit: '桶',   exp: '2026-02-01' },
    { storeId: 'central-kitchen', sku: 'CHY-072', name: '雞油',                  qty:  25, unit: '桶',   exp: '2026-03-01' },
    { storeId: 'central-kitchen', sku: 'SE-071', name: '香油',                   qty:  30, unit: '瓶',   exp: '2026-05-01' },
    { storeId: 'central-kitchen', sku: 'SA-010', name: '薑蓉醬',                 qty:  60, unit: '罐',   exp: '2026-04-01' },
    { storeId: 'central-kitchen', sku: 'SA-011', name: '辣椒醬',                 qty:  60, unit: '罐',   exp: '2026-04-01' },
    { storeId: 'central-kitchen', sku: 'SA-012', name: '甜醬油（海南雞）',       qty:  60, unit: '罐',   exp: '2026-04-01' },
    { storeId: 'central-kitchen', sku: 'PK-080', name: '外帶紙盒(大)',           qty: 1200, unit: '個',  exp: null },
    { storeId: 'central-kitchen', sku: 'CP-081', name: '醬料杯（30ml）',         qty: 6000, unit: '個',  exp: null },
  ],

  /* =========================
   * 安全庫存/警戒門檻
   * ========================= */
  thresholds: [
    { id: 'hn-taipei',       storeId: 'hn-taipei',       minQty: 6 },
    { id: 'hn-taichung',     storeId: 'hn-taichung',     minQty: 6 },
    { id: 'hn-kaohsiung',    storeId: 'hn-kaohsiung',    minQty: 6 },
    { id: 'central-kitchen', storeId: 'central-kitchen', minQty: 20 },
  ],

  /* =========================
   * 系統設定（供 UI 直接讀取）
   * ========================= */
  settings: {
    store: {
      allowNegativeStock: false,
      defaultStoreId: 'hn-taipei',
      defaultExpDays: 3,
    },
    roles: {
      emp: '員工',
      kitchen: '中央廚房',
    },
    datasource: {
      mode: 'mock', // 'mock' | 'firebase'
    },
    i18n: {
      timezone: 'Asia/Taipei',
    },
  },

  /* =========================
   * 供應商 / 來源
   * ========================= */
  vendors: [
    { id: 'vendor-central', name: '中央廚房' },
    { id: 'vendor-poultry', name: '生鮮雞肉供應商' },
    { id: 'vendor-veg',     name: '在地蔬菜行' },
    { id: 'vendor-pack',    name: '包材供應商' },
    { id: 'vendor-season',  name: '調味品供應商' },
    { id: 'vendor-rice',    name: '進口香米商' },
  ],

  /* =========================
   * 可下單品項清單 / 來源對應
   * ========================= */
  products: [
    // 熟食 / 半成品（給門市出餐）
    { id: 'CK-001', name: '去骨雞腿（熟）',         unit: '份',   safeStock: 20, cat: '熟食',   vendorIds: ['vendor-central'] },
    { id: 'CK-002', name: '去骨雞胸（熟）',         unit: '份',   safeStock: 10, cat: '熟食',   vendorIds: ['vendor-central'] },

    // 半成品（中央廚房→門市）
    { id: 'PF-110', name: '去骨雞腿（真空包，生）', unit: '包',   safeStock: 50, cat: '半成品', vendorIds: ['vendor-central','vendor-poultry'] },
    { id: 'PF-111', name: '去骨雞胸（真空包，生）', unit: '包',   safeStock: 40, cat: '半成品', vendorIds: ['vendor-central','vendor-poultry'] },
    { id: 'BR-120', name: '雞高湯基底',             unit: '桶',   safeStock: 15, cat: '半成品', vendorIds: ['vendor-central'] },
    { id: 'MK-100', name: '醃料（秘製）',           unit: '桶',   safeStock: 10, cat: '半成品', vendorIds: ['vendor-central'] },
    { id: 'SP-130', name: '香料混合包',             unit: '包',   safeStock: 40, cat: '半成品', vendorIds: ['vendor-central'] },

    // 主食 / 油
    { id: 'RI-030', name: '泰國香米',               unit: '公斤', safeStock: 50, cat: '主食',   vendorIds: ['vendor-rice','vendor-central'] },
    { id: 'OI-070', name: '芥花油',                 unit: '桶',   safeStock: 10, cat: '油品',   vendorIds: ['vendor-pack'] },
    { id: 'CHY-072', name: '雞油',                  unit: '桶',   safeStock:  5, cat: '油品',   vendorIds: ['vendor-season'] },
    { id: 'SE-071', name: '香油',                   unit: '瓶',   safeStock:  5, cat: '油品',   vendorIds: ['vendor-season'] },

    // 調味三寶 + 甜醬油
    { id: 'SA-010', name: '薑蓉醬',                 unit: '罐',   safeStock: 10, cat: '調味',   vendorIds: ['vendor-central','vendor-season'] },
    { id: 'SA-011', name: '辣椒醬',                 unit: '罐',   safeStock: 10, cat: '調味',   vendorIds: ['vendor-central','vendor-season'] },
    { id: 'SA-012', name: '甜醬油（海南雞）',       unit: '罐',   safeStock: 10, cat: '調味',   vendorIds: ['vendor-central','vendor-season'] },
    { id: 'SO-093', name: '醬油',                   unit: '瓶',   safeStock: 10, cat: '調味',   vendorIds: ['vendor-season'] },

    // 蔬菜 / 香草
    { id: 'GI-061', name: '老薑',                   unit: '公斤', safeStock:  5, cat: '蔬菜',   vendorIds: ['vendor-veg'] },
    { id: 'GA-060', name: '蒜頭',                   unit: '公斤', safeStock:  5, cat: '蔬菜',   vendorIds: ['vendor-veg'] },
    { id: 'SC-090', name: '蔥',                     unit: '把',   safeStock:  5, cat: '蔬菜',   vendorIds: ['vendor-veg'] },
    { id: 'CI-091', name: '香菜',                   unit: '把',   safeStock:  5, cat: '蔬菜',   vendorIds: ['vendor-veg'] },
    { id: 'CU-092', name: '小黃瓜',                 unit: '條',   safeStock: 15, cat: '蔬菜',   vendorIds: ['vendor-veg'] },

    // 包材
    { id: 'PK-080', name: '外帶紙盒(大)',           unit: '個',   safeStock: 80, cat: '包材',   vendorIds: ['vendor-pack'] },
    { id: 'CP-081', name: '醬料杯（30ml）',         unit: '個',   safeStock: 200,cat: '包材',   vendorIds: ['vendor-pack'] },
  ],

  /* =========================
   * 中央廚房流程資料
   * ========================= */
  kitchenRequests: [
    {
      id: 'KR-1',
      storeId: 'hn-taipei',
      date: '2025-11-01',
      status: 'pending',        // pending | partial | done
      allowPartial: true,
      items: [
        { key:'r1', cat:'半成品', name:'去骨雞腿（真空包，生）', unit:'包',   qty:40, ready:20, note:'午高峰優先' },
        { key:'r2', cat:'半成品', name:'雞高湯基底',             unit:'桶',   qty:10, ready: 5, note:'' },
        { key:'r3', cat:'調味',   name:'薑蓉醬',                   unit:'罐',   qty:12, ready:12, note:'' },
        { key:'r4', cat:'包材',   name:'醬料杯（30ml）',           unit:'個',   qty:300,ready:300,note:'' },
      ],
    },
    {
      id: 'KR-2',
      storeId: 'hn-taichung',
      date: '2025-11-01',
      status: 'pending',
      allowPartial: false,
      items: [
        { key:'r5', cat:'半成品', name:'去骨雞胸（真空包，生）', unit:'包',   qty:30, ready:0, note:'' },
        { key:'r6', cat:'主食',   name:'泰國香米',                 unit:'公斤', qty:60, ready:0, note:'' },
        { key:'r7', cat:'蔬菜',   name:'小黃瓜',                   unit:'條',   qty:30, ready:0, note:'' },
      ],
    },
  ],

  kitchenOrders: [
    {
      id: 'KO-1',
      storeId: 'hn-taipei',
      date: '2025-11-01',
      items: [
        { key:'o1', cat:'半成品', name:'去骨雞腿（真空包，生）', unit:'包', qty:20, note:'KR-1 部分先出' },
        { key:'o2', cat:'半成品', name:'雞高湯基底',             unit:'桶', qty: 5, note:'KR-1 配套' },
        { key:'o3', cat:'調味',   name:'薑蓉醬',                   unit:'罐', qty:12, note:'' },
        { key:'o4', cat:'包材',   name:'醬料杯（30ml）',           unit:'個', qty:300,note:'' },
      ],
    },
  ],

  kitchenRecords: [
    {
      id: 'KD-1',
      storeId: 'hn-kaohsiung',
      date: '2025-10-30',
      summary: '完成出貨：3 項，共 85 單位',
      items: [
        { key:'d1', cat:'半成品', name:'去骨雞腿（真空包，生）', unit:'包', qty:40, note:'' },
        { key:'d2', cat:'半成品', name:'雞高湯基底',             unit:'桶', qty:15, note:'' },
        { key:'d3', cat:'包材',   name:'外帶紙盒(大)',           unit:'個', qty:30, note:'' },
      ],
    },
  ],

  /* =========================
   * 帳號 / 使用者
   * - 角色欄位統一為 'Boss' | 'Employee' | 'Kitchen'
   * - 店長與店員都屬 Employee，但 roleGroupId 不同
   * ========================= */
  users: [
    // 老闆（擁有 rg-boss 全權）
    { id: 'U001', roleGroupId: 'rg-boss', role: 'Boss', name: '老闆', email: 'boss@hunanchicken.example' },

    // 台北店：店長 + 店員
    { id: 'U101', roleGroupId: 'rg-store-manager', role: 'Employee', name: '台北店長A', email: 'tpe-manager@hunanchicken.example', storeId: 'hn-taipei' },
    { id: 'U102', roleGroupId: 'rg-staff',         role: 'Employee', name: '台北店員B',  email: 'tpe-staff-b@hunanchicken.example', storeId: 'hn-taipei' },

    // 台中店：一般店員
    { id: 'U201', roleGroupId: 'rg-staff',         role: 'Employee', name: '台中店員A',  email: 'txg-staff-a@hunanchicken.example', storeId: 'hn-taichung' },

    // 高雄店：一般店員
    { id: 'U301', roleGroupId: 'rg-staff',         role: 'Employee', name: '高雄店員A',  email: 'khh-staff-a@hunanchicken.example', storeId: 'hn-kaohsiung' },

    // 中央廚房人員
    { id: 'U900', roleGroupId: 'rg-kitchen',       role: 'Kitchen',  name: '中央廚房人員', email: 'kitchen@hunanchicken.example',    storeId: 'central-kitchen' },
  ],

  /* =========================
   * 邀請碼（綁定角色群組）
   * ========================= */
  invites: [
    { code: 'JOIN-HN-TPE-MGR-001', roleGroupId: 'rg-store-manager', storeId: 'hn-taipei',       used: false },
    { code: 'JOIN-HN-TPE-STF-001', roleGroupId: 'rg-staff',         storeId: 'hn-taipei',       used: false },
    { code: 'JOIN-HN-TXG-STF-001', roleGroupId: 'rg-staff',         storeId: 'hn-taichung',     used: false },
    { code: 'JOIN-HN-KHH-STF-001', roleGroupId: 'rg-staff',         storeId: 'hn-kaohsiung',    used: false },
    { code: 'JOIN-HN-CK-001',      roleGroupId: 'rg-kitchen',       storeId: 'central-kitchen', used: false },
  ],

  /* =========================
   * 執行階段設定（可由系統設定頁寫回）
   * ========================= */
  runtime: {
    theme: 'light',
  },
};

/**
 * default export：
 * 回傳一份深拷貝，避免其他模組直接改 seedData 常數本體
 */
export default function seed() {
  return JSON.parse(JSON.stringify(seedData));
}
