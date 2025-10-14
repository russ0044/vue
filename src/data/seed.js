export const seedData = {
  meta:{ version:4 },
  users:[
    { id:'U001', email:'boss@example.com', name:'老闆', phone:'0912-345-678', roleGroupId:'RG-BOSS', createdAt:Date.now() }
  ],
  roleGroups:[
    { id:'RG-BOSS', name:'老闆', permissions:['INV_READ','INV_WRITE','ING_READ','ING_WRITE','STORE_CFG','ROLE_CFG','ORDER_MGMT','REPORT_VIEW'] },
    { id:'RG-EMP',  name:'員工', permissions:['INV_READ','ING_READ','REPORT_VIEW'] },
    { id:'RG-CK',   name:'中央廚房', permissions:['INV_READ','ING_READ','ING_WRITE','REPORT_VIEW'] },
  ],
  stores:[
    { id:'S001', name:'雲科店', address:'斗六鎮學府路1號', phone:'05-1234567', type:'branch' },
    { id:'S002', name:'中央廚房', address:'斗六鎮工專路88號', phone:'05-7654321', type:'central' }
  ],
  thresholds:[
    { storeId:'S001', minQty:10, expDays:3 },
    { storeId:'S002', minQty:10, expDays:3 },
  ],
  // 海南雞系列
  ingredients:[
    { sku:'HCH-CHLEG',  name:'雞腿',   unit:'公斤', cost:160, supplier:'優鮮' },
    { sku:'HCH-CHBRST', name:'雞胸',   unit:'公斤', cost:140, supplier:'優鮮' },
    { sku:'HCH-RICE',   name:'白米',   unit:'包',  cost:45,  supplier:'米行' },
    { sku:'HCH-GINGER', name:'老薑',   unit:'公斤', cost:80,  supplier:'蔬果商' },
    { sku:'HCH-GARLIC', name:'蒜頭',   unit:'公斤', cost:120, supplier:'蔬果商' },
    { sku:'HCH-SCALLI', name:'蔥',     unit:'把',  cost:30,  supplier:'蔬果商' },
    { sku:'HCH-PANDAN', name:'香蘭葉', unit:'把',  cost:65,  supplier:'南香' },
    { sku:'HCH-CHKFAT', name:'雞油',   unit:'罐',  cost:90,  supplier:'油坊' },
    { sku:'HCH-CHKBRO', name:'雞高湯', unit:'包',  cost:55,  supplier:'中央廚' },
    { sku:'HCH-CUCUM',  name:'黃瓜',   unit:'條',  cost:18,  supplier:'蔬果商' },
    { sku:'HCH-CHILI',  name:'辣椒醬', unit:'罐',  cost:60,  supplier:'調味社' },
    { sku:'HCH-SWEET',  name:'甜醬油', unit:'罐',  cost:60,  supplier:'調味社' },
  ],
  inventory:[
    { storeId:'S001', sku:'HCH-CHLEG',  name:'雞腿',   unit:'公斤', qty:20, low:10, exp:'2025-09-12' },
    { storeId:'S001', sku:'HCH-RICE',   name:'白米',   unit:'包',  qty:50, low:20, exp:'2026-02-01' },
    { storeId:'S001', sku:'HCH-GINGER', name:'老薑',   unit:'公斤', qty:8,  low:5,  exp:'2025-09-05' },
    { storeId:'S001', sku:'HCH-GARLIC', name:'蒜頭',   unit:'公斤', qty:10, low:5,  exp:'2025-09-15' },
    { storeId:'S001', sku:'HCH-CHILI',  name:'辣椒醬', unit:'罐',  qty:12, low:6,  exp:'2026-06-30' },
    { storeId:'S002', sku:'HCH-CHKBRO', name:'雞高湯', unit:'包',  qty:30, low:10, exp:'2025-12-20' },
    { storeId:'S002', sku:'HCH-PANDAN', name:'香蘭葉', unit:'把',  qty:6,  low:5,  exp:'2025-09-06' },
  ],
  inventoryChanges:[],
  invites:[], // 老闆發送的邀請碼
  settings:{
    store: { allowNegativeStock:false, defaultStoreId:'S001' },
    roles: { emp:'員工', kitchen:'中央廚房' } // 可由系統設定改名
  }
}
