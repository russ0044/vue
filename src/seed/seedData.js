// src/seed/seedData.js
// 統一假資料 / 本地初始資料（海南雞主題加強版，與路由/元件全面對齊）
// 包含：各門市已使用食材與報廢食材（供老闆報表中心展示）

export const seedData = {
  stores: [
    { id: 'hn-taipei', name: '海南雞 台北店' },
    { id: 'hn-taichung', name: '海南雞 台中店' },
    { id: 'hn-kaohsiung', name: '海南雞 高雄店' },
    { id: 'central-kitchen', name: '海南雞 中央廚房', isCentral: true }
  ],

  roleGroups: [
    {
      id: 'rg-boss',
      name: 'Boss（老闆）',
      permissions: [
        'inventory.view', 'inventory.edit', 'ingredients.view', 'roles.manage', 'stores.manage',
        'thresholds.manage', 'orders.config', 'invite.generate', 'reports.view',
        'orders.view', 'orders.create', 'delivery.view', 'kitchen.manage'
      ]
    },
    {
      id: 'rg-store-manager',
      name: 'StoreManager（店長）',
      permissions: [
        'inventory.view', 'inventory.edit', 'ingredients.view',
        'orders.view', 'orders.create', 'delivery.view', 'reports.view'
      ]
    },
    {
      id: 'rg-staff',
      name: 'Staff（店員）',
      permissions: ['inventory.view', 'orders.view', 'orders.create', 'delivery.view']
    },
    {
      id: 'rg-kitchen',
      name: 'Kitchen（中央廚房）',
      permissions: ['kitchen.manage', 'inventory.view', 'inventory.edit', 'orders.view', 'orders.create', 'reports.view']
    },
    {
      id: 'rg-auditor',
      name: 'Auditor（稽核/審計）',
      permissions: ['reports.view']
    }
  ],

  storeGroups: {
    'hn-taipei': ['rg-store-manager', 'rg-staff'],
    'hn-taichung': ['rg-staff'],
    'hn-kaohsiung': ['rg-staff'],
    'central-kitchen': ['rg-kitchen']
  },

  inventory: [
    { storeId: 'hn-taipei', sku: 'CK-001', name: '去骨雞腿（熟）', qty: 22, unit: '份', exp: '2025-12-06' },
    { storeId: 'hn-taipei', sku: 'CK-002', name: '去骨雞胸（熟）', qty: 10, unit: '份', exp: '2025-12-06' },
    { storeId: 'hn-taipei', sku: 'RI-030', name: '泰國香米', qty: 45, unit: '公斤', exp: null },
    { storeId: 'hn-taipei', sku: 'GI-061', name: '老薑', qty: 6, unit: '公斤', exp: '2025-12-07' },
    { storeId: 'hn-taipei', sku: 'GA-060', name: '蒜頭', qty: 7, unit: '公斤', exp: '2025-12-04' },
    { storeId: 'hn-taipei', sku: 'SC-090', name: '蔥', qty: 8, unit: '把', exp: '2025-12-05' },
    { storeId: 'hn-taipei', sku: 'CI-091', name: '香菜', qty: 5, unit: '把', exp: '2025-12-04' },
    { storeId: 'hn-taipei', sku: 'CU-092', name: '小黃瓜', qty: 18, unit: '條', exp: '2025-12-05' },
    { storeId: 'hn-taipei', sku: 'SO-093', name: '醬油', qty: 8, unit: '瓶', exp: '2026-04-01' },
    { storeId: 'hn-taipei', sku: 'OI-070', name: '雞油（調和）', qty: 6, unit: '桶', exp: '2026-02-01' },
    { storeId: 'hn-taipei', sku: 'SE-071', name: '香油', qty: 4, unit: '瓶', exp: '2026-05-01' },
    { storeId: 'hn-taipei', sku: 'SA-010', name: '薑蓉醬', qty: 12, unit: '罐', exp: '2026-04-01' },
    { storeId: 'hn-taipei', sku: 'SA-011', name: '辣椒醬', qty: 14, unit: '罐', exp: '2026-04-01' },
    { storeId: 'hn-taipei', sku: 'SA-012', name: '甜醬油（海南雞）', qty: 10, unit: '罐', exp: '2026-04-01' },
    { storeId: 'hn-taipei', sku: 'PK-080', name: '外帶紙盒(大)', qty: 90, unit: '個', exp: null },
    { storeId: 'hn-taipei', sku: 'CP-081', name: '醬料杯（30ml）', qty: 300, unit: '個', exp: null },

    { storeId: 'hn-taichung', sku: 'CK-001', name: '去骨雞腿（熟）', qty: 14, unit: '份', exp: '2025-12-06' },
    { storeId: 'hn-taichung', sku: 'CK-002', name: '去骨雞胸（熟）', qty: 8, unit: '份', exp: '2025-12-06' },
    { storeId: 'hn-taichung', sku: 'RI-030', name: '泰國香米', qty: 60, unit: '公斤', exp: null },
    { storeId: 'hn-taichung', sku: 'GI-061', name: '老薑', qty: 3, unit: '公斤', exp: '2025-12-06' },
    { storeId: 'hn-taichung', sku: 'GA-060', name: '蒜頭', qty: 3, unit: '公斤', exp: '2025-12-04' },
    { storeId: 'hn-taichung', sku: 'SC-090', name: '蔥', qty: 5, unit: '把', exp: '2025-12-05' },
    { storeId: 'hn-taichung', sku: 'CI-091', name: '香菜', qty: 3, unit: '把', exp: '2025-12-04' },
    { storeId: 'hn-taichung', sku: 'CU-092', name: '小黃瓜', qty: 12, unit: '條', exp: '2025-12-05' },
    { storeId: 'hn-taichung', sku: 'SA-010', name: '薑蓉醬', qty: 8, unit: '罐', exp: '2026-04-01' },
    { storeId: 'hn-taichung', sku: 'SA-011', name: '辣椒醬', qty: 9, unit: '罐', exp: '2026-04-01' },
    { storeId: 'hn-taichung', sku: 'SA-012', name: '甜醬油（海南雞）', qty: 8, unit: '罐', exp: '2026-04-01' },
    { storeId: 'hn-taichung', sku: 'PK-080', name: '外帶紙盒(大)', qty: 60, unit: '個', exp: null },
    { storeId: 'hn-taichung', sku: 'CP-081', name: '醬料杯（30ml）', qty: 180, unit: '個', exp: null },

    { storeId: 'hn-kaohsiung', sku: 'CK-001', name: '去骨雞腿（熟）', qty: 16, unit: '份', exp: '2025-12-06' },
    { storeId: 'hn-kaohsiung', sku: 'CK-002', name: '去骨雞胸（熟）', qty: 9, unit: '份', exp: '2025-12-06' },
    { storeId: 'hn-kaohsiung', sku: 'RI-030', name: '泰國香米', qty: 55, unit: '公斤', exp: null },
    { storeId: 'hn-kaohsiung', sku: 'GI-061', name: '老薑', qty: 4, unit: '公斤', exp: '2025-12-06' },
    { storeId: 'hn-kaohsiung', sku: 'GA-060', name: '蒜頭', qty: 4, unit: '公斤', exp: '2025-12-05' },
    { storeId: 'hn-kaohsiung', sku: 'SC-090', name: '蔥', qty: 6, unit: '把', exp: '2025-12-05' },
    { storeId: 'hn-kaohsiung', sku: 'CI-091', name: '香菜', qty: 4, unit: '把', exp: '2025-12-04' },
    { storeId: 'hn-kaohsiung', sku: 'CU-092', name: '小黃瓜', qty: 15, unit: '條', exp: '2025-12-05' },
    { storeId: 'hn-kaohsiung', sku: 'SA-010', name: '薑蓉醬', qty: 9, unit: '罐', exp: '2026-04-01' },
    { storeId: 'hn-kaohsiung', sku: 'SA-011', name: '辣椒醬', qty: 11, unit: '罐', exp: '2026-04-01' },
    { storeId: 'hn-kaohsiung', sku: 'SA-012', name: '甜醬油（海南雞）', qty: 9, unit: '罐', exp: '2026-04-01' },
    { storeId: 'hn-kaohsiung', sku: 'PK-080', name: '外帶紙盒(大)', qty: 70, unit: '個', exp: null },
    { storeId: 'hn-kaohsiung', sku: 'CP-081', name: '醬料杯（30ml）', qty: 210, unit: '個', exp: null },

    { storeId: 'central-kitchen', sku: 'PF-110', name: '去骨雞腿（真空包，生）', qty: 300, unit: '包', exp: '2025-12-07' },
    { storeId: 'central-kitchen', sku: 'PF-111', name: '去骨雞胸（真空包，生）', qty: 200, unit: '包', exp: '2025-12-07' },
    { storeId: 'central-kitchen', sku: 'BR-120', name: '雞高湯基底', qty: 80, unit: '桶', exp: '2025-12-07' },
    { storeId: 'central-kitchen', sku: 'MK-100', name: '醃料（秘製）', qty: 50, unit: '桶', exp: '2026-01-15' },
    { storeId: 'central-kitchen', sku: 'SP-130', name: '香料混合包', qty: 160, unit: '包', exp: '2026-05-01' },
    { storeId: 'central-kitchen', sku: 'RI-030', name: '泰國香米', qty: 600, unit: '公斤', exp: null },
    { storeId: 'central-kitchen', sku: 'GI-061', name: '老薑', qty: 60, unit: '公斤', exp: '2025-12-07' },
    { storeId: 'central-kitchen', sku: 'GA-060', name: '蒜頭', qty: 60, unit: '公斤', exp: '2025-12-07' },
    { storeId: 'central-kitchen', sku: 'SC-090', name: '蔥', qty: 120, unit: '把', exp: '2025-12-05' },
    { storeId: 'central-kitchen', sku: 'CI-091', name: '香菜', qty: 100, unit: '把', exp: '2025-12-04' },
    { storeId: 'central-kitchen', sku: 'CU-092', name: '小黃瓜', qty: 200, unit: '條', exp: '2025-12-05' },
    { storeId: 'central-kitchen', sku: 'OI-070', name: '芥花油', qty: 40, unit: '桶', exp: '2026-02-01' },
    { storeId: 'central-kitchen', sku: 'CHY-072', name: '雞油', qty: 25, unit: '桶', exp: '2026-03-01' },
    { storeId: 'central-kitchen', sku: 'SE-071', name: '香油', qty: 30, unit: '瓶', exp: '2026-05-01' },
    { storeId: 'central-kitchen', sku: 'SA-010', name: '薑蓉醬', qty: 60, unit: '罐', exp: '2026-04-01' },
    { storeId: 'central-kitchen', sku: 'SA-011', name: '辣椒醬', qty: 60, unit: '罐', exp: '2026-04-01' },
    { storeId: 'central-kitchen', sku: 'SA-012', name: '甜醬油（海南雞）', qty: 60, unit: '罐', exp: '2026-04-01' },
    { storeId: 'central-kitchen', sku: 'PK-080', name: '外帶紙盒(大)', qty: 1200, unit: '個', exp: null },
    { storeId: 'central-kitchen', sku: 'CP-081', name: '醬料杯（30ml）', qty: 6000, unit: '個', exp: null }
  ],

  thresholds: [
    { id: 'hn-taipei', storeId: 'hn-taipei', minQty: 6 },
    { id: 'hn-taichung', storeId: 'hn-taichung', minQty: 6 },
    { id: 'hn-kaohsiung', storeId: 'hn-kaohsiung', minQty: 6 },
    { id: 'central-kitchen', storeId: 'central-kitchen', minQty: 20 }
  ],

  settings: {
    store: {
      allowNegativeStock: false,
      defaultStoreId: 'hn-taipei',
      defaultExpDays: 3
    },
    roles: { emp: '員工', kitchen: '中央廚房' },
    datasource: { mode: 'mock' },
    i18n: { timezone: 'Asia/Taipei' }
  },

  vendors: [
    { id: 'vendor-central', name: '中央廚房', leadTimeDays: 1, phone: '02-0000-0000' },
    { id: 'vendor-poultry', name: '生鮮雞肉供應商', leadTimeDays: 2, phone: '02-1111-1111' },
    { id: 'vendor-veg', name: '在地蔬菜行', leadTimeDays: 1, phone: '02-2222-2222' },
    { id: 'vendor-pack', name: '包材供應商', leadTimeDays: 3, phone: '02-3333-3333' },
    { id: 'vendor-season', name: '調味品供應商', leadTimeDays: 2, phone: '02-4444-4444' },
    { id: 'vendor-rice', name: '進口香米商', leadTimeDays: 5, phone: '02-5555-5555' },
    { id: 'vendor-seafood', name: '海產批發-安東', leadTimeDays: 2, phone: '02-6666-6666' },
    { id: 'vendor-dairy', name: '乳製品供應-新禾', leadTimeDays: 2, phone: '02-7777-7777' },
    { id: 'vendor-disposable', name: '包材王', leadTimeDays: 3, phone: '02-8888-8888' },
    { id: 'vendor-spice', name: '調味醬料-味匠', leadTimeDays: 2, phone: '02-9999-9999' },
    { id: 'vendor-organic', name: '有機菜農-青田', leadTimeDays: 2, phone: '03-1234-5678' },
    { id: 'vendor-frozen', name: '冷凍肉品-泰豐', leadTimeDays: 3, phone: '03-8765-4321' }
  ],

  products: [
    { id: 'CK-001', name: '去骨雞腿（熟）', unit: '份', safeStock: 20, cat: '熟食', vendorIds: ['vendor-central'] },
    { id: 'CK-002', name: '去骨雞胸（熟）', unit: '份', safeStock: 10, cat: '熟食', vendorIds: ['vendor-central'] },
    { id: 'PF-110', name: '去骨雞腿（真空包，生）', unit: '包', safeStock: 50, cat: '半成品', vendorIds: ['vendor-central', 'vendor-poultry', 'vendor-frozen'] },
    { id: 'PF-111', name: '去骨雞胸（真空包，生）', unit: '包', safeStock: 40, cat: '半成品', vendorIds: ['vendor-central', 'vendor-poultry', 'vendor-frozen'] },
    { id: 'BR-120', name: '雞高湯基底', unit: '桶', safeStock: 15, cat: '半成品', vendorIds: ['vendor-central'] },
    { id: 'MK-100', name: '醃料（秘製）', unit: '桶', safeStock: 10, cat: '半成品', vendorIds: ['vendor-central'] },
    { id: 'SP-130', name: '香料混合包', unit: '包', safeStock: 40, cat: '半成品', vendorIds: ['vendor-central', 'vendor-spice'] },
    { id: 'RI-030', name: '泰國香米', unit: '公斤', safeStock: 50, cat: '主食', vendorIds: ['vendor-rice', 'vendor-central'] },
    { id: 'OI-070', name: '芥花油', unit: '桶', safeStock: 10, cat: '油品', vendorIds: ['vendor-pack', 'vendor-disposable'] },
    { id: 'CHY-072', name: '雞油', unit: '桶', safeStock: 5, cat: '油品', vendorIds: ['vendor-season', 'vendor-spice'] },
    { id: 'SE-071', name: '香油', unit: '瓶', safeStock: 5, cat: '油品', vendorIds: ['vendor-season', 'vendor-spice'] },
    { id: 'SA-010', name: '薑蓉醬', unit: '罐', safeStock: 10, cat: '調味', vendorIds: ['vendor-central', 'vendor-season', 'vendor-spice'] },
    { id: 'SA-011', name: '辣椒醬', unit: '罐', safeStock: 10, cat: '調味', vendorIds: ['vendor-central', 'vendor-season', 'vendor-spice'] },
    { id: 'SA-012', name: '甜醬油（海南雞）', unit: '罐', safeStock: 10, cat: '調味', vendorIds: ['vendor-central', 'vendor-season', 'vendor-spice'] },
    { id: 'SO-093', name: '醬油', unit: '瓶', safeStock: 10, cat: '調味', vendorIds: ['vendor-season', 'vendor-spice'] },
    { id: 'GI-061', name: '老薑', unit: '公斤', safeStock: 5, cat: '蔬菜', vendorIds: ['vendor-veg', 'vendor-organic'] },
    { id: 'GA-060', name: '蒜頭', unit: '公斤', safeStock: 5, cat: '蔬菜', vendorIds: ['vendor-veg', 'vendor-organic'] },
    { id: 'SC-090', name: '蔥', unit: '把', safeStock: 5, cat: '蔬菜', vendorIds: ['vendor-veg', 'vendor-organic'] },
    { id: 'CI-091', name: '香菜', unit: '把', safeStock: 5, cat: '蔬菜', vendorIds: ['vendor-veg', 'vendor-organic'] },
    { id: 'CU-092', name: '小黃瓜', unit: '條', safeStock: 15, cat: '蔬菜', vendorIds: ['vendor-veg', 'vendor-organic'] },
    { id: 'PK-080', name: '外帶紙盒(大)', unit: '個', safeStock: 80, cat: '包材', vendorIds: ['vendor-pack', 'vendor-disposable'] },
    { id: 'CP-081', name: '醬料杯（30ml）', unit: '個', safeStock: 200, cat: '包材', vendorIds: ['vendor-pack', 'vendor-disposable'] },
    { id: 'SF-200', name: '花枝片（冷凍）', unit: '包', safeStock: 10, cat: '海鮮', vendorIds: ['vendor-seafood'] },
    { id: 'DA-210', name: '鮮奶（1L）', unit: '瓶', safeStock: 12, cat: '乳品', vendorIds: ['vendor-dairy'] }
  ],

  kitchenRequests: [
    {
      id: 'KR-1',
      storeId: 'hn-taipei',
      date: '2025-11-01',
      status: 'pending',
      allowPartial: true,
      items: [
        { key: 'r1', cat: '半成品', name: '去骨雞腿（真空包，生）', unit: '包', qty: 40, ready: 20, note: '午高峰優先' },
        { key: 'r2', cat: '半成品', name: '雞高湯基底', unit: '桶', qty: 10, ready: 5, note: '' },
        { key: 'r3', cat: '調味', name: '薑蓉醬', unit: '罐', qty: 12, ready: 12, note: '' },
        { key: 'r4', cat: '包材', name: '醬料杯（30ml）', unit: '個', qty: 300, ready: 300, note: '' }
      ]
    },
    {
      id: 'KR-2',
      storeId: 'hn-taichung',
      date: '2025-11-01',
      status: 'pending',
      allowPartial: false,
      items: [
        { key: 'r5', cat: '半成品', name: '去骨雞胸（真空包，生）', unit: '包', qty: 30, ready: 0, note: '' },
        { key: 'r6', cat: '主食', name: '泰國香米', unit: '公斤', qty: 60, ready: 0, note: '' },
        { key: 'r7', cat: '蔬菜', name: '小黃瓜', unit: '條', qty: 30, ready: 0, note: '' }
      ]
    },
    {
      id: 'KR-3',
      storeId: 'hn-kaohsiung',
      date: '2025-11-02',
      status: 'partial',
      allowPartial: true,
      items: [
        { key: 'r8', cat: '半成品', name: '去骨雞腿（真空包，生）', unit: '包', qty: 35, ready: 20, note: '晚高峰' },
        { key: 'r9', cat: '調味', name: '甜醬油（海南雞）', unit: '罐', qty: 10, ready: 10, note: '' }
      ]
    }
  ],

  kitchenOrders: [
    {
      id: 'KO-1',
      storeId: 'hn-taipei',
      date: '2025-11-01',
      items: [
        { key: 'o1', cat: '半成品', name: '去骨雞腿（真空包，生）', unit: '包', qty: 20, note: 'KR-1 部分先出' },
        { key: 'o2', cat: '半成品', name: '雞高湯基底', unit: '桶', qty: 5, note: 'KR-1 配套' },
        { key: 'o3', cat: '調味', name: '薑蓉醬', unit: '罐', qty: 12, note: '' },
        { key: 'o4', cat: '包材', name: '醬料杯（30ml）', unit: '個', qty: 300, note: '' }
      ]
    },
    {
      id: 'KO-2',
      storeId: 'hn-kaohsiung',
      date: '2025-11-02',
      items: [
        { key: 'o5', cat: '半成品', name: '去骨雞腿（真空包，生）', unit: '包', qty: 20, note: '對應 KR-3' },
        { key: 'o6', cat: '調味', name: '甜醬油（海南雞）', unit: '罐', qty: 10, note: '' }
      ]
    }
  ],

  kitchenRecords: [
    {
      id: 'KD-1',
      storeId: 'hn-kaohsiung',
      date: '2025-10-30',
      summary: '完成出貨：3 項，共 85 單位',
      items: [
        { key: 'd1', cat: '半成品', name: '去骨雞腿（真空包，生）', unit: '包', qty: 40, note: '' },
        { key: 'd2', cat: '半成品', name: '雞高湯基底', unit: '桶', qty: 15, note: '' },
        { key: 'd3', cat: '包材', name: '外帶紙盒(大)', unit: '個', qty: 30, note: '' }
      ]
    }
  ],

  kitchenPurchaseOrders: [
    {
      id: 'KPO-2025-1101-01',
      date: '2025-11-01',
      vendorId: 'vendor-poultry',
      status: 'ordered',
      eta: '2025-12-05',
      items: [
        { key: 'p1', productId: 'PF-110', name: '去骨雞腿（真空包，生）', unit: '包', qty: 400, unitPrice: 45 },
        { key: 'p2', productId: 'PF-111', name: '去骨雞胸（真空包，生）', unit: '包', qty: 300, unitPrice: 42 }
      ],
      note: '週末備料需求'
    },
    {
      id: 'KPO-2025-1102-01',
      date: '2025-11-02',
      vendorId: 'vendor-veg',
      status: 'received',
      eta: '2025-12-04',
      items: [
        { key: 'p3', productId: 'SC-090', name: '蔥', unit: '把', qty: 150, unitPrice: 18 },
        { key: 'p4', productId: 'CI-091', name: '香菜', unit: '把', qty: 120, unitPrice: 22 },
        { key: 'p5', productId: 'CU-092', name: '小黃瓜', unit: '條', qty: 240, unitPrice: 12 }
      ],
      note: '蔬菜每日銷耗補充'
    }
  ],

  kitchenMaterialRequests: [
    {
      id: 'KMR-2025-1103-01',
      date: '2025-11-03',
      dept: '烹調線A',
      status: 'approved',
      items: [
        { key: 'm1', sku: 'PF-110', name: '去骨雞腿（真空包，生）', unit: '包', qty: 120 },
        { key: 'm2', sku: 'SP-130', name: '香料混合包', unit: '包', qty: 20 },
        { key: 'm3', sku: 'MK-100', name: '醃料（秘製）', unit: '桶', qty: 6 }
      ],
      note: '今日批次生產雞腿'
    },
    {
      id: 'KMR-2025-1104-01',
      date: '2025-11-04',
      dept: '調味線B',
      status: 'issued',
      items: [
        { key: 'm4', sku: 'SA-010', name: '薑蓉醬', unit: '罐', qty: 30 },
        { key: 'm5', sku: 'SA-011', name: '辣椒醬', unit: '罐', qty: 30 }
      ],
      note: '補充調味醬成品庫位'
    }
  ],

  kitchenProductionBatches: [
    {
      batchId: 'PB-2025-1204-A',
      date: '2025-12-04',
      line: '烹調線A',
      productId: 'CK-001',
      productName: '去骨雞腿（熟）',
      qtyProduced: 240,
      unit: '份',
      inputs: [
        { sku: 'PF-110', name: '去骨雞腿（真空包，生）', unit: '包', qty: 240 },
        { sku: 'SP-130', name: '香料混合包', unit: '包', qty: 20 },
        { sku: 'MK-100', name: '醃料（秘製）', unit: '桶', qty: 4 }
      ],
      outputs: [
        { sku: 'CK-001', name: '去骨雞腿（熟）', unit: '份', qty: 240, exp: '2025-12-06' }
      ],
      waste: { qty: 6, unit: '份', reason: '修切損耗' },
      qc: { passed: true, note: '中心溫度合格' }
    },
    {
      batchId: 'PB-2025-1205-B',
      date: '2025-12-05',
      line: '湯品線',
      productId: 'BR-120',
      productName: '雞高湯基底',
      qtyProduced: 30,
      unit: '桶',
      inputs: [
        { sku: 'PF-111', name: '去骨雞胸（真空包，生）', unit: '包', qty: 100 },
        { sku: 'GI-061', name: '老薑', unit: '公斤', qty: 10 }
      ],
      outputs: [
        { sku: 'BR-120', name: '雞高湯基底', unit: '桶', qty: 30, exp: '2025-12-07' }
      ],
      waste: { qty: 1, unit: '桶', reason: '加熱溢漏' },
      qc: { passed: true, note: '' }
    }
  ],

  users: [
    { id: 'U001', roleGroupId: 'rg-boss', role: 'Boss', name: '老闆', email: 'boss@hunanchicken.example' },
    { id: 'U101', roleGroupId: 'rg-store-manager', role: 'Employee', name: '台北店長A', email: 'tpe-manager@hunanchicken.example', storeId: 'hn-taipei' },
    { id: 'U102', roleGroupId: 'rg-staff', role: 'Employee', name: '台北店員B', email: 'tpe-staff-b@hunanchicken.example', storeId: 'hn-taipei' },
    { id: 'U201', roleGroupId: 'rg-staff', role: 'Employee', name: '台中店員A', email: 'txg-staff-a@hunanchicken.example', storeId: 'hn-taichung' },
    { id: 'U301', roleGroupId: 'rg-staff', role: 'Employee', name: '高雄店員A', email: 'khh-staff-a@hunanchicken.example', storeId: 'hn-kaohsiung' },
    { id: 'U900', roleGroupId: 'rg-kitchen', role: 'Kitchen', name: '中央廚房人員', email: 'kitchen@hunanchicken.example', storeId: 'central-kitchen' }
  ],

  invites: [
    { code: 'JOIN-HN-TPE-MGR-001', roleGroupId: 'rg-store-manager', storeId: 'hn-taipei', used: false },
    { code: 'JOIN-HN-TPE-STF-001', roleGroupId: 'rg-staff', storeId: 'hn-taipei', used: false },
    { code: 'JOIN-HN-TXG-STF-001', roleGroupId: 'rg-staff', storeId: 'hn-taichung', used: false },
    { code: 'JOIN-HN-KHH-STF-001', roleGroupId: 'rg-staff', storeId: 'hn-kaohsiung', used: false },
    { code: 'JOIN-HN-CK-001', roleGroupId: 'rg-kitchen', storeId: 'central-kitchen', used: false },

    // ✅ 新增：短碼邀請 DT8F-T6J9（員工，預設台北門市）
    { code: 'DT8F-T6J9', roleGroupId: 'rg-staff', storeId: 'hn-taipei', used: false }
  ],

  runtime: { theme: 'light' },

  ui: {
    menus: {
      boss: [
        { id: 'm-b1', title: '庫存管理', icon: 'boxes', route: '/boss/inventory', perm: 'inventory.view' },
        { id: 'm-b2', title: '原料與配方', icon: 'flask', route: '/boss/ingredients', perm: 'ingredients.view' },
        { id: 'm-b3', title: '安全庫存門檻', icon: 'alert', route: '/boss/thresholds', perm: 'thresholds.manage' },
        { id: 'm-b4', title: '多店面/據點', icon: 'store', route: '/boss/stores', perm: 'stores.manage' },
        { id: 'm-b5', title: '權限群組', icon: 'shield', route: '/boss/rolegroups', perm: 'roles.manage' },
        { id: 'm-b6', title: '訂單設定', icon: 'settings', route: '/boss/order-settings', perm: 'orders.config' },
        { id: 'm-b7', title: '邀請碼管理', icon: 'ticket', route: '/boss/invite', perm: 'invite.generate' },
        { id: 'm-b8', title: '報表', icon: 'chart', route: '/boss/reports', perm: 'reports.view' }
      ],
      employee: [
        { id: 'm-e1', title: '員工訂單中心', icon: 'cart', route: '/emp/orders', perm: 'orders.view' },
        { id: 'm-e2', title: '門市庫存', icon: 'boxes', route: '/emp/inventory', perm: 'inventory.view' },
        { id: 'm-e3', title: '到貨/配送', icon: 'truck', route: '/emp/delivery', perm: 'delivery.view' },
        { id: 'm-e4', title: '報表（精簡）', icon: 'chart', route: '/emp/reports', perm: 'orders.view' }
      ],
      kitchen: [
        { id: 'm-k1', title: '請貨處理', icon: 'clipboard', route: '/kitchen/requests', perm: 'kitchen.manage' },
        { id: 'm-k2', title: '出貨/訂單', icon: 'truck', route: '/kitchen/orders', perm: 'kitchen.manage' },
        { id: 'm-k3', title: '出貨紀錄', icon: 'history', route: '/kitchen/records', perm: 'kitchen.manage' },
        { id: 'm-k4', title: '庫存（中央）', icon: 'boxes', route: '/emp/inventory?store=central-kitchen', perm: 'inventory.view' }
      ],
      auditor: [
        { id: 'm-a1', title: '報表（只讀）', icon: 'chart', route: '/boss/reports', perm: 'reports.view' }
      ]
    },
    panels: {
      boss: {
        stats: [
          { id: 'pb-s1', label: '總門市數', value: 4, unit: '家' },
          { id: 'pb-s2', label: '本月訂單', value: 128, unit: '張' },
          { id: 'pb-s3', label: '缺料警示', value: 6, unit: '項' },
          { id: 'pb-s4', label: '未處理請貨', value: 3, unit: '單' }
        ],
        shortcuts: [
          { id: 'pb-q1', title: '新增門市', route: '/boss/stores?create=1' },
          { id: 'pb-q2', title: '設定訂單規則', route: '/boss/order-settings' },
          { id: 'pb-q3', title: '管理權限群組', route: '/boss/rolegroups' },
          { id: 'pb-q4', title: '匯出報表', route: '/boss/reports?export=today' }
        ]
      },
      employee: {
        stats: [
          { id: 'pe-s1', label: '今日請貨', value: 2, unit: '單' },
          { id: 'pe-s2', label: '今日到貨', value: 1, unit: '車' },
          { id: 'pe-s3', label: '低於安全量', value: 4, unit: '項' }
        ],
        shortcuts: [
          { id: 'pe-q1', title: '建立請貨單', route: '/emp/orders?new=1' },
          { id: 'pe-q2', title: '查看到貨', route: '/emp/delivery' },
          { id: 'pe-q3', title: '門市庫存', route: '/emp/inventory' }
        ]
      },
      kitchen: {
        stats: [
          { id: 'pk-s1', label: '待處理請貨', value: 2, unit: '單' },
          { id: 'pk-s2', label: '今日出貨', value: 1, unit: '車' },
          { id: 'pk-s3', label: '原料周轉天', value: 12, unit: '天' }
        ],
        shortcuts: [
          { id: 'pk-q1', title: '開始揀貨', route: '/kitchen/requests' },
          { id: 'pk-q2', title: '建立出貨單', route: '/kitchen/orders?new=1' },
          { id: 'pk-q3', title: '查看紀錄', route: '/kitchen/records' }
        ]
      },
      auditor: {
        stats: [
          { id: 'pa-s1', label: '本月核對差異', value: 2, unit: '項' },
          { id: 'pa-s2', label: '抽查門店', value: 3, unit: '家' }
        ],
        shortcuts: [
          { id: 'pa-q1', title: '查看月報', route: '/boss/reports?type=monthly' },
          { id: 'pa-q2', title: '下載審計包', route: '/boss/reports?download=audit' }
        ]
      }
    }
  },

  demo: {
    empRequests: [
      {
        id: 'ER-TPE-001',
        storeId: 'hn-taipei',
        date: '2025-11-09',
        vendorId: 'vendor-central',
        status: 'pending',
        items: [
          { key: 'e1', catId: 'PF-110', name: '去骨雞腿（真空包，生）', unit: '包', qty: 20, note: '' },
          { key: 'e2', catId: 'BR-120', name: '雞高湯基底', unit: '桶', qty: 2, note: '' }
        ]
      },
      {
        id: 'ER-TXG-001',
        storeId: 'hn-taichung',
        date: '2025-11-09',
        vendorId: 'vendor-veg',
        status: 'submitted',
        items: [
          { key: 'e3', catId: 'CU-092', name: '小黃瓜', unit: '條', qty: 18, note: '' },
          { key: 'e4', catId: 'SC-090', name: '蔥', unit: '把', qty: 8, note: '' }
        ]
      }
    ],
    empOrders: [
      {
        id: 'EO-TPE-001',
        storeId: 'hn-taipei',
        date: '2025-11-09',
        vendorId: 'vendor-central',
        items: [
          { key: 'o1', name: '去骨雞腿（真空包，生）', unit: '包', qty: 20, note: '' },
          { key: 'o2', name: '雞高湯基底', unit: '桶', qty: 2, note: '' }
        ]
      }
    ]
  },

  dashboards: {
    stats: {
      totalStores: 4,
      monthOrders: 128,
      safetyAlerts: 6,
      pendingRequests: 3,
      monthRevenueNTD: 865000,
      avgLeadTimeDays: 2.1
    }
  },

  delivery: {
    schedule: [
      {
        id: 'DL-001',
        date: '2025-11-10',
        routeName: '北區一線',
        vehicle: 'TRUCK-12',
        stops: [
          { idx: 1, storeId: 'hn-taipei', eta: '10:00' },
          { idx: 2, storeId: 'hn-taichung', eta: '13:30' }
        ]
      },
      {
        id: 'DL-002',
        date: '2025-11-11',
        routeName: '南區一線',
        vehicle: 'TRUCK-08',
        stops: [{ idx: 1, storeId: 'hn-kaohsiung', eta: '10:30' }]
      }
    ]
  },

  empDeliveries: [
    {
      id: 'ED-TPE-2025-1204-01',
      storeId: 'hn-taipei',
      date: '2025-12-04',
      status: 'on_the_way',
      vehicle: 'TRUCK-12',
      driver: '林師傅',
      eta: '10:20',
      from: '中央廚房',
      items: [
        { key: 'ed1', name: '去骨雞腿（真空包，生）', unit: '包', qty: 40 },
        { key: 'ed2', name: '雞高湯基底', unit: '桶', qty: 6 },
        { key: 'ed3', name: '小黃瓜', unit: '條', qty: 20 }
      ],
      note: '國道順暢'
    },
    {
      id: 'ED-TXG-2025-1205-01',
      storeId: 'hn-taichung',
      date: '2025-12-05',
      status: 'delivered',
      vehicle: 'TRUCK-10',
      driver: '吳師傅',
      eta: '13:40',
      from: '中央廚房',
      items: [
        { key: 'ed4', name: '去骨雞胸（真空包，生）', unit: '包', qty: 30 },
        { key: 'ed5', name: '蔥', unit: '把', qty: 10 },
        { key: 'ed6', name: '香菜', unit: '把', qty: 8 }
      ],
      note: '已簽收，冷鏈正常'
    },
    {
      id: 'ED-KHH-2025-1206-01',
      storeId: 'hn-kaohsiung',
      date: '2025-12-06',
      status: 'delayed',
      vehicle: 'TRUCK-08',
      driver: '周師傅',
      eta: '11:10',
      from: '中央廚房',
      items: [
        { key: 'ed7', name: '去骨雞腿（真空包，生）', unit: '包', qty: 25 },
        { key: 'ed8', name: '甜醬油（海南雞）', unit: '罐', qty: 10 }
      ],
      note: '路口事故改道，延誤 20 分'
    }
  ],

  // 給提醒中心 / 配送頁共用的統一配送事件
  deliveries: [
    {
      id: 'DLV-2025-1204-TPE-01',
      routeId: 'DL-001',
      storeId: 'hn-taipei',
      date: '2025-12-04',
      status: 'on_the_way',
      vehicle: 'TRUCK-12',
      driver: '林師傅',
      from: '中央廚房',
      eta: '10:20',
      stopIndex: 1,
      progress: 60,
      tracking: [
        { time: '09:00', event: '已出車（中央廚房）' },
        { time: '09:40', event: '通過五股交流道' }
      ],
      items: [
        { name: '去骨雞腿（真空包，生）', unit: '包', qty: 40 },
        { name: '雞高湯基底', unit: '桶', qty: 6 }
      ]
    },
    {
      id: 'DLV-2025-1205-TXG-01',
      routeId: 'DL-001',
      storeId: 'hn-taichung',
      date: '2025-12-05',
      status: 'delivered',
      vehicle: 'TRUCK-10',
      driver: '吳師傅',
      from: '中央廚房',
      eta: '13:40',
      stopIndex: 2,
      progress: 100,
      tracking: [
        { time: '11:00', event: '已出車（中央廚房）' },
        { time: '13:35', event: '抵達台中門市' },
        { time: '13:40', event: '完成簽收' }
      ],
      items: [{ name: '去骨雞胸（真空包，生）', unit: '包', qty: 30 }],
      proof: { signedBy: '店長A', photos: [] }
    },
    {
      id: 'DLV-2025-1206-KHH-01',
      routeId: 'DL-002',
      storeId: 'hn-kaohsiung',
      date: '2025-12-06',
      status: 'delayed',
      vehicle: 'TRUCK-08',
      driver: '周師傅',
      from: '中央廚房',
      eta: '11:10',
      stopIndex: 1,
      progress: 35,
      tracking: [
        { time: '09:20', event: '已出車（中央廚房）' },
        { time: '10:10', event: '國道改道，預計延誤 20 分' }
      ],
      items: [
        { name: '去骨雞腿（真空包，生）', unit: '包', qty: 25 },
        { name: '甜醬油（海南雞）', unit: '罐', qty: 10 }
      ],
      delayReason: '路口事故改道'
    }
  ],

  orderSettings: {
    cutOffTime: '15:00',
    defaultVendorId: 'vendor-central',
    allowCrossVendor: true,
    requireNoteWhenOverSafe: false,
    aiSuggestion: { enabled: true, horizonDays: 3, baseTrend: 1.06 }
  },

  reports: {
    samples: [
      {
        id: 'RPT-INV-01',
        title: '庫存週報',
        period: '2025-11-03 ~ 2025-11-09',
        highlights: ['低於門檻 6 項', '周轉天數中位 11 天', '缺料主要集中於蔬菜類']
      },
      {
        id: 'RPT-ORD-02',
        title: '訂單分析月報',
        period: '2025-11',
        highlights: ['中央廚房供應占比 62%', '平均交期 2.1 天', '門市補貨高峰：週五']
      }
    ]
  },

  // 每間門市的已使用與報廢明細（供老闆報表中心使用）
  storeWasteUsage: [
    {
      storeId: 'hn-taipei',
      records: [
        {
          date: '2025-12-01',
          summaryTotals: { usedUnits: 320, wastedUnits: 8 },
          used: [
            { sku: 'CK-001', name: '去骨雞腿（熟）', qty: 150, unit: '份' },
            { sku: 'RI-030', name: '泰國香米', qty: 40, unit: '公斤' },
            { sku: 'SA-011', name: '辣椒醬', qty: 20, unit: '罐' }
          ],
          waste: [
            { sku: 'CK-001', name: '去骨雞腿（熟）', qty: 4, unit: '份', reason: '包裝破損' },
            { sku: 'CI-091', name: '香菜', qty: 4, unit: '把', reason: '過期/品質不佳' }
          ]
        },
        {
          date: '2025-12-04',
          summaryTotals: { usedUnits: 290, wastedUnits: 6 },
          used: [
            { sku: 'CK-001', name: '去骨雞腿（熟）', qty: 130, unit: '份' },
            { sku: 'CU-092', name: '小黃瓜', qty: 16, unit: '條' },
            { sku: 'BR-120', name: '雞高湯基底', qty: 8, unit: '桶' }
          ],
          waste: [
            { sku: 'CK-002', name: '去骨雞胸（熟）', qty: 2, unit: '份', reason: '加工損耗' },
            { sku: 'CU-092', name: '小黃瓜', qty: 4, unit: '條', reason: '外觀不良' }
          ]
        }
      ]
    },
    {
      storeId: 'hn-taichung',
      records: [
        {
          date: '2025-12-01',
          summaryTotals: { usedUnits: 220, wastedUnits: 5 },
          used: [
            { sku: 'CK-001', name: '去骨雞腿（熟）', qty: 90, unit: '份' },
            { sku: 'RI-030', name: '泰國香米', qty: 30, unit: '公斤' },
            { sku: 'SA-010', name: '薑蓉醬', qty: 10, unit: '罐' }
          ],
          waste: [
            { sku: 'GI-061', name: '老薑', qty: 2, unit: '公斤', reason: '過期接近' },
            { sku: 'SA-010', name: '薑蓉醬', qty: 3, unit: '罐', reason: '封蓋洩漏' }
          ]
        },
        {
          date: '2025-12-05',
          summaryTotals: { usedUnits: 240, wastedUnits: 7 },
          used: [
            { sku: 'CK-002', name: '去骨雞胸（熟）', qty: 80, unit: '份' },
            { sku: 'CU-092', name: '小黃瓜', qty: 18, unit: '條' },
            { sku: 'BR-120', name: '雞高湯基底', qty: 6, unit: '桶' }
          ],
          waste: [
            { sku: 'CK-001', name: '去骨雞腿（熟）', qty: 2, unit: '份', reason: '運輸受損' },
            { sku: 'CI-091', name: '香菜', qty: 5, unit: '把', reason: '品質不佳' }
          ]
        }
      ]
    },
    {
      storeId: 'hn-kaohsiung',
      records: [
        {
          date: '2025-12-02',
          summaryTotals: { usedUnits: 200, wastedUnits: 4 },
          used: [
            { sku: 'CK-001', name: '去骨雞腿（熟）', qty: 100, unit: '份' },
            { sku: 'RI-030', name: '泰國香米', qty: 25, unit: '公斤' },
            { sku: 'SA-011', name: '辣椒醬', qty: 8, unit: '罐' }
          ],
          waste: [
            { sku: 'SF-200', name: '花枝片（冷凍）', qty: 2, unit: '包', reason: '冷鏈中斷' },
            { sku: 'CU-092', name: '小黃瓜', qty: 2, unit: '條', reason: '損傷' }
          ]
        },
        {
          date: '2025-12-06',
          summaryTotals: { usedUnits: 220, wastedUnits: 6 },
          used: [
            { sku: 'CK-002', name: '去骨雞胸（熟）', qty: 95, unit: '份' },
            { sku: 'BR-120', name: '雞高湯基底', qty: 7, unit: '桶' },
            { sku: 'CU-092', name: '小黃瓜', qty: 20, unit: '條' }
          ],
          waste: [
            { sku: 'CK-002', name: '去骨雞胸（熟）', qty: 3, unit: '份', reason: '存放不當' },
            { sku: 'SA-012', name: '甜醬油（海南雞）', qty: 3, unit: '罐', reason: '封蓋損壞' }
          ]
        }
      ]
    },
    {
      storeId: 'central-kitchen',
      records: [
        {
          date: '2025-12-04',
          summaryTotals: { usedUnits: 1200, wastedUnits: 12 },
          used: [
            { sku: 'PF-110', name: '去骨雞腿（真空包，生）', qty: 600, unit: '包' },
            { sku: 'SP-130', name: '香料混合包', qty: 40, unit: '包' },
            { sku: 'MK-100', name: '醃料（秘製）', qty: 10, unit: '桶' }
          ],
          waste: [
            { sku: 'PF-110', name: '去骨雞腿（真空包，生）', qty: 6, unit: '包', reason: '切割損耗' },
            { sku: 'BR-120', name: '雞高湯基底', qty: 6, unit: '桶', reason: '加熱溢漏' }
          ]
        },
        {
          date: '2025-12-05',
          summaryTotals: { usedUnits: 800, wastedUnits: 9 },
          used: [
            { sku: 'PF-111', name: '去骨雞胸（真空包，生）', qty: 400, unit: '包' },
            { sku: 'GI-061', name: '老薑', qty: 20, unit: '公斤' }
          ],
          waste: [
            { sku: 'PF-111', name: '去骨雞胸（真空包，生）', qty: 5, unit: '包', reason: '包裝破損' },
            { sku: 'SP-130', name: '香料混合包', qty: 4, unit: '包', reason: '受潮' }
          ]
        }
      ]
    }
  ]
};

export default function seed() {
  return JSON.parse(JSON.stringify(seedData));
}
