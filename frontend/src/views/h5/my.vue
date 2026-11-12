<template>
  <div class="my-page">
    <div class="pad">
      <div class="section-title">我的订单</div>

      <div v-if="loading">
        <div v-for="i in 3" :key="i" class="skeleton-block" style="height: 70px; margin-bottom: 10px" />
      </div>

      <el-empty v-else-if="!list.length" description="还没有下过单" :image-size="70">
        <el-button type="primary" @click="router.push('/h5/menu')">去点餐</el-button>
      </el-empty>

      <div v-else>
        <div v-for="o in list" :key="o.id" class="order-card" @click="router.push(`/h5/order/${o.id}`)">
          <div class="top">
            <span class="no">#{{ o.orderNo.slice(-6) }}</span>
            <el-tag size="small" :type="ORDER_STATUS[o.status]?.type || 'info'" effect="light">
              {{ ORDER_STATUS[o.status]?.text || o.status }}
            </el-tag>
          </div>
          <div class="items">{{ api.summary ? summary(o) : '' }}</div>
          <div class="bottom">
            <span class="time">{{ formatDateTime(o.createdAt, 'MM-DD HH:mm') }}　{{ o.tableNo }}</span>
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
import { ElMessage } from 'element-plus'
import api from '@/api'
import { ORDER_STATUS } from '@/constants/enums'
import { formatDateTime } from '@/utils/format'

const router = useRouter()
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

onMounted(load)
</script>

<style scoped>
.pad {
  padding: 12px 12px 80px;
}

.section-title {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 10px;
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
}

.no {
  font-size: 13px;
  font-weight: 600;
  color: #1f2d3d;
  letter-spacing: 0.5px;
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

.amount {
  font-size: 15px;
  font-weight: 600;
  color: #c0392b;
}
</style>
