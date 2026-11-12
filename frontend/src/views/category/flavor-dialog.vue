<template>
  <el-dialog
    :model-value="modelValue"
    :title="`口味配置 · ${category?.name || ''}`"
    width="620px"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="(v) => $emit('update:modelValue', v)"
    @open="load"
  >
    <div v-loading="loading" class="flavor-body">
      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="口味按分类统一配置；保存时为整体覆盖，删除的口味会一并从该分类下移除。"
        class="mb-12"
      />

      <div v-if="!loading && !list.length" class="empty">
        <el-empty description="这个分类还没有口味，点下面按钮添加" :image-size="70" />
      </div>

      <div v-for="(flavor, fi) in list" :key="fi" class="flavor-item">
        <div class="flavor-head">
          <el-input
            v-model="flavor.name"
            placeholder="口味名，如：辣度 / 份量 / 甜度"
            maxlength="10"
            show-word-limit
            style="width: 260px"
          />
          <el-button link type="danger" :icon="Delete" @click="removeFlavor(fi)">删除该口味</el-button>
        </div>

        <div class="values">
          <el-tag
            v-for="(v, vi) in flavor.values"
            :key="vi"
            closable
            type="info"
            effect="plain"
            @close="flavor.values.splice(vi, 1)"
          >
            {{ v.name }}
          </el-tag>
          <el-input
            v-model="flavor._draft"
            size="small"
            class="value-input"
            placeholder="输入口味值后回车"
            maxlength="10"
            @keyup.enter="addValue(flavor)"
            @blur="addValue(flavor)"
          />
        </div>
      </div>

      <el-button class="add-btn" :icon="Plus" @click="addFlavor">添加口味</el-button>
    </div>

    <template #footer>
      <span class="footer-tip text-muted">共 {{ list.length }} 个口味</span>
      <el-button @click="$emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :loading="saving" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import api from '@/api'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  category: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue', 'saved'])

const loading = ref(false)
const saving = ref(false)
const list = ref([])

function blankFlavor() {
  return { name: '', values: [], _draft: '' }
}

async function load() {
  if (!props.category?.id) return
  loading.value = true
  try {
    const flavors = await api.category.getFlavors(props.category.id)
    list.value = flavors.map((f) => ({ ...f, _draft: '' }))
  } catch (e) {
    ElMessage.error(e?.message || '口味加载失败')
    list.value = []
  } finally {
    loading.value = false
  }
}

function addFlavor() {
  list.value.push(blankFlavor())
}

function removeFlavor(index) {
  list.value.splice(index, 1)
}

/** 按回车或失焦时把草稿值推进标签列表 */
function addValue(flavor) {
  const v = (flavor._draft || '').trim()
  if (!v) return
  if (flavor.values.some((x) => x.name === v)) {
    ElMessage.warning(`「${v}」已存在`)
  } else {
    flavor.values.push({ name: v })
  }
  flavor._draft = ''
}

async function save() {
  // 前端先做一遍校验，避免把明显非法的数据发给后端
  const cleaned = list.value
    .map((f) => ({ name: (f.name || '').trim(), values: f.values }))
    .filter((f) => f.name)

  if (cleaned.some((f) => f.values.length === 0)) {
    ElMessage.warning('每个口味至少要有一个口味值')
    return
  }
  const names = cleaned.map((f) => f.name)
  if (new Set(names).size !== names.length) {
    ElMessage.warning('口味名不能重复')
    return
  }

  saving.value = true
  try {
    await api.category.saveFlavors(props.category.id, cleaned)
    ElMessage.success('口味已保存')
    emit('update:modelValue', false)
    emit('saved')
  } catch (e) {
    ElMessage.error(e?.message || '保存失败')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.flavor-body {
  min-height: 160px;
}

.flavor-item {
  border: 1px solid #e8ecf2;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
  background: #fbfcfe;
}

.flavor-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.values {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.value-input {
  width: 150px;
}

.add-btn {
  width: 100%;
  border-style: dashed;
}

.empty {
  padding: 8px 0 16px;
}

.mb-12 {
  margin-bottom: 12px;
}

.footer-tip {
  float: left;
  line-height: 32px;
}
</style>
