import { createRouter, createWebHistory } from 'vue-router'
import SettingView from '../view/SettingView.vue'
import LoginView from '../view/LoginView.vue'
import RoleSelectView from '../view/RoleSelectView.vue'
import Employee from '../view/Employee.vue'
import Boss from '../view/Boss.vue'
import Kitchen from '../view/Kitchen.vue'
import DashBroadView from '../view/DashBroadView.vue'
import StoreInventory from '../employee/StoreInventory.vue' 
import StockStatus from '../employee/StockStatus.vue' 
import StoreMovementMenu from '../employee/StoreMovementMenu.vue' 
import StockMove from '../employee/StockMove.vue' 
import StockMoveLog from '../employee/StockMoveLog.vue' 
import StockMoveForm from '../employee/StockMoveForm.vue'
import OrdersMenu from '../employee_orders/OrdersMenu.vue'
import OrderManage from '../employee_orders/OrderManage.vue'
import OrderHistory from '../employee_orders/OrderHistory.vue'
import OrderAI from '../employee_orders/OrderAI.vue'
import OrderManual from '../employee_orders/OrderManual.vue'
import ExternalOrder from '../employee_orders/ExternalOrder.vue'
import KitchenRequisition from '../employee_orders/KitchenRequisition.vue'
import Reports from '../employee_reports/Reports.vue'
import Stock from '../employee_reports/Stock.vue'
import Orders  from '../employee_reports/Orders.vue'
import Sales from '../employee_reports/Sales.vue'
import Delivery from '../employee_delivery/Delivery.vue'
import Today  from '../employee_delivery/Today.vue'
import Historys from '../employee_delivery/Historys.vue'
import Routes from '../employee_delivery/Routes.vue'



const routes = [
  { path: '/', component: LoginView },
  { path: '/setting', component: SettingView },
  { path: '/role', component: RoleSelectView },
  { path: '/employee', component: Employee },
  { path: '/boss', component: Boss },
  { path: '/Kitchen', component: Kitchen },
  { path: '/DashBroadView', component: DashBroadView },
  { path: '/storeInventory', component: StoreInventory } ,
  { path: '/StockStatus', component: StockStatus } ,
  { path: '/StoreMovementMenu', component: StoreMovementMenu } ,
  { path: '/StockMove', component: StockMove } ,
  { path: '/StockMoveLog', component: StockMoveLog } ,
  { path: '/stock/move/:type', name: 'StockMoveForm', component: StockMoveForm, props: true },
  { path: '/orders', component: OrdersMenu },
  { path: '/orders/manage', component: OrderManage },
  { path: '/orders/history', component: OrderHistory },
  { path: '/orders/manage/ai', component: OrderAI },
  { path: '/orders/manage/manual', component: OrderManual },
  { path: '/orders/manage/external', component: ExternalOrder },
  { path: '/orders/manage/kitchen',  component: KitchenRequisition },
  { path: '/reports', component: Reports},
  { path: '/reports/stock',  component:Stock},
  { path: '/reports/orders', component:Orders  },
  { path: '/reports/sales',  component: Sales },  
  { path: '/Delivery', component: Delivery},
  { path: '/delivery/today',   component:Today },
  { path: '/delivery/historys', component:Historys },
  { path: '/delivery/routes',  component: Routes},

]   

export default createRouter({
  history: createWebHistory(),
  routes
})
