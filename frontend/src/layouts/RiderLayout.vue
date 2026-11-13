<template>
  <div class="rider-shell">
    <header class="rider-head">
      <div class="left">
        <span class="logo">🛵</span>
        <div>
          <div class="name">{{ user.name }}</div>
          <div class="sub">{{ rider.code || '骑手' }} · {{ rider.area || '—' }}</div>
        </div>
      </div>
      <div class="right">
        <el-switch
          :model-value="rider.online === 1"
          :loading="switching"
          inline-prompt
          active-text="接单中"
          inactive-text="休息"
          @change="onToggleOnline"
        />
        <el-button link class="logout" @click="onLogout">退出</el-button>
      </div>
    </header>

    <main class="rider-main">
      <router-view />
    </main>

    <nav class="rider-tabs">
      <router-link v-for="t in TABS" :key="t.path" :to="t.path" class="tab" :class="{ on: route.path === t.path }">
        <span class="ico">{{ t.icon }}</span>
        <span class="label">{{ t.label }}</span>
        <i v-if="t.path === '/rider/mine' && rider.onTheWay" class="badge">{{ rider.onTheWay }}</i>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useRiderStore } from '@/stores/rider'

const route = useRoute()
const router = useRouter()
const user = useUserStore()
const riderStore = useRiderStore()

const TABS = [
  { path: '/rider/workbench', label: '接单大厅', icon: '📋' },
  { path: '/rider/mine', label: '我的配送', icon: '🛵' }
]

const rider = computed(() => riderStore.profile || {})
const switching = ref(false)

async function onToggleOnline(next) {
  switching.value = true
  try {
    await riderStore.setOnline(next ? 1 : 0)
    ElMessage.success(next ? '已上线，开始接单' : '已置为休息')
  } catch (e) {
    ElMessage.error(e?.message || '操作失败')
  } finally {
    switching.value = false
  }
}

async function onLogout() {
  try {
    await ElMessageBox.confirm('确定退出登录吗？', '提示', { type: 'warning' })
  } catch {
    return
  }
  user.logout()
  router.replace('/login')
}

onMounted(() => {
  riderStore.load().catch(() => {})
})
</script>

<style scoped>
.rider-shell {
  max-width: 480px;
  margin: 0 auto;
  min-height: 100vh;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 24px rgba(31, 45, 61, 0.08);
}

.rider-head {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: linear-gradient(135deg, #14304f, #1a4d8f);
  color: #fff;
}

.left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo {
  font-size: 20px;
}

.name {
  font-size: 15px;
  font-weight: 600;
}

.sub {
  font-size: 11px;
  color: #b9c6d6;
}

.right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logout {
  color: #cfd9e6;
  font-size: 12px;
}

.rider-main {
  flex: 1;
  padding-bottom: 60px;
}

.rider-tabs {
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
  position: absolute;
  top: 2px;
  right: 50%;
  transform: translateX(18px);
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: #e8833a;
  color: #fff;
  font-size: 10px;
  font-style: normal;
  line-height: 16px;
  text-align: center;
}
</style>
