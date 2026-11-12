<template>
  <el-transfer
    :model-value="modelValue"
    :data="transferData"
    :titles="['可选菜品', '套餐内菜品']"
    filterable
    filter-placeholder="搜索菜品名称"
    :props="{ key: 'key', label: 'label' }"
    @update:model-value="(v) => $emit('update:modelValue', v)"
  />
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  /** 已选菜品 id 数组 */
  modelValue: { type: Array, default: () => [] },
  /** 全部菜品：{ id, name, price } */
  dishes: { type: Array, default: () => [] }
})
defineEmits(['update:modelValue'])

/** 穿梭框要求 key 唯一且为 string/number */
const transferData = computed(() =>
  props.dishes.map((d) => ({
    key: String(d.id),
    label: `${d.name}　¥${Number(d.price).toFixed(2)}`,
    disabled: false
  }))
)
</script>

<style scoped>
:deep(.el-transfer-panel) {
  width: 230px;
}

:deep(.el-transfer) {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 菜品多时限制高度，避免弹窗超出屏幕 */
:deep(.el-transfer-panel__list) {
  height: 168px;
  overflow: auto;
  padding-top: 6px;
}

:deep(.el-transfer-panel__body) {
  height: auto;
}
</style>
