<template>
  <div class="order-page">
    <div v-if="loading" class="pad">
      <div class="skeleton-block" style="height: 80px" />
    </div>

    <div v-else-if="!order" class="pad">
      <el-empty description="订单不存在" :image-size="70">
        <el-button type="primary" @click="router.replace('/h5/menu')">回菜单</el-button>
      </el-empty>
    </div>

    <template v-else>
      <div class="pad">
        <div class="hero" :class="heroClass">
          <div class="ico">{{ heroIcon }}</div>
          <div class="title">{{ heroTitle }}</div>
          <div class="order-no">订单号 {{ order.orderNo }}</div>
          <div class="time">{{ formatDateTime(order.createdAt, 'MM-DD HH:mm') }} 下单</div>
        </div>

        <div class="card">
          <div class="section-title">状态</div>
          <el-timeline class="mini-timeline">
            <el-timeline-item
              v-for="(t, i) in order.timeline"
              :key="i"
              :timestamp="formatDateTime(t.time, 'MM-DD HH:mm')"
              :hollow="i !== order.timeline.length - 1"
              :type="t.status === 'DONE' ? 'success' : t.status === 'CANCELED' ? 'danger' : 'primary'"
            >
              {{ statusText(t.status) }}
            </el-timeline-item>
          </el-timeline>
        </div>

        <div class="card">
          <div class="section-title">菜品</div>
          <div v-for="(it, i) in order.items" :key="i" class="line">
            <span class="n">{{ it.dishName }}</span>
            <span class="q num">×{{ it.quantity }}</span>
            <span class="a num">¥{{ it.amount.toFixed(2) }}</span>
          </div>
          <div class="line total">
            <span>合计</span>
            <span class="num">¥{{ order.totalAmount.toFixed(2) }}</span>
          </div>
          <div v-if="order.remark" class="remark">备注：{{ order.remark }}</div>
        </div>
      </div>

      <div class="foot">
        <el-button size="large" @click="router.push('/h5/my')">我的订单</el-button>
        <el-button type="primary" size="large" @click="onAgain">再来一单</el-button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/api'
import { ORDER_STATUS } from '@/constants/enums'
import { formatDateTime } from '@/utils/format'
import { useCartStore } from '@/stores/cart'

const route = useRoute()
const router = useRouter()
const cart = useCartStore()

const loading = ref(false)
const order = ref(null)

const HERO = {
  PENDING: { icon: '⏳', title: '下单成功，等待商家接单', cls: 'pending' },
  ACCEPTED: { icon: '👨‍🍳', title: '商家已接单，正在备餐', cls: 'accepted' },
  DELIVERING: { icon: '🛵', title: '正在派送，请稍候', cls: 'delivering' },
  DONE: { icon: '✅', title: '订单已完成，欢迎下次光临', cls: 'done' },
  CANCELED: { icon: '❌', title: '订单已取消', cls: 'canceled' }
}

const heroIcon = computed(() => HERO[order.value?.status]?.icon || '📋')
const heroTitle = computed(() => HERO[order.value?.status]?.title || '订单详情')
const heroClass = computed(() => HERO[order.value?.status]?.cls || '')

const statusText = (s) => ORDER_STATUS[s]?.text || s

async function load() {
  const id = route.params.id
  if (!id) return
  loading.value = true
  try {
    order.value = await api.h5.order(id)
  } catch (e) {
    order.value = null
    ElMessage.error(e?.message || '订单加载失败')
  } finally {
    loading.value = false
  }
}

/** 再来一单：把明细按当前价格重新塞回购物车（口味信息保留） */
function onAgain() {
  if (!order.value) return
  order.value.items.forEach((it) => {
    const selection = {}
    ;(it.flavors || []).forEach((f) => {
      const idx = String(f).indexOf(':')
      if (idx > 0) selection[String(f).slice(0, idx)] = String(f).slice(idx + 1)
    })
    cart.add(
      { id: it.dishId, name: it.dishName, price: it.unitPrice, image: '' },
      Array.isArray(it.flavors) ? selection : {},
      it.quantity
    )
  })
  ElMessage.success('已加入购物车')
  router.push('/h5/cart')
}

watch(() => route.params.id, load, { immediate: true })
onMounted(load)
</script>

<style scoped>
.pad {
  padding: 12px 12px 96px;
}

.hero {
  background: #fff;
  border-radius: 10px;
  padding: 20px 12px;
  text-align: center;
  margin-bottom: 12px;
}

.ico {
  font-size: 34px;
}

.title {
  margin-top: 6px;
  font-size: 15px;
  font-weight: 600;
  color: #1f2d3d;
}

.order-no,
.time {
  margin-top: 4px;
  font-size: 12px;
  color: #9aa3b2;
}

.card {
  background: #fff;
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 12px;
}

.section-title {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
}

.mini-timeline {
  padding-left: 2px;
  font-size: 13px;
}

.line {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 7px 0;
  border-bottom: 1px solid #f5f7fa;
  font-size: 13px;
}

.n {
  flex: 1;
  min-width: 0;
  color: #1f2d3d;
}

.q {
  width: 40px;
  text-align: right;
  color: #6b7280;
}

.a {
  width: 74px;
  text-align: right;
  color: #1f2d3d;
}

.line.total {
  border: none;
  font-weight: 600;
  color: #c0392b;
}

.remark {
  margin-top: 8px;
  font-size: 12px;
  color: #9aa3b2;
}

.foot {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: 56px;
  width: 100%;
  max-width: 480px;
  display: flex;
  gap: 10px;
  padding: 8px 12px;
  background: #fff;
  border-top: 1px solid #eef1f6;
  box-shadow: 0 -4px 12px rgba(31, 45, 61, 0.06);
  z-index: 15;
}

.foot :deep(.el-button) {
  flex: 1;
}
</style>
