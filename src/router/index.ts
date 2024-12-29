import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('../views/index.vue')
  }
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})