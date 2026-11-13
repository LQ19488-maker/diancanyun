<template>
  <div class="my-page">
    <div class="pad">
      <!-- 个人入口 -->
      <div class="me-card">
        <div class="avatar">🙂</div>
        <div class="me-info">
          <div class="me-name">{{ user.profile?.name || '顾客' }}</div>
          <div class="me-sub">
            {{ user.profile ? user.profile.username + ' · 顾客端' : '未登录 · 演示环境可直接点单' }}
          </div>
        </div>
      </div>

      <div class="menu-card">
        <div class="menu-item" @click="router.push('/h5/address')">
          <span class="mi-ico">📍</span>
          <span class="mi-text">收货地址</span>
          <span class="mi-arrow">›</span>
        </div>
        <div class="menu-item" @click="router.push('/h5/shop')">
          <span class="mi-ico">🏪</span>
          <span class="mi-text">去点外卖</span>
          <span class="mi-arrow">›</span>
        </div>
        <div class="menu-item" @click="onLogout">
          <span class="mi-ico">🚪</span>
          <span class="mi-text">退出登录</span>
          <span class="mi-arrow">›</span>
        </div>
      </div>

      <div class="section-title">我的订单</div>

      <div v-if="loading">
        <div v-for="i in 3" :key="i" class="skeleton-block" style="height: 70px; margin-bottom: 10px" />
      </div>

      <el-empty v-else-if="!list.length" description="还没有下过单" :image-size="70">
        <el-button type="primary" @click="router.push('/h5/shop')">去点餐</el-button>
      </el-empty>

      <div v-else>
        <div v-for="o in list" :key="o.id" class="order-card" @click="router.push(`/h5/order/${o.id}`)">
          <div class="top">
            <span class="shop">{{ o.shopName || '点单云' }}</span>
            <el-tag size="small" :type="ORDER_STATUS[o.status]?.type || 'info'" effect="light">
              {{ ORDER_STATUS[o.status]?.text || o.status }}
            </el-tag>
          </div>
          <div class="items">{{ summary(o) }}</div>
          <div class="bottom">
            <span class="time">
              {{ formatDateTime(o.createdAt, 'MM-DD HH:mm') }}
              <i v-if="o.riderName" class="rider">· 骑手 {{ o.riderName }}</i>
            </span>
            <span class="amount num">¥{{ o.totalAmount.toFixed(2) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/api'
import { ORDER_STATUS } from '@/constants/enums'
import { formatDateTime } from '@/utils/format'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const user = useUserStore()
const loading = ref(false)
const list = ref([])

const summary = (o) => (o.items || []).map((i) => `${i.dishName}×${i.quantity}`).join('、')

async function load() {
  loading.value = true
  try {
    const res = await api.h5.myOrders({ page: 1, pageSize: 20 })
    list.value = res.list
  } catch (e) {
    ElMessage.error(e?.message || '订单加载失败')
  } finally {
    loading.value = false
  }
}

async function onLogout() {
  try {
    await ElMessageBox.confirm('确定退出登录吗？', '提示', { type: 'warning' })
  } catch {
    return
  }
  user.logout()
  ElMessage.success('已退出登录')
  router.replace('/login')
}

onMounted(load)
</script>

<style scoped>
.pad {
  padding: 12px 12px 80px;
}

.me-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  border-radius: 10px;
  padding: 14px 12px;
}

.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #eef4fc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}

.me-name {
  font-size: 15px;
  font-weight: 600;
  color: #1f2d3d;
}

.me-sub {
  margin-top: 2px;
  font-size: 11px;
  color: #9aa3b2;
}

.menu-card {
  background: #fff;
  border-radius: 10px;
  margin-top: 10px;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  font-size: 13px;
  color: #1f2d3d;
  cursor: pointer;
  border-bottom: 1px solid #f5f7fa;
}

.menu-item:last-child {
  border-bottom: none;
}

.mi-ico {
  font-size: 15px;
}

.mi-text {
  flex: 1;
}

.mi-arrow {
  color: #c4cad6;
  font-size: 16px;
}

.section-title {
  font-size: 13px;
  color: #6b7280;
  margin: 16px 0 10px;
}

.order-card {
  background: #fff;
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 10px;
  cursor: pointer;
}

.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.shop {
  font-size: 13px;
  font-weight: 600;
  color: #1f2d3d;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.items {
  margin-top: 6px;
  font-size: 12px;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
}

.time {
  font-size: 11px;
  color: #9aa3b2;
}

.rider {
  font-style: normal;
  color: #1a4d8f;
}

.amount {
  font-size: 15px;
  font-weight: 600;
  color: #c0392b;
}
</style>
