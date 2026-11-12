<template>
  <el-container class="admin-layout">
    <!-- 侧栏 -->
    <el-aside :width="app.sidebarCollapsed ? '64px' : '208px'" class="aside">
      <div class="brand">
        <span class="logo">🍜</span>
        <span v-if="!app.sidebarCollapsed" class="brand-text">{{ APP_NAME }}</span>
      </div>

      <el-menu
        :default-active="activeMenu"
        :collapse="app.sidebarCollapsed"
        :collapse-transition="false"
        background-color="#1f2d3d"
        text-color="#c8d1de"
        active-text-color="#ffffff"
        router
      >
        <el-menu-item v-for="item in menus" :key="item.path" :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <template #title>{{ item.title }}</template>
        </el-menu-item>
      </el-menu>

      <div class="aside-footer" v-if="!app.sidebarCollapsed">
        <div class="demo-flag" v-if="isMock">演示数据</div>
        <div class="author">前端：{{ AUTHOR }} · {{ APP_VERSION }}</div>
        <a class="gh" :href="GITHUB_URL" target="_blank" rel="noreferrer">GitHub</a>
      </div>
    </el-aside>

    <el-container>
      <!-- 顶栏 -->
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="app.toggleSidebar()">
            <Expand v-if="app.sidebarCollapsed" />
            <Fold v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentTitle">{{ currentTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <el-tooltip content="刷新当前页" placement="bottom">
            <el-icon class="act" @click="reload"><Refresh /></el-icon>
          </el-tooltip>
          <el-dropdown trigger="click" @command="onCommand">
            <span class="user">
              <el-avatar :size="26">{{ (user.name || 'U').slice(0, 1) }}</el-avatar>
              <span class="uname">{{ user.name }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item disabled>角色：{{ user.isAdmin ? '管理员' : '员工' }}</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 内容区 -->
      <el-main class="main">
        <router-view v-slot="{ Component }">
          <component :is="Component" :key="routeKey" />
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import {
  ArrowDown, Box, Dish, Expand, Files, Fold, List, Odometer, Refresh, User
} from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'
import { adminRoutes } from '@/router'
import { IS_MOCK } from '@/api'
import { APP_NAME, APP_VERSION, AUTHOR, GITHUB_URL } from '@/constants/app'

const app = useAppStore()
const user = useUserStore()
const route = useRoute()
const router = useRouter()

/** 菜单图标映射：路由里只写名字，这里是唯一的组件来源 */
const ICONS = { Odometer, User, Files, Dish, Box, List }

const isMock = IS_MOCK
const routeKey = ref(0)

/** 菜单：从路由表推导，按角色过滤，永远和路由保持一致 */
const menus = computed(() =>
  adminRoutes
    .filter((r) => r.meta?.menu)
    .filter((r) => !r.meta.roles || r.meta.roles.length === 0 || r.meta.roles.includes(user.role))
    .map((r) => ({ path: `/${r.path}`, title: r.meta.title, icon: ICONS[r.meta.icon] || Odometer }))
)

const activeMenu = computed(() => route.path)
const currentTitle = computed(() => route.meta?.title || '')

function reload() {
  routeKey.value += 1
}

async function onCommand(cmd) {
  if (cmd !== 'logout') return
  try {
    await ElMessageBox.confirm('确定退出登录吗？', '提示', { type: 'warning' })
  } catch {
    return
  }
  user.logout()
  router.replace('/login')
}
</script>

<style scoped>
.admin-layout {
  height: 100%;
}

.aside {
  background: #1f2d3d;
  display: flex;
  flex-direction: column;
  transition: width 0.2s;
  overflow: hidden;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 56px;
  padding: 0 16px;
  color: #fff;
  font-weight: 600;
  letter-spacing: 1px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.logo {
  font-size: 20px;
}

.aside :deep(.el-menu) {
  border-right: none;
  flex: 1;
}

.aside-footer {
  padding: 10px 16px 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.author {
  font-size: 12px;
  color: #7d8a9a;
}

.gh {
  font-size: 12px;
  color: #7d8a9a;
}

.header {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #e8ecf2;
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.collapse-btn,
.act {
  font-size: 18px;
  cursor: pointer;
  color: #4b5563;
}

.user {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  outline: none;
}

.uname {
  font-size: 13px;
  color: #374151;
}

.main {
  padding: 0;
  overflow: auto;
  background: #f5f7fa;
}
</style>
