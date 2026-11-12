<template>
  <div class="page-wrap">
    <PageHeader title="工作台" subtitle="今日经营概况；图表均可导出 PNG，口径写在各图下方">
      <template #extra>
        <el-radio-group v-model="days" size="default" @change="load">
          <el-radio-button :value="7">近 7 天</el-radio-button>
          <el-radio-button :value="30">近 30 天</el-radio-button>
        </el-radio-group>
        <el-tag v-if="isMock" type="warning" effect="light" size="small">演示数据</el-tag>
        <el-button :icon="Refresh" :loading="loading" @click="load">刷新</el-button>
      </template>
    </PageHeader>

    <el-row :gutter="12">
      <el-col v-for="card in cards" :key="card.label" :xs="12" :sm="12" :md="6">
        <el-card shadow="never" class="stat-card">
          <div class="label">{{ card.label }}</div>
          <div class="value num">{{ card.value }}</div>
          <div class="hint">{{ card.hint }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="16">
        <ChartCard
          title="营业额与订单量趋势"
          :caliber="`按日汇总，仅统计未取消订单；当前展示近 ${days} 天`"
          :sample="trend.length"
          :option="trendOption"
          :loading="loading"
          :error="error"
          :height="300"
          empty-text="所选区间内没有订单"
          @retry="load"
        />
      </el-col>
      <el-col :xs="24" :lg="8">
        <ChartCard
          title="订单状态分布"
          caliber="全部订单（含已取消）按当前状态计数"
          :sample="totalOrders"
          :option="statusOption"
          :loading="loading"
          :error="error"
          :height="300"
          empty-text="还没有订单"
          @retry="load"
        />
      </el-col>
    </el-row>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="12">
        <ChartCard
          title="热销菜品 Top 8"
          caliber="按菜品出现份数汇总（同一单里点 2 份算 2 份）"
          :sample="hotDishes.length"
          :option="hotOption"
          :loading="loading"
          :error="error"
          :height="280"
          empty-text="暂无销量数据"
          @retry="load"
        />
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card shadow="never" class="table-card">
          <div class="head">
            <span class="title">近 {{ Math.min(days, 7) }} 天明细</span>
            <span class="text-muted">数据来源：订单表按日聚合</span>
          </div>
          <el-table :data="recentRows" size="small" border max-height="248">
            <el-table-column prop="date" label="日期" width="110" />
            <el-table-column label="订单量" width="90" align="right">
              <template #default="{ row }"><span class="num">{{ row.orderCount }}</span></template>
            </el-table-column>
            <el-table-column label="营业额" width="120" align="right">
              <template #default="{ row }"><span class="num">{{ formatPrice(row.turnover) }}</span></template>
            </el-table-column>
            <el-table-column label="客单价" align="right">
              <template #default="{ row }">
                <span class="num">{{ formatPrice(row.orderCount ? row.turnover / row.orderCount : 0) }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import ChartCard from '@/components/ChartCard.vue'
import { turnoverTrendOption, statusDonutOption, hotBarOption } from '@/charts/options'
import { ORDER_STATUS } from '@/constants/enums'
import { formatPrice } from '@/utils/format'
import api, { IS_MOCK } from '@/api'

const isMock = IS_MOCK
const loading = ref(false)
const error = ref(null)
const days = ref(7)
const data = ref({
  turnover: 0,
  orderCount: 0,
  avgPrice: 0,
  finishRate: 0,
  trend: [],
  statusDist: [],
  hotDishes: []
})

/** 指标卡跟着所选区间走：切 7/30 天时四张卡会一起变 */
const rangeTurnover = computed(() =>
  Number(trend.value.reduce((s, t) => s + Number(t.turnover || 0), 0).toFixed(2))
)
const rangeOrders = computed(() => trend.value.reduce((s, t) => s + Number(t.orderCount || 0), 0))
const rangeAvg = computed(() => (rangeOrders.value ? rangeTurnover.value / rangeOrders.value : 0))

const cards = computed(() => [
  { label: `近 ${days.value} 天营业额`, value: formatPrice(rangeTurnover.value), hint: '仅统计已完成订单' },
  { label: `近 ${days.value} 天订单量`, value: `${rangeOrders.value} 单`, hint: '含各状态订单（不含已取消）' },
  { label: '客单价', value: formatPrice(rangeAvg.value), hint: '营业额 ÷ 订单量' },
  { label: '完成率', value: `${Math.round(finishRate.value * 100)}%`, hint: '已完成 ÷ 全部订单' }
])

/** 趋势按选择的天数切片（后端固定返回 30 天，前端切） */
const trend = computed(() => (data.value.trend || []).slice(-days.value))
const recentRows = computed(() => trend.value.slice(-Math.min(days.value, 7)).reverse())

const totalOrders = computed(() => (data.value.statusDist || []).reduce((s, x) => s + Number(x.count || 0), 0))
const doneOrders = computed(() =>
  (data.value.statusDist || [])
    .filter((x) => x.status === 'DONE')
    .reduce((s, x) => s + Number(x.count || 0), 0)
)
const finishRate = computed(() => (totalOrders.value ? doneOrders.value / totalOrders.value : 0))
const hotDishes = computed(() => data.value.hotDishes || [])

const trendOption = computed(() => (trend.value.length ? turnoverTrendOption(trend.value) : null))
const statusOption = computed(() =>
  totalOrders.value ? statusDonutOption(data.value.statusDist, (s) => ORDER_STATUS[s]?.text || s) : null
)
const hotOption = computed(() => (hotDishes.value.length ? hotBarOption(hotDishes.value) : null))

async function load() {
  loading.value = true
  error.value = null
  try {
    data.value = await api.statistics.overview()
  } catch (e) {
    error.value = e
    ElMessage.error(e?.message || '统计接口暂未就绪')
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.stat-card {
  margin-bottom: 12px;
}

.label {
  font-size: 13px;
  color: #8c93a1;
}

.value {
  margin: 6px 0 2px;
  font-size: 24px;
  font-weight: 600;
  color: #1f2d3d;
}

.hint {
  font-size: 12px;
  color: #a8b0be;
}

.table-card {
  margin-bottom: 12px;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2d3d;
}
</style>
