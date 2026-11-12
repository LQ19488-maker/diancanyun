<template>
  <el-tag :type="meta.type" size="small" effect="light" disable-transitions>
    {{ meta.text }}
  </el-tag>
</template>

<script setup>
import { computed } from 'vue'
import { statusOf } from '@/constants/enums'

const props = defineProps({
  /** 状态字典，例如 EMPLOYEE_STATUS_MAP */
  map: { type: Object, required: true },
  /** 当前值（可以是数字、字符串或后端枚举 key） */
  value: { type: [String, Number], default: '' }
})

const meta = computed(() => statusOf(props.map, props.value))
</script>
