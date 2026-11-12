import { createRouter, createWebHashHistory } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { setUnauthorizedHandler } from '@/api/http'

/**
 * 路由约定
 *  - hash 模式：GitHub Pages 是纯静态托管，没有 URL 重写，history 模式刷新即 404
 *  - meta.menu=true 的才会出现在左侧菜单
 *  - meta.roles 为空表示所有登录用户可见
 */
export const adminRoutes = [
  {
    path: 'dashboard',
    name: 'dashboard',
    component: () => import('@/views/dashboard/index.vue'),
    meta: { title: '工作台', icon: 'Odometer', menu: true }
  },
  {
    path: 'employee',
    name: 'employee',
    component: () => import('@/views/employee/index.vue'),
    meta: { title: '员工管理', icon: 'User', menu: true, roles: ['ADMIN'] }
  },
  {
    path: 'category',
    name: 'category',
    component: () => import('@/views/ComingSoon.vue'),
    props: { title: '分类管理' },
    meta: { title: '分类管理', icon: 'Files', menu: true, roles: ['ADMIN'] }
  },
  {
    path: 'dish',
    name: 'dish',
    component: () => import('@/views/ComingSoon.vue'),
    props: { title: '菜品管理' },
    meta: { title: '菜品管理', icon: 'Dish', menu: true, roles: ['ADMIN', 'STAFF'] }
  },
  {
    path: 'combo',
    name: 'combo',
    component: () => import('@/views/ComingSoon.vue'),
    props: { title: '套餐管理' },
    meta: { title: '套餐管理', icon: 'Box', menu: true, roles: ['ADMIN'] }
  },
  {
    path: 'order',
    name: 'order',
    component: () => import('@/views/ComingSoon.vue'),
    props: { title: '订单管理' },
    meta: { title: '订单管理', icon: 'List', menu: true, roles: ['ADMIN', 'STAFF'] }
  }
]

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', public: true }
  },
  {
    path: '/',
    component: () => import('@/layouts/AdminLayout.vue'),
    redirect: '/dashboard',
    children: adminRoutes
  },
  {
    path: '/h5/menu',
    name: 'h5-menu',
    component: () => import('@/views/ComingSoon.vue'),
    props: { title: '用户端点餐（H5）' },
    meta: { title: '用户端点餐', public: true }
  },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' }
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes
})

/* 401 / token 过期：清会话并回登录页，带上回跳地址 */
setUnauthorizedHandler(() => {
  const user = useUserStore()
  user.logout()
  const current = router.currentRoute.value
  if (current.name !== 'login') {
    router.replace({ path: '/login', query: { redirect: current.fullPath } })
  }
})

router.beforeEach(async (to) => {
  const user = useUserStore()

  if (to.meta.public) {
    if (to.name === 'login' && user.isLogin) return { path: '/dashboard' }
    document.title = to.meta.title ? `${to.meta.title} · 点单云` : '点单云'
    return true
  }

  if (!user.isLogin) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  // 刷新后只有 token、没有资料时补拉一次，避免权限判断落空
  if (!user.profile) {
    try {
      await user.fetchProfile()
    } catch {
      user.logout()
      return { path: '/login', query: { redirect: to.fullPath } }
    }
  }

  const roles = to.meta.roles
  if (Array.isArray(roles) && roles.length && !roles.includes(user.role)) {
    ElMessage.warning('当前账号无权访问该页面')
    return { path: '/dashboard' }
  }

  document.title = to.meta.title ? `${to.meta.title} · 点单云` : '点单云'
  return true
})

export default router
