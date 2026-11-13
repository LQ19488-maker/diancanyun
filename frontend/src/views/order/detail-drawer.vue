<template>
  <el-drawer
    :model-value="modelValue"
    title="订单详情"
    size="560px"
    :with-header="true"
    @update:model-value="(v) => $emit('update:modelValue', v)"
  >
    <div v-loading="loading" class="detail">
      <template v-if="order">
        <div class="head">
          <div>
            <div class="order-no">{{ order.orderNo }}</div>
            <div class="text-muted">{{ formatDateTime(order.createdAt) }}　下单</div>
          </div>
          <div class="tags">
            <el-tag :type="payMeta.type" size="small" effect="light">{{ payMeta.text }}</el-tag>
            <el-tag :type="statusMeta.type" size="small" effect="dark">{{ statusMeta.text }}</el-tag>
          </div>
        </div>

        <el-divider content-position="left">状态流转</el-divider>
        <el-timeline class="timeline">
          <el-timeline-item
            v-for="(t, i) in order.timeline"
            :key="i"
            :timestamp="formatDateTime(t.time, 'MM-DD HH:mm')"
            :type="timelineType(t.status)"
            :hollow="i !== order.timeline.length - 1"
          >
            {{ statusText(t.status) }}
          </el-timeline-item>
          <el-timeline-item v-if="!order.timeline.length" timestamp="—">暂无流转记录</el-timeline-item>
        </el-timeline>

        <el-divider content-position="left">顾客与配送</el-divider>
        <el-descriptions :column="1" size="small" border>
          <el-descriptions-item label="顾客">{{ order.userName }}　{{ order.phone }}</el-descriptions-item>
          <el-descriptions-item label="桌号/方式">{{ order.tableNo || '—' }}</el-descriptions-item>
          <el-descriptions-item v-if="order.address" label="收货地址">{{ order.address }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ order.remark || '—' }}</el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">菜品明细</el-divider>
        <el-table :data="order.items" size="small" border>
          <el-table-column prop="dishName" label="菜品" min-width="110" show-overflow-tooltip />
          <el-table-column label="口味" min-width="110">
            <template #default="{ row }">
              <span v-if="!row.flavors.length" class="text-muted">—</span>
              <span v-else class="text-muted">{{ row.flavors.join('；') }}</span>
            </template>
          </el-table-column>
          <el-table-column label="单价" width="82" align="right">
            <template #default="{ row }"><span class="num">{{ formatPrice(row.unitPrice) }}</span></template>
          </el-table-column>
          <el-table-column label="数量" width="60" align="center">
            <template #default="{ row }"><span class="num">×{{ row.quantity }}</span></template>
          </el-table-column>
          <el-table-column label="小计" width="88" align="right">
            <template #default="{ row }"><span class="num">{{ formatPrice(row.amount) }}</span></template>
          </el-table-column>
        </el-table>

        <div class="amounts">
          <div class="line"><span>菜品小计</span><span class="num">{{ formatPrice(order.amount) }}</span></div>
          <div class="line"><span>打包费</span><span class="num">{{ formatPrice(order.packFee) }}</span></div>
          <div class="line total"><span>合计</span><span class="num">{{ formatPrice(order.totalAmount) }}</span></div>
        </div>

        <div class="actions">
          <el-button
            v-for="next in nextStatuses"
            :key="next"
            :type="next === 'CANCELED' ? 'danger' : 'primary'"
            :plain="next === 'CANCELED'"
            :loading="acting === next"
            @click="onAction(next)"
          >
            {{ ACTION_LABEL[next] }}
          </el-button>
          <span v-if="!nextStatuses.length" class="text-muted">该状态下没有可执行的流转</span>
        </div>
      </template>
    </div>
  </el-drawer>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/api'
import { ORDER_STATUS, ORDER_ACTION_LABEL, PAY_STATUS, MERCHANT_ACTIONS, statusOf } from '@/constants/enums'
import { formatDateTime, formatPrice } from '@/utils/format'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  orderId: { type: [String, Number], default: '' }
})
const emit = defineEmits(['update:modelValue', 'changed'])

const ACTION_LABEL = ORDER_ACTION_LABEL
const loading = ref(false)
const acting = ref('')
const order = ref(null)

const statusMeta = computed(() => statusOf(ORDER_STATUS, order.value?.status))
const payMeta = computed(() => statusOf(PAY_STATUS, order.value?.payStatus))

/** 可执行的下一步：由状态机推导，并限制为商家能做的动作（配送归骑手端） */
const nextStatuses = computed(() =>
  (ORDER_STATUS[order.value?.status]?.next || []).filter((s) => MERCHANT_ACTIONS.includes(s))
)

function statusText(s) {
  return ORDER_STATUS[s]?.text || s
}

function timelineType(s) {
  if (s === 'DONE') return 'success'
  if (s === 'CANCELED') return 'danger'
  if (s === 'PENDING') return 'warning'
  return 'primary'
}

async function load() {
  if (!props.orderId) return
  loading.value = true
  order.value = null
  try {
    order.value = await api.order.detail(props.orderId)
  } catch (e) {
    ElMessage.error(e?.message || '订单详情加载失败')
  } finally {
    loading.value = false
  }
}

async function onAction(next) {
  const label = ACTION_LABEL[next] || '操作'
  try {
    await ElMessageBox.confirm(`确定对订单 ${order.value.orderNo} 执行「${label}」吗？`, '状态流转', {
      type: 'warning',
      confirmButtonText: label,
      cancelButtonText: '取消'
    })
  } catch {
    return
  }
  acting.value = next
  try {
    order.value = await api.order.changeStatus(order.value.id, next)
    ElMessage.success(`已${label}`)
    emit('changed')
  } catch (e) {
    ElMessage.error(e?.message || '操作失败')
  } finally {
    acting.value = ''
  }
}

// 打开抽屉时拉详情
defineExpose({ load })
watch(
  () => [props.modelValue, props.orderId],
  ([vis]) => {
    if (vis) load()
  },
  { immediate: true }
)
</script>

<style scoped>
.detail {
  min-height: 200px;
}

.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.order-no {
  font-size: 16px;
  font-weight: 600;
  color: #1f2d3d;
  letter-spacing: 0.5px;
}

.tags {
  display: flex;
  gap: 6px;
}

.timeline {
  padding-left: 4px;
}

.amounts {
  margin-top: 12px;
  padding: 10px 12px;
  background: #fafbfd;
  border: 1px solid #eef1f6;
  border-radius: 8px;
}

.line {
  display: flex;
  justify-content: space-between;
  padding: 2px 0;
  font-size: 13px;
  color: #4b5563;
}

.line.total {
  margin-top: 4px;
  padding-top: 6px;
  border-top: 1px dashed #e3e8f0;
  font-size: 15px;
  font-weight: 600;
  color: #c0392b;
}

.actions {
  margin-top: 16px;
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
</style>
