<template>
  <div class="coupon-page">
    <div class="tabs">
      <span class="tab" :class="{ on: tab === 'center' }" @click="tab = 'center'">领券中心</span>
      <span class="tab" :class="{ on: tab === 'mine' }" @click="tab = 'mine'">我的券</span>
    </div>

    <div class="pad">
      <div v-if="loading">
        <div v-for="i in 3" :key="i" class="skeleton-block" style="height: 72px; margin-bottom: 10px" />
      </div>

      <!-- 领券中心 -->
      <template v-else-if="tab === 'center'">
        <el-empty v-if="!templates.length" description="暂时没有可领的券" :image-size="70" />
        <div v-for="c in templates" :key="c.id" class="coupon">
          <div class="left">
            <div class="amount"><i>¥</i>{{ c.amount }}</div>
            <div class="cond">{{ c.threshold > 0 ? `满 ${c.threshold} 可用` : '无门槛' }}</div>
          </div>
          <div class="mid">
            <div class="title">{{ c.title }}</div>
            <div class="desc">{{ c.desc }}</div>
            <div class="left-count">剩余 {{ c.left }} 张</div>
          </div>
          <el-button
            type="primary"
            size="small"
            :disabled="c.claimed"
            :loading="claimingId === c.id"
            @click="onClaim(c)"
          >
            {{ c.claimed ? '已领取' : '领取' }}
          </el-button>
        </div>
      </template>

      <!-- 我的券 -->
      <template v-else>
        <div class="filter">
          <span
            v-for="f in FILTERS"
            :key="f.value"
            class="chip"
            :class="{ on: status === f.value }"
            @click="status = f.value"
          >
            {{ f.label }}
          </span>
        </div>

        <el-empty v-if="!mine.length" description="这个分类下还没有券" :image-size="70" />
        <div v-for="c in mine" :key="c.id" class="coupon" :class="{ disabled: c.status !== 'UNUSED' }">
          <div class="left">
            <div class="amount"><i>¥</i>{{ c.amount }}</div>
            <div class="cond">{{ c.threshold > 0 ? `满 ${c.threshold} 可用` : '无门槛' }}</div>
          </div>
          <div class="mid">
            <div class="title">{{ c.title }}</div>
            <div class="desc">{{ c.shopId ? '限指定店铺使用' : '全场通用' }}</div>
            <div class="left-count">{{ expireText(c) }}</div>
          </div>
          <el-tag size="small" :type="statusType(c.status)" effect="plain">
            {{ statusText(c.status) }}
          </el-tag>
        </div>
      </template>

      <div class="hint">下单时在「确认订单」页选择优惠券即可抵扣，配送费不参与抵扣</div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/api'
import { formatDateTime } from '@/utils/format'

const FILTERS = [
  { label: '可用', value: 'UNUSED' },
  { label: '已使用', value: 'USED' },
  { label: '已过期', value: 'EXPIRED' }
]

const tab = ref('center')
const status = ref('UNUSED')
const loading = ref(false)
const claimingId = ref('')
const templates = ref([])
const mine = ref([])

const statusText = (s) => ({ UNUSED: '可使用', USED: '已使用', EXPIRED: '已过期' })[s] || s
const statusType = (s) => ({ UNUSED: 'success', USED: 'info', EXPIRED: 'warning' })[s] || 'info'

function expireText(c) {
  if (c.status === 'USED') return `已于 ${formatDateTime(c.usedAt, 'MM-DD HH:mm')} 使用`
  if (c.status === 'EXPIRED') return '已过期'
  return `有效期至 ${formatDateTime(c.expireAt, 'YYYY-MM-DD')}`
}

async function loadTemplates() {
  const res = await api.coupon.templates()
  templates.value = res.list
}

async function loadMine() {
  const res = await api.coupon.mine({ status: status.value })
  mine.value = res.list
}

async function load() {
  loading.value = true
  try {
    await Promise.all([loadTemplates(), loadMine()])
  } catch (e) {
    ElMessage.error(e?.message || '优惠券加载失败')
  } finally {
    loading.value = false
  }
}

async function onClaim(c) {
  claimingId.value = c.id
  try {
    await api.coupon.claim(c.id)
    ElMessage.success('领取成功，去「我的券」看看')
    await load()
  } catch (e) {
    ElMessage.error(e?.message || '领取失败')
  } finally {
    claimingId.value = ''
  }
}

onMounted(load)

// 切换我的券分类时只重查这一段
watch(status, loadMine)
</script>

<style scoped>
.tabs {
  display: flex;
  background: #fff;
  border-bottom: 1px solid #eef1f6;
}

.tab {
  flex: 1;
  text-align: center;
  padding: 11px 0;
  font-size: 14px;
  color: #6b7280;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.tab.on {
  color: #1a4d8f;
  font-weight: 600;
  border-bottom-color: #1a4d8f;
}

.pad {
  padding: 12px 12px 76px;
}

.filter {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.chip {
  padding: 4px 12px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid #dde3ec;
  font-size: 12px;
  color: #4b5563;
  cursor: pointer;
}

.chip.on {
  border-color: #1a4d8f;
  background: #eef4fc;
  color: #1a4d8f;
  font-weight: 600;
}

.coupon {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 10px;
}

.coupon.disabled {
  opacity: 0.62;
}

.left {
  width: 78px;
  flex: none;
  text-align: center;
  border-right: 1px dashed #e5e9f0;
  padding-right: 8px;
}

.amount {
  font-size: 22px;
  font-weight: 700;
  color: #c0392b;
  font-variant-numeric: tabular-nums;
}

.amount i {
  font-size: 12px;
  font-style: normal;
  margin-right: 1px;
}

.cond {
  margin-top: 2px;
  font-size: 10px;
  color: #9aa3b2;
}

.mid {
  flex: 1;
  min-width: 0;
}

.title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2d3d;
}

.desc {
  margin-top: 3px;
  font-size: 11px;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.left-count {
  margin-top: 3px;
  font-size: 10px;
  color: #9aa3b2;
}

.hint {
  margin-top: 14px;
  font-size: 11px;
  color: #9aa3b2;
  line-height: 1.6;
  text-align: center;
}
</style>
