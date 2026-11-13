<template>
  <div class="page-wrap">
    <PageHeader title="订单管理" subtitle="状态流转完全由状态机推导，页面里没有魔法值">
      <template #extra>
        <el-button :icon="Download" :loading="exporting" @click="onExport">导出 CSV</el-button>
      </template>
    </PageHeader>

    <el-card shadow="never" class="mb-12">
      <el-tabs v-model="activeStatus" @tab-change="onTabChange">
        <el-tab-pane v-for="t in TABS" :key="t.value" :name="t.value">
          <template #label>
            <span>{{ t.label }}</span>
            <span class="tab-count">{{ counts[t.value] ?? 0 }}</span>
          </template>
        </el-tab-pane>
      </el-tabs>

      <el-form :model="table.query" inline @submit.prevent="table.search()">
        <el-form-item label="订单号">
          <el-input v-model="table.query.orderNo" placeholder="按订单号查询" clearable style="width: 170px" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="table.query.phone" placeholder="顾客手机号" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item label="下单时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 250px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="onSearch">查询</el-button>
          <el-button :icon="RefreshLeft" @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <ProTable
      :data="table.list.value"
      :loading="table.loading.value"
      :error="table.error.value"
      :total="table.total.value"
      :page="table.page.value"
      :page-size="table.size.value"
      empty-text="当前条件下没有订单"
      @page-change="table.handlePage"
      @size-change="table.handleSize"
      @retry="table.load()"
    >
      <el-table-column prop="orderNo" label="订单号" width="150" show-overflow-tooltip />
      <el-table-column label="下单时间" width="140">
        <template #default="{ row }">
          <span class="text-muted">{{ formatDateTime(row.createdAt, 'MM-DD HH:mm') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="客户" width="130">
        <template #default="{ row }">
          <div>{{ row.userName }}</div>
          <div class="text-muted">{{ maskPhone(row.phone) }}</div>
        </template>
      </el-table-column>
      <el-table-column label="订单内容" min-width="190" show-overflow-tooltip>
        <template #default="{ row }">{{ summary(row) }}</template>
      </el-table-column>
      <el-table-column label="金额" width="105" align="right">
        <template #default="{ row }">
          <span class="num">{{ formatPrice(row.totalAmount) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="支付" width="90">
        <template #default="{ row }">
          <StatusTag :map="PAY_STATUS" :value="row.payStatus" />
        </template>
      </el-table-column>
      <el-table-column label="订单状态" width="110">
        <template #default="{ row }">
          <StatusTag :map="ORDER_STATUS" :value="row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="forwardOf(row.status)"
            link
            type="primary"
            :loading="actingId === row.id"
            @click="onQuickAction(row, forwardOf(row.status))"
          >
            {{ ACTION_LABEL[forwardOf(row.status)] }}
          </el-button>
          <el-button link type="primary" @click="openDetail(row)">详情</el-button>
        </template>
      </el-table-column>
    </ProTable>

    <OrderDetail
      v-model="detailVisible"
      :order-id="detailId"
      @changed="onDetailChanged"
    />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, RefreshLeft, Download } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import ProTable from '@/components/ProTable.vue'
import StatusTag from '@/components/StatusTag.vue'
import OrderDetail from './detail-drawer.vue'
import { useTable } from '@/composables/useTable'
import { formatDateTime, formatPrice, maskPhone, buildDateRange } from '@/utils/format'
import { downloadCsv } from '@/utils/csv'
import { ORDER_STATUS, ORDER_ACTION_LABEL, PAY_STATUS, MERCHANT_ACTIONS } from '@/constants/enums'
import api from '@/api'

const ACTION_LABEL = ORDER_ACTION_LABEL
const PAY_STATUS_MAP = PAY_STATUS

const TABS = [
  { label: '全部', value: 'ALL' },
  { label: '待接单', value: 'PENDING' },
  { label: '已接单', value: 'ACCEPTED' },
  { label: '派送中', value: 'DELIVERING' },
  { label: '已完成', value: 'DONE' },
  { label: '已取消', value: 'CANCELED' }
]

const activeStatus = ref('ALL')
const counts = ref({})
const dateRange = ref([])
const actingId = ref('')
const exporting = ref(false)
const detailVisible = ref(false)
const detailId = ref('')

const table = useTable(api.order.page, {
  pageSize: 10,
  defaultQuery: { orderNo: '', phone: '', status: '' }
})

const summary = api.order.summary

/** 商家只做「接单」，配送相关动作（抢单配送/确认送达）归骑手端 */
function forwardOf(status) {
  const next = ORDER_STATUS[status]?.next || []
  return next.find((s) => MERCHANT_ACTIONS.includes(s) && s !== 'CANCELED') || ''
}

async function loadCounts() {
  try {
    counts.value = await api.order.statusCount()
  } catch {
    counts.value = {}
  }
}

function applyDateRange() {
  const r = buildDateRange(dateRange.value)
  table.query.startTime = r.startTime || ''
  table.query.endTime = r.endTime || ''
}

function onSearch() {
  applyDateRange()
  table.search()
}

function onReset() {
  dateRange.value = []
  table.query.startTime = ''
  table.query.endTime = ''
  table.reset()
}

function onTabChange(name) {
  table.query.status = name === 'ALL' ? '' : name
  table.search()
}

async function refreshAll() {
  await Promise.all([table.load(), loadCounts()])
}

async function onQuickAction(row, next) {
  const label = ACTION_LABEL[next] || '操作'
  try {
    await ElMessageBox.confirm(`确定对订单 ${row.orderNo} 执行「${label}」吗？`, '状态流转', {
      type: 'warning',
      confirmButtonText: label,
      cancelButtonText: '取消'
    })
  } catch {
    return
  }
  actingId.value = row.id
  try {
    await api.order.changeStatus(row.id, next)
    ElMessage.success(`已${label}`)
    await refreshAll()
  } catch (e) {
    ElMessage.error(e?.message || '操作失败')
  } finally {
    actingId.value = ''
  }
}

function openDetail(row) {
  detailId.value = row.id
  detailVisible.value = true
}

function onDetailChanged() {
  refreshAll()
}

/** 导出当前筛选结果（最多 500 条），带 UTF-8 BOM，Excel 打开不乱码 */
async function onExport() {
  exporting.value = true
  try {
    applyDateRange()
    const size = 100
    let page = 1
    let total = Infinity
    const rows = []
    while (rows.length < Math.min(total, 500)) {
      const res = await api.order.page({ ...table.query, page, pageSize: size })
      total = res.total
      rows.push(...res.list)
      if (!res.list.length) break
      page += 1
    }
    if (!rows.length) {
      ElMessage.warning('当前筛选结果为空，无需导出')
      return
    }
    downloadCsv(
      `订单导出-${activeStatus.value}`,
      ['订单号', '下单时间', '顾客', '手机号', '桌号/方式', '订单内容', '菜品小计', '打包费', '合计', '支付状态', '订单状态'],
      rows.map((r) => [
        r.orderNo,
        formatDateTime(r.createdAt),
        r.userName,
        r.phone,
        r.tableNo,
        summary(r),
        r.amount.toFixed(2),
        r.packFee.toFixed(2),
        r.totalAmount.toFixed(2),
        PAY_STATUS_MAP[r.payStatus]?.text || r.payStatus,
        ORDER_STATUS[r.status]?.text || r.status
      ])
    )
    ElMessage.success(`已导出 ${rows.length} 条`)
  } catch (e) {
    ElMessage.error(e?.message || '导出失败')
  } finally {
    exporting.value = false
  }
}

onMounted(() => {
  loadCounts()
})
</script>

<style scoped>
.tab-count {
  display: inline-block;
  min-width: 18px;
  margin-left: 4px;
  padding: 0 5px;
  border-radius: 9px;
  background: #eef1f6;
  color: #6b7280;
  font-size: 11px;
  line-height: 16px;
  text-align: center;
}

.mb-12 {
  margin-bottom: 12px;
}
</style>
