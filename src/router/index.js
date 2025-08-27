import { createRouter, createWebHistory } from 'vue-router'
import SettingView from '../view/SettingView.vue'
import LoginView from '../view/LoginView.vue'
import RoleSelectView from '../view/RoleSelectView.vue'
import Employee from '../view/Employee.vue'
import Boss from '../view/Boss.vue'
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



const routes = [
  { path: '/', component: LoginView },
  { path: '/setting', component: SettingView },
  { path: '/role', component: RoleSelectView },
  { path: '/employee', component: Employee },
  { path: '/boss', component: Boss },
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
]

export default createRouter({
  history: createWebHistory(),
  routes
})
