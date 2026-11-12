<template>
  <div class="image-upload">
    <div v-if="modelValue" class="preview">
      <el-image :src="displayUrl" fit="cover" class="thumb" :preview-src-list="[displayUrl]" preview-teleported />
      <div class="mask">
        <el-button link type="primary" :icon="Refresh" @click="pick">换一张</el-button>
        <el-button link type="danger" :icon="Delete" @click="clear">删除</el-button>
      </div>
    </div>

    <div v-else class="picker" :class="{ loading }" @click="pick">
      <el-icon v-if="!loading" class="plus"><Plus /></el-icon>
      <span v-if="!loading" class="text">{{ placeholder }}</span>
      <span v-else class="text">处理中…</span>
    </div>

    <input ref="inputRef" type="file" accept="image/*" hidden @change="onFile" />

    <p class="tip">
      {{ tip }}
      <span v-if="isMock" class="text-muted">（演示环境：图片只存在本地浏览器，不会真的上传）</span>
    </p>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Refresh, Delete } from '@element-plus/icons-vue'
import api, { IS_MOCK, resolveFileUrl } from '@/api'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '点击上传图片' },
  tip: { type: String, default: '支持 jpg / png，建议 1:1，不超过 2 MB' },
  maxSizeMb: { type: Number, default: 2 }
})
const emit = defineEmits(['update:modelValue'])

const isMock = IS_MOCK
const loading = ref(false)
const inputRef = ref(null)

/** data: 开头直接显示，其余按后端相对路径补前缀 */
const displayUrl = computed(() =>
  props.modelValue.startsWith('data:') ? props.modelValue : resolveFileUrl(props.modelValue)
)

function pick() {
  inputRef.value?.click()
}

function clear() {
  emit('update:modelValue', '')
}

function onFile(e) {
  const file = e.target.files?.[0]
  e.target.value = '' // 允许重复选同一个文件
  if (!file) return

  if (!file.type.startsWith('image/')) {
    ElMessage.warning('只能上传图片文件')
    return
  }
  if (file.size > props.maxSizeMb * 1024 * 1024) {
    ElMessage.warning(`图片不能超过 ${props.maxSizeMb} MB`)
    return
  }

  loading.value = true
  if (isMock) {
    // 演示环境：本地转 base64，切真实后端时这段不会执行
    const reader = new FileReader()
    reader.onload = () => {
      emit('update:modelValue', String(reader.result || ''))
      loading.value = false
    }
    reader.onerror = () => {
      ElMessage.error('读取图片失败')
      loading.value = false
    }
    reader.readAsDataURL(file)
    return
  }

  api.upload
    .image(file)
    .then((url) => emit('update:modelValue', url))
    .catch((err) => ElMessage.error(err?.message || '上传失败'))
    .finally(() => {
      loading.value = false
    })
}
</script>

<style scoped>
.image-upload {
  display: inline-block;
}

.preview {
  position: relative;
  width: 96px;
  height: 96px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e8ecf2;
}

.thumb {
  width: 96px;
  height: 96px;
  display: block;
}

.mask {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  background: rgba(0, 0, 0, 0.55);
  opacity: 0;
  transition: opacity 0.15s;
}

.preview:hover .mask {
  opacity: 1;
}

.mask :deep(.el-button) {
  color: #fff;
  font-size: 12px;
}

.picker {
  width: 96px;
  height: 96px;
  border: 1px dashed #c8d0dc;
  border-radius: 8px;
  background: #fafbfd;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  transition: border-color 0.15s;
}

.picker:hover {
  border-color: #409eff;
}

.picker.loading {
  cursor: wait;
}

.plus {
  font-size: 20px;
  color: #94a3b8;
}

.text {
  font-size: 12px;
  color: #94a3b8;
  text-align: center;
  padding: 0 6px;
}

.tip {
  margin: 6px 0 0;
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.5;
  max-width: 260px;
}
</style>
