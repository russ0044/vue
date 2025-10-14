export const seedData = {
  // ... 你原有的 users / roleGroups / stores / thresholds / ingredients / inventory ...
  settings:{
    store:{ allowNegativeStock:false, defaultStoreId:'S001', defaultMinQty:10, defaultExpDays:3 },
    roles:{
      aliases:{ Boss:'老闆', Employee:'員工', Kitchen:'中央廚房' },
      permissions:{
        Boss:['INV_READ','INV_WRITE','ING_READ','ING_WRITE','STORE_CFG','ROLE_CFG','ORDER_MGMT','REPORT_VIEW'],
        Employee:['INV_READ','REPORT_VIEW','ORDER_VIEW','DELIVERY_VIEW'],
        Kitchen:['INV_READ','ING_WRITE','REPORT_VIEW']
      }
    },
    invites:{ defaultDays:7 }
  },
  invites:[]
}
