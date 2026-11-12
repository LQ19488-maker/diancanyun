<template>
  <div class="page-wrap">
    <PageHeader title="工作台" subtitle="今日经营概况（统计接口就绪后自动切换为真实数据）">
      <template #extra>
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

    <el-card shadow="never" class="mt-12">
      <el-empty
        description="营业额趋势 / 订单状态分布 / 热销 Top10 —— 等后端统计接口就绪后接入"
        :image-size="80"
      />
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import api, { IS_MOCK } from '@/api'
import { formatPrice } from '@/utils/format'

const isMock = IS_MOCK
const loading = ref(false)
const data = ref({ turnover: 0, orderCount: 0, avgPrice: 0, finishRate: 0 })

const cards = computed(() => [
  { label: '今日营业额', value: formatPrice(data.value.turnover), hint: '仅统计已完成订单' },
  { label: '今日订单量', value: `${data.value.orderCount} 单`, hint: '含各状态订单' },
  { label: '客单价', value: formatPrice(data.value.avgPrice), hint: '营业额 ÷ 订单量' },
  { label: '完成率', value: `${Math.round((data.value.finishRate || 0) * 100)}%`, hint: '已完成 ÷ 全部订单' }
])

async function load() {
  loading.value = true
  try {
    data.value = await api.statistics.overview()
  } catch (e) {
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

.mt-12 {
  margin-top: 12px;
}
</style>
