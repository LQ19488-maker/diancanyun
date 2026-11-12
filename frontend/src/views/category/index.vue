<template>
  <div class="page-wrap">
    <PageHeader title="分类管理" subtitle="菜品分类与套餐分类分开维护；口味按分类统一配置">
      <template #extra>
        <el-button type="primary" :icon="Plus" @click="openCreate">新增{{ typeLabel }}</el-button>
      </template>
    </PageHeader>

    <el-card shadow="never" class="mb-12">
      <el-tabs v-model="activeType" @tab-change="onTabChange">
        <el-tab-pane label="菜品分类" name="1" />
        <el-tab-pane label="套餐分类" name="2" />
      </el-tabs>

      <el-form :model="table.query" inline @submit.prevent="table.search()">
        <el-form-item label="分类名称">
          <el-input v-model="table.query.name" placeholder="按名称模糊查询" clearable style="width: 170px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="table.query.status" placeholder="全部" clearable style="width: 110px">
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="table.search()">查询</el-button>
          <el-button :icon="RefreshLeft" @click="table.reset()">重置</el-button>
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
      :empty-text="`还没有${typeLabel}，点右上角新增`"
      @page-change="table.handlePage"
      @size-change="table.handleSize"
      @retry="table.load()"
    >
      <el-table-column prop="name" label="分类名称" min-width="140" />
      <el-table-column label="排序" width="90" align="center">
        <template #default="{ row }">
          <span class="num">{{ row.sort }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <StatusTag :map="ENABLE_STATUS_MAP" :value="row.status" />
        </template>
      </el-table-column>
      <el-table-column label="关联数量" width="120" align="center">
        <template #default="{ row }">
          <span class="num">{{ row.dishCount }}</span>
          <span class="text-muted"> 个{{ row.type === 2 ? '套餐' : '菜品' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="更新时间" min-width="160">
        <template #default="{ row }">
          <span class="text-muted">{{ formatDateTime(row.updateTime, 'YYYY-MM-DD HH:mm') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="210" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="crud.openEdit(row)">编辑</el-button>
          <el-button
            v-if="row.type === 1"
            link
            type="primary"
            :icon="Dish"
            @click="openFlavor(row)"
          >
            口味配置
          </el-button>
          <el-button link type="danger" @click="onRemove(row)">删除</el-button>
        </template>
      </el-table-column>
    </ProTable>

    <!-- 新增 / 编辑 -->
    <el-dialog
      v-model="crud.visible.value"
      :title="crud.isEdit.value ? `编辑${typeLabel}` : `新增${typeLabel}`"
      width="440px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form ref="crud.formRef" :model="crud.form" :rules="categoryRules" label-width="82px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="crud.form.name" placeholder="如：热菜 / 双人套餐" maxlength="12" show-word-limit />
        </el-form-item>
        <el-form-item label="排序号" prop="sort">
          <el-input-number v-model="crud.form.sort" :min="1" :max="999" controls-position="right" />
          <span class="text-muted" style="margin-left: 8px">数字小的排在前面</span>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch
            v-model="crud.form.status"
            :active-value="1"
            :inactive-value="0"
            inline-prompt
            active-text="启用"
            inactive-text="停用"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="crud.visible.value = false">取消</el-button>
        <el-button type="primary" :loading="crud.submitting.value" @click="onSubmit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 口味配置 -->
    <FlavorDialog v-model="flavorVisible" :category="flavorTarget" @saved="table.load()" />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { Plus, Search, RefreshLeft, Dish } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import ProTable from '@/components/ProTable.vue'
import StatusTag from '@/components/StatusTag.vue'
import FlavorDialog from './flavor-dialog.vue'
import { useTable } from '@/composables/useTable'
import { useCrud } from '@/composables/useCrud'
import { formatDateTime } from '@/utils/format'
import { ENABLE_STATUS_MAP } from '@/constants/enums'
import api from '@/api'
import { categoryRules } from './rules'

const activeType = ref('1')
const typeLabel = computed(() => (activeType.value === '2' ? '套餐分类' : '菜品分类'))

const table = useTable(api.category.page, {
  pageSize: 10,
  defaultQuery: { type: 1, name: '', status: '' }
})

const crud = useCrud({
  create: api.category.create,
  update: api.category.update,
  remove: api.category.remove,
  rules: categoryRules,
  label: '分类',
  toForm: (m) => ({ ...m })
})

const flavorVisible = ref(false)
const flavorTarget = ref(null)

function onTabChange(name) {
  table.query.type = Number(name)
  table.search()
}

function openCreate() {
  crud.openCreate({ name: '', sort: 1, status: 1, type: Number(activeType.value) })
}

function openFlavor(row) {
  flavorTarget.value = row
  flavorVisible.value = true
}

async function onSubmit() {
  const ok = await crud.submit()
  if (ok) table.load()
}

async function onRemove(row) {
  // 提示文案由后端给（例如“该分类下还有 24 个菜品，无法删除”），这里只兜一层前端判断
  const tip =
    row.dishCount > 0
      ? `「${row.name}」下还有 ${row.dishCount} 个${row.type === 2 ? '套餐' : '菜品'}，删除会被后端拒绝。仍要尝试吗？`
      : `确定删除「${row.name}」吗？该分类下的口味配置会一并删除。`
  const ok = await crud.confirmRemove(row, tip)
  if (ok) table.load()
}
</script>
