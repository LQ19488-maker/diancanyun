<template>
  <div class="order-page">
    <div v-if="loading" class="pad">
      <div class="skeleton-block" style="height: 80px" />
    </div>

    <div v-else-if="!order" class="pad">
      <el-empty description="订单不存在" :image-size="70">
        <el-button type="primary" @click="router.replace('/h5/shop')">回店铺</el-button>
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

        <!-- 骑手：接单后出现；派送中给电话，方便联系 -->
        <div v-if="order.riderName" class="card rider">
          <div class="avatar">🛵</div>
          <div class="r-info">
            <div class="r-name">{{ order.riderName }}</div>
            <div class="r-sub">{{ order.status === 'DELIVERING' ? '正在为您配送' : '负责本单配送' }}</div>
          </div>
          <a v-if="order.riderPhone" class="call" :href="`tel:${order.riderPhone}`">
            📞 {{ order.riderPhone }}
          </a>
        </div>
        <div v-else-if="order.status === 'PENDING'" class="card rider idle">
          <div class="avatar">⏳</div>
          <div class="r-info">
            <div class="r-name">等待骑手接单</div>
            <div class="r-sub">商家接单后会自动派给附近骑手</div>
          </div>
        </div>

        <!-- 收货信息 -->
        <div class="card">
          <div class="section-title">配送信息</div>
          <div class="info-row">
            <span class="k">收货人</span>
            <span class="v">{{ order.addressInfo.name }}　{{ order.addressInfo.phone }}</span>
          </div>
          <div class="info-row">
            <span class="k">地址</span>
            <span class="v">{{ order.addressInfo.detail }}</span>
          </div>
          <div v-if="order.shopName" class="info-row">
            <span class="k">店铺</span>
            <span class="v">{{ order.shopName }}</span>
          </div>
        </div>

        <div class="card">
          <div class="section-title">配送进度</div>
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
          <div class="line sub">
            <span>菜品小计</span>
            <span class="num">¥{{ order.amount.toFixed(2) }}</span>
          </div>
          <div class="line sub">
            <span>配送费</span>
            <span class="num">¥{{ order.deliveryFee.toFixed(2) }}</span>
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
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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
  DELIVERING: { icon: '🛵', title: '骑手正在配送，请保持手机畅通', cls: 'delivering' },
  DONE: { icon: '✅', title: '已送达，欢迎下次光临', cls: 'done' },
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

/**
 * 订单还在流转中时每 15 秒静默拉一次，
 * 商家接单 / 骑手抢单后顾客不用手动刷新就能看到进度变化。
 */
const POLL_MS = 15000
let timer = null

function stopPoll() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function startPoll() {
  stopPoll()
  timer = setInterval(async () => {
    if (!order.value || ['DONE', 'CANCELED'].includes(order.value.status)) {
      stopPoll()
      return
    }
    try {
      order.value = await api.h5.order(route.params.id)
    } catch {
      /* 轮询失败不打扰用户，下一次再试 */
    }
  }, POLL_MS)
}

onMounted(startPoll)
onBeforeUnmount(stopPoll)
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

.rider {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #eef4fc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex: none;
}

.r-info {
  flex: 1;
  min-width: 0;
}

.r-name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2d3d;
}

.r-sub {
  margin-top: 2px;
  font-size: 11px;
  color: #9aa3b2;
}

.call {
  font-size: 12px;
  color: #1a4d8f;
  text-decoration: none;
  border: 1px solid #dbe6f5;
  border-radius: 14px;
  padding: 4px 10px;
  white-space: nowrap;
}

.section-title {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
}

.info-row {
  display: flex;
  gap: 10px;
  padding: 4px 0;
  font-size: 13px;
}

.info-row .k {
  flex: none;
  width: 48px;
  color: #9aa3b2;
}

.info-row .v {
  flex: 1;
  min-width: 0;
  color: #1f2d3d;
  line-height: 1.5;
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

.line.sub {
  border: none;
  padding: 3px 0;
  color: #6b7280;
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
