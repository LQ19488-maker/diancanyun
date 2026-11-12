<template>
  <div class="pro-table">
    <!-- 出错：错误码 + 重试，而不是白屏 -->
    <div v-if="error" class="state-box">
      <el-alert type="error" :closable="false" show-icon
        :title="`加载失败：${error.message || '网络异常'}`"
        :description="error.code ? `错误码 ${error.code}` : ''" />
      <el-button class="mt-8" size="small" @click="$emit('retry')">重试</el-button>
    </div>

    <template v-else>
      <el-table
        :data="data"
        v-loading="loading"
        border
        stripe
        :empty-text="''"
        header-cell-class-name="pro-table__head"
        :max-height="maxHeight"
        style="width: 100%"
      >
        <slot />
        <template #empty>
          <!-- 加载中给骨架屏，加载完才是真正的空状态 -->
          <div v-if="loading" class="empty-wrap">
            <div v-for="i in 4" :key="i" class="skeleton-block" :style="{ width: `${95 - i * 6}%` }" />
          </div>
          <div v-else class="empty-wrap">
            <el-empty :description="emptyText" :image-size="72">
              <slot name="empty-action" />
            </el-empty>
          </div>
        </template>
      </el-table>

      <div class="pager">
        <span class="text-muted">共 {{ total }} 条</span>
        <el-pagination
          :current-page="page"
          :page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="sizes, prev, pager, next, jumper"
          background
          @current-change="(p) => $emit('page-change', p)"
          @size-change="(s) => $emit('size-change', s)"
        />
      </div>
    </template>
  </div>
</template>

<script setup>
defineProps({
  data: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: Object, default: null },
  total: { type: Number, default: 0 },
  page: { type: Number, default: 1 },
  pageSize: { type: Number, default: 10 },
  emptyText: { type: String, default: '暂无数据' },
  maxHeight: { type: [String, Number], default: undefined }
})
defineEmits(['page-change', 'size-change', 'retry'])
</script>

<style scoped>
.pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  gap: 12px;
  flex-wrap: wrap;
}

.state-box {
  padding: 24px 8px;
  text-align: center;
}

.mt-8 {
  margin-top: 8px;
}

.empty-wrap {
  padding: 16px 0;
}

:deep(.pro-table__head) {
  background: #f6f8fb;
  color: #1f2937;
  font-weight: 600;
}
</style>
