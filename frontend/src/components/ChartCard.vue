<template>
  <el-card shadow="never" class="chart-card">
    <!-- 四件套之一：标题；之二：样本数；之三：口径说明；之四：导出按钮 -->
    <div class="head">
      <div class="left">
        <span class="title">{{ title }}</span>
        <el-tag v-if="sample !== null && sample !== undefined" size="small" type="info" effect="plain" class="sample">
          n = {{ sample }}
        </el-tag>
      </div>
      <el-button link type="primary" :icon="Download" @click="onExport">导出 PNG</el-button>
    </div>
    <p v-if="caliber" class="caliber">{{ caliber }}</p>

    <div class="body" :style="{ height: `${height}px` }">
      <!-- 容器始终挂载：一旦被 v-if 摘掉，ECharts 会拿到 0 高度导致画不出东西 -->
      <div ref="el" class="canvas" :class="{ hidden: !ready }" />

      <div v-if="error" class="overlay">
        <el-alert type="error" :closable="false" show-icon :title="`加载失败：${error.message || '网络异常'}`" />
        <el-button size="small" class="mt-8" @click="$emit('retry')">重试</el-button>
      </div>
      <div v-else-if="loading" class="overlay">
        <div v-for="i in 3" :key="i" class="skeleton-block" :style="{ width: `${90 - i * 14}%` }" />
      </div>
      <div v-else-if="!ready" class="overlay">
        <el-empty :description="emptyText" :image-size="70" />
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { Download } from '@element-plus/icons-vue'
import { useChart } from '@/composables/useChart'

const props = defineProps({
  title: { type: String, required: true },
  /** 口径说明，显示在图下方；图表数据必须能追溯到口径 */
  caliber: { type: String, default: '' },
  /** 样本数，null 表示不显示 */
  sample: { type: [Number, String], default: null },
  /** ECharts option；为空表示没有数据 */
  option: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  error: { type: Object, default: null },
  height: { type: Number, default: 280 },
  emptyText: { type: String, default: '暂无数据' }
})
defineEmits(['retry'])

const el = ref(null)
const { setOption, exportPng } = useChart(el)

const ready = computed(() => Boolean(props.option) && !props.loading && !props.error)

watch(
  () => props.option,
  (opt) => {
    if (opt) setOption(opt)
  },
  { immediate: true, deep: false }
)

function onExport() {
  exportPng(props.title)
}
</script>

<style scoped>
.chart-card {
  margin-bottom: 12px;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2d3d;
}

.sample {
  transform: scale(0.92);
}

.caliber {
  margin: 4px 0 8px;
  font-size: 12px;
  color: #9aa3b2;
  line-height: 1.5;
}

.body {
  position: relative;
  width: 100%;
}

.canvas {
  width: 100%;
  height: 100%;
}

.canvas.hidden {
  opacity: 0;
  pointer-events: none;
}

.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: #fff;
}

.mt-8 {
  margin-top: 8px;
}
</style>
