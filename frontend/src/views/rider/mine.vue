<template>
  <div class="mine">
    <div class="tabs">
      <span
        v-for="t in TABS"
        :key="t.value"
        class="tab"
        :class="{ on: status === t.value }"
        @click="switchTab(t.value)"
      >
        {{ t.label }}
      </span>
    </div>

    <div v-if="loading" class="pad">
      <div v-for="i in 3" :key="i" class="skeleton-block" style="height: 96px; margin-bottom: 10px" />
    </div>

    <el-empty v-else-if="!list.length" :description="emptyText" :image-size="70" />

    <div v-else class="pad">
      <div v-for="o in list" :key="o.id" class="task">
        <div class="task-head">
          <span class="no">#{{ o.orderNo.slice(-6) }}</span>
          <el-tag size="small" :type="ORDER_STATUS[o.status]?.type || 'info'" effect="light">
            {{ ORDER_STATUS[o.status]?.text || o.status }}
          </el-tag>
        </div>
        <div class="addr">📍 {{ o.address || '—' }}</div>
        <div class="customer">
          {{ o.userName }}　{{ maskPhone(o.phone) }}
        </div>
        <div class="items">{{ summary(o) }}</div>
        <div class="task-foot">
          <span class="text-muted">{{ formatDateTime(o.createdAt, 'MM-DD HH:mm') }}</span>
          <div class="actions">
            <el-button v-if="o.status === 'DELIVERING'" size="small" plain @click="onCall(o)">
              联系顾客
            </el-button>
            <el-button
              v-if="o.status === 'DELIVERING'"
              type="primary"
              size="small"
              :loading="finishingId === o.id"
              @click="onFinish(o)"
            >
              确认送达
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { request } from '@/api/http'
import { riderUrl } from '@/api/urls'
import { useRiderStore } from '@/stores/rider'
import { toModel as orderToModel, summary } from '@/api/adapters/order'
import { ORDER_STATUS } from '@/constants/enums'
import { formatDateTime, maskPhone } from '@/utils/format'

const riderStore = useRiderStore()

const TABS = [
  { label: '配送中', value: 'DELIVERING' },
  { label: '已送达', value: 'DONE' }
]

const status = ref('DELIVERING')
const loading = ref(false)
const list = ref([])
const finishingId = ref('')

const emptyText = computed(() =>
  status.value === 'DELIVERING' ? '当前没有配送中的订单，去接单大厅抢一单吧' : '还没有完成的订单'
)

async function load() {
  loading.value = true
  try {
    const d = await request({
      url: riderUrl('/orders'),
      method: 'get',
      params: { status: status.value, page: 1, pageSize: 20 }
    })
    list.value = (d?.records || []).map(orderToModel)
  } catch (e) {
    ElMessage.error(e?.message || '订单加载失败')
  } finally {
    loading.value = false
  }
}

function switchTab(v) {
  if (status.value === v) return
  status.value = v
  load()
}

function onCall(order) {
  ElMessageBox.alert(`顾客电话：${order.phone}`, `${order.userName}`, { confirmButtonText: '知道了' })
}

async function onFinish(order) {
  try {
    await ElMessageBox.confirm(`确认把订单 #${order.orderNo.slice(-6)} 送达了吗？`, '确认送达', {
      type: 'warning',
      confirmButtonText: '已送达'
    })
  } catch {
    return
  }
  finishingId.value = order.id
  try {
    await riderStore.finish(order.id)
    ElMessage.success('已送达，本单完成')
    await load()
  } catch (e) {
    ElMessage.error(e?.message || '操作失败')
  } finally {
    finishingId.value = ''
  }
}

onMounted(load)
</script>

<style scoped>
.tabs {
  display: flex;
  gap: 8px;
  padding: 12px 12px 0;
}

.tab {
  padding: 6px 14px;
  border-radius: 16px;
  background: #fff;
  color: #6b7280;
  font-size: 13px;
  cursor: pointer;
}

.tab.on {
  background: #1a4d8f;
  color: #fff;
  font-weight: 600;
}

.pad {
  padding: 10px 12px 20px;
}

.task {
  background: #fff;
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 10px;
}

.task-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.no {
  font-size: 13px;
  font-weight: 600;
  color: #1f2d3d;
}

.addr {
  margin-top: 8px;
  font-size: 13px;
  color: #374151;
  line-height: 1.5;
}

.customer {
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
}

.items {
  margin-top: 4px;
  font-size: 12px;
  color: #9aa3b2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  gap: 8px;
}

.actions {
  display: flex;
  gap: 6px;
}
</style>
