import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import { isProcessing } from '@/services/api'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue')
    },
    {
      path: '/chat',
      name: 'chat',
      component: () => import('@/views/ChatView.vue')
    },
    {
      path: '/image',
      name: 'image',
      component: () => import('@/views/ImageView.vue')
    },
    {
      path: '/tts',
      name: 'tts',
      component: () => import('@/views/TTSView.vue')
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

// 全局前置守卫：处理异步操作冲突
router.beforeEach((to, from, next) => {
  // 如果当前有正在处理的请求，提示用户确认是否要离开
  if (isProcessing.value) {
    if (window.confirm('当前有正在处理的任务，确定要离开吗？')) {
      next()
    } else {
      next(false)
    }
  } else {
    next()
  }
})

// 全局后置钩子：处理导航错误
router.afterEach((to, from, failure) => {
  if (failure) {
    console.error('路由导航失败:', failure)
  }
})

export default router