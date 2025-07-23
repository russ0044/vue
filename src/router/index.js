import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../view/LoginView.vue'
import RoleSelectView from '../view/RoleSelectView.vue'
import Employee from '../view/Employee.vue';
import Boss from '../view/Boss.vue';

const routes = [
  { path: '/', component: LoginView },
  { path: '/role', component: RoleSelectView },
  { path: '/employee',component: Employee },
  { path: '/boss',component: Boss }
]

export default createRouter({
  history: createWebHistory(),
  routes
})
