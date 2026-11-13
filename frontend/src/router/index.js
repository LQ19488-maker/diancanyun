import { createRouter, createWebHashHistory } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { setUnauthorizedHandler } from '@/api/http'
import { ROLE } from '@/constants/enums'

/**
 * 路由约定
 *  - hash 模式：GitHub Pages 是纯静态托管，没有 URL 重写，history 模式刷新即 404
 *  - meta.menu=true 的才会出现在左侧菜单
 *  - meta.roles 为空表示所有登录用户可见
 *  - 三类使用者：商家（/dashboard 起，PC 后台）、骑手（/rider 起，手机尺寸）、顾客（/h5 起，手机尺寸）
 */
export const merchantRoutes = [
  {
    path: 'dashboard',
    name: 'dashboard',
    component: () => import('@/views/dashboard/index.vue'),
    meta: { title: '工作台', icon: 'Odometer', menu: true, roles: [ROLE.MERCHANT] }
  },
  {
    path: 'order',
    name: 'order',
    component: () => import('@/views/order/index.vue'),
    meta: { title: '订单管理', icon: 'List', menu: true, roles: [ROLE.MERCHANT] }
  },
  {
    path: 'category',
    name: 'category',
    component: () => import('@/views/category/index.vue'),
    meta: { title: '分类管理', icon: 'Files', menu: true, roles: [ROLE.MERCHANT] }
  },
  {
    path: 'dish',
    name: 'dish',
    component: () => import('@/views/dish/index.vue'),
    meta: { title: '菜品管理', icon: 'Dish', menu: true, roles: [ROLE.MERCHANT] }
  },
  {
    path: 'combo',
    name: 'combo',
    component: () => import('@/views/combo/index.vue'),
    meta: { title: '套餐管理', icon: 'Box', menu: true, roles: [ROLE.MERCHANT] }
  },
  {
    path: 'riders',
    name: 'riders',
    component: () => import('@/views/riders/index.vue'),
    meta: { title: '骑手管理', icon: 'Van', menu: true, roles: [ROLE.MERCHANT] }
  }
]

/** 骑手端（手机尺寸） */
export const riderRoutes = [
  {
    path: 'workbench',
    name: 'rider-workbench',
    component: () => import('@/views/rider/workbench.vue'),
    meta: { title: '接单大厅', menu: true, roles: [ROLE.RIDER] }
  },
  {
    path: 'mine',
    name: 'rider-mine',
    component: () => import('@/views/rider/mine.vue'),
    meta: { title: '我的配送', menu: true, roles: [ROLE.RIDER] }
  },
  {
    path: 'wallet',
    name: 'rider-wallet',
    component: () => import('@/views/rider/wallet.vue'),
    meta: { title: '我的', menu: true, roles: [ROLE.RIDER] }
  }
]

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', public: true }
  },

  /* ---------------- 商家端（PC 后台）---------------- */
  {
    path: '/',
    component: () => import('@/layouts/AdminLayout.vue'),
    redirect: '/dashboard',
    children: merchantRoutes
  },

  /* ---------------- 骑手端（手机尺寸）---------------- */
  {
    path: '/rider',
    component: () => import('@/layouts/RiderLayout.vue'),
    redirect: '/rider/workbench',
    children: riderRoutes
  },

  /* ---------------- 顾客端（外卖 H5）---------------- */
  {
    path: '/h5',
    component: () => import('@/layouts/H5Layout.vue'),
    redirect: '/h5/shop',
    meta: { public: true },
    children: [
      { path: 'shop', name: 'h5-shop', component: () => import('@/views/h5/shop.vue'), meta: { title: '选店铺', public: true } },
      { path: 'menu', name: 'h5-menu', component: () => import('@/views/h5/menu.vue'), meta: { title: '点餐', public: true } },
      { path: 'address', name: 'h5-address', component: () => import('@/views/h5/address.vue'), meta: { title: '收货地址', public: true } },
      { path: 'coupons', name: 'h5-coupons', component: () => import('@/views/h5/coupons.vue'), meta: { title: '优惠券', public: true } },
      { path: 'cart', name: 'h5-cart', component: () => import('@/views/h5/cart.vue'), meta: { title: '购物车', public: true } },
      { path: 'confirm', name: 'h5-confirm', component: () => import('@/views/h5/confirm.vue'), meta: { title: '确认订单', public: true } },
      { path: 'order/:id', name: 'h5-order', component: () => import('@/views/h5/order.vue'), meta: { title: '订单详情', public: true } },
      { path: 'my', name: 'h5-my', component: () => import('@/views/h5/my.vue'), meta: { title: '我的', public: true } }
    ]
  },

  { path: '/:pathMatch(.*)*', redirect: '/login' }
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
    // 已登录再访问登录页 → 回到各自首页（商家后台 / 骑手工作台 / 顾客点餐）
    if (to.name === 'login' && user.isLogin) return { path: user.homePath }
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
    return { path: user.homePath }
  }

  document.title = to.meta.title ? `${to.meta.title} · 点单云` : '点单云'
  return true
})

export default router
