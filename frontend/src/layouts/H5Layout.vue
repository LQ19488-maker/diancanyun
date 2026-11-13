<template>
  <div class="h5-shell">
    <!-- 顶部：平台名 + 当前店铺 -->
    <header class="h5-head">
      <div class="brand">
        <span class="logo">🛵</span>
        <div>
          <div class="name">{{ APP_NAME }}</div>
          <div class="sub">外卖配送 · 骑手接单即送</div>
        </div>
      </div>
      <el-tag v-if="cart.shop" size="small" effect="plain" class="shop-tag" @click="router.push('/h5/shop')">
        {{ cart.shop.name }}
      </el-tag>
      <el-tag v-else size="small" effect="plain" class="shop-tag" @click="router.push('/h5/shop')">
        选店铺
      </el-tag>
    </header>

    <main class="h5-main">
      <router-view />
    </main>

    <!-- 底部导航 -->
    <nav class="h5-tabs">
      <router-link v-for="t in TABS" :key="t.path" :to="t.path" class="tab" :class="{ on: isActive(t) }">
        <span class="ico">{{ t.icon }}</span>
        <span class="label">
          {{ t.label }}
          <i v-if="t.path === '/h5/cart' && cart.totalCount" class="badge">{{ cart.totalCount }}</i>
        </span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { APP_NAME } from '@/constants/app'

const route = useRoute()
const router = useRouter()
const cart = useCartStore()

const TABS = [
  { path: '/h5/shop', label: '店铺', icon: '🏪' },
  { path: '/h5/cart', label: '购物车', icon: '🛒' },
  { path: '/h5/my', label: '我的', icon: '🙂' }
]

/** 菜单页也归到「店铺」这个 tab 下高亮 */
const SHOP_SUB = ['/h5/menu', '/h5/confirm', '/h5/order', '/h5/address']

function isActive(tab) {
  if (route.path.startsWith(tab.path)) return true
  return tab.path === '/h5/shop' && SHOP_SUB.some((p) => route.path.startsWith(p))
}
</script>

<style scoped>
.h5-shell {
  max-width: 480px;
  margin: 0 auto;
  min-height: 100vh;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 24px rgba(31, 45, 61, 0.08);
  position: relative;
}

.h5-head {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 14px;
  background: linear-gradient(135deg, #1f2d3d, #2f4b6b);
  color: #fff;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.logo {
  font-size: 22px;
}

.name {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 1px;
}

.sub {
  font-size: 11px;
  color: #b9c6d6;
}

.shop-tag {
  flex: none;
  max-width: 132px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.14);
  border-color: rgba(255, 255, 255, 0.3);
  color: #fff;
}

.h5-main {
  flex: 1;
  padding-bottom: 62px;
  min-height: 0;
}

.h5-tabs {
  position: sticky;
  bottom: 0;
  display: flex;
  background: #fff;
  border-top: 1px solid #eef1f6;
  z-index: 20;
}

.tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 7px 0 8px;
  color: #8c93a1;
  font-size: 11px;
  position: relative;
}

.tab.on {
  color: #1a4d8f;
  font-weight: 600;
}

.ico {
  font-size: 17px;
  line-height: 1;
}

.badge {
  display: inline-block;
  margin-left: 2px;
  min-width: 15px;
  height: 15px;
  padding: 0 4px;
  border-radius: 8px;
  background: #e8833a;
  color: #fff;
  font-size: 10px;
  font-style: normal;
  line-height: 15px;
  text-align: center;
  vertical-align: top;
}
</style>
