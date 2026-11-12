<template>
  <div class="page-wrap">
    <PageHeader title="菜品管理" subtitle="菜品与售卖状态维护；改分类会重新加载该分类下的口味">
      <template #extra>
        <el-button type="primary" :icon="Plus" @click="openCreate">新增菜品</el-button>
      </template>
    </PageHeader>

    <el-card shadow="never" class="mb-12">
      <el-form :model="table.query" inline @submit.prevent="table.search()">
        <el-form-item label="菜品名称">
          <el-input v-model="table.query.name" placeholder="按名称模糊查询" clearable style="width: 170px" />
        </el-form-item>
        <el-form-item label="所属分类">
          <el-select v-model="table.query.categoryId" placeholder="全部" clearable style="width: 150px">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="table.query.status" placeholder="全部" clearable style="width: 110px">
            <el-option label="起售" :value="1" />
            <el-option label="停售" :value="0" />
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
      empty-text="还没有菜品，先新增一个"
      @page-change="table.handlePage"
      @size-change="table.handleSize"
      @retry="table.load()"
    >
      <el-table-column label="图片" width="86" align="center">
        <template #default="{ row }">
          <el-image
            v-if="row.image"
            :src="row.imageUrl"
            fit="cover"
            class="thumb"
            :preview-src-list="[row.imageUrl]"
            preview-teleported
          />
          <span v-else class="text-muted">无图</span>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="菜品名称" min-width="140" show-overflow-tooltip />
      <el-table-column prop="categoryName" label="所属分类" width="110" />
      <el-table-column label="售价" width="110" align="right">
        <template #default="{ row }">
          <span class="num">{{ formatPrice(row.price) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="口味" min-width="170">
        <template #default="{ row }">
          <span v-if="!row.flavors.length" class="text-muted">—</span>
          <el-tag
            v-for="(f, i) in row.flavors"
            :key="i"
            size="small"
            type="info"
            effect="plain"
            class="flavor-tag"
          >
            {{ f.name }}：{{ f.values.join('/') }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="120">
        <template #default="{ row }">
          <el-switch
            :model-value="row.status === 1"
            :loading="statusLoadingId === row.id"
            inline-prompt
            active-text="起售"
            inactive-text="停售"
            @change="(v) => onToggleStatus(row, v)"
          />
        </template>
      </el-table-column>
      <el-table-column label="更新时间" min-width="150">
        <template #default="{ row }">
          <span class="text-muted">{{ formatDateTime(row.updateTime, 'YYYY-MM-DD HH:mm') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="onEdit(row)">编辑</el-button>
          <el-button link type="danger" @click="onRemove(row)">删除</el-button>
        </template>
      </el-table-column>
    </ProTable>

    <!-- 新增 / 编辑 -->
    <el-dialog
      v-model="crud.visible.value"
      :title="crud.isEdit.value ? '编辑菜品' : '新增菜品'"
      width="620px"
      :close-on-click-modal="false"
      destroy-on-close
      top="6vh"
    >
      <el-form ref="crud.formRef" :model="crud.form" :rules="dishRules" label-width="108px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="菜品名称" prop="name">
              <el-input v-model="crud.form.name" placeholder="如：宫保鸡丁" maxlength="20" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属分类" prop="categoryId">
              <el-select
                v-model="crud.form.categoryId"
                placeholder="请选择菜品分类"
                style="width: 100%"
                @change="(v) => loadFlavors(v, false)"
              >
                <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="售价（元）" prop="price">
              <el-input-number
                v-model="crud.form.price"
                :min="0.01"
                :max="9999"
                :precision="2"
                :step="1"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="售卖状态">
              <el-switch
                v-model="crud.form.status"
                :active-value="1"
                :inactive-value="0"
                inline-prompt
                active-text="起售"
                inactive-text="停售"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="菜品图片">
          <ImageUpload v-model="crud.form.image" />
        </el-form-item>

        <el-form-item label="口味配置">
          <div v-if="!crud.form.categoryId" class="text-muted">先选分类，口味会按该分类的配置自动出现</div>
          <div v-else-if="!availableFlavors.length" class="text-muted">
            该分类还没有配口味，可去「分类管理 → 口味配置」里添加
          </div>
          <div v-else class="flavor-form">
            <div v-for="f in availableFlavors" :key="f.name" class="flavor-row">
              <span class="flavor-label">{{ f.name }}</span>
              <el-select
                :model-value="selectedValues(f.name)"
                multiple
                collapse-tags
                collapse-tags-tooltip
                placeholder="不选表示该菜品不支持这个口味"
                style="flex: 1"
                @update:model-value="(v) => setValues(f.name, v)"
              >
                <el-option v-for="v in f.values" :key="v.name" :label="v.name" :value="v.name" />
              </el-select>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="菜品描述">
          <el-input
            v-model="crud.form.description"
            type="textarea"
            :rows="2"
            maxlength="60"
            show-word-limit
            placeholder="一句话描述，可留空"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="crud.visible.value = false">取消</el-button>
        <el-button type="primary" :loading="crud.submitting.value" @click="onSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Search, RefreshLeft } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import ProTable from '@/components/ProTable.vue'
import ImageUpload from '@/components/ImageUpload.vue'
import { useTable } from '@/composables/useTable'
import { useCrud } from '@/composables/useCrud'
import { formatDateTime, formatPrice } from '@/utils/format'
import api from '@/api'
import { dishRules } from './rules'

const statusLoadingId = ref('')
const categories = ref([])
const availableFlavors = ref([])

const table = useTable(api.dish.page, {
  pageSize: 10,
  defaultQuery: { name: '', categoryId: '', status: '' }
})

const crud = useCrud({
  create: api.dish.create,
  update: api.dish.update,
  remove: api.dish.remove,
  rules: dishRules,
  label: '菜品',
  toForm: (m) => ({
    ...m,
    price: Number(m.price ?? 0),
    flavors: (m.flavors || []).map((f) => ({ name: f.name, values: [...(f.values || [])] }))
  })
})

/** 菜品分类（type=1）用于下拉 */
async function loadCategories() {
  try {
    const { list } = await api.category.page({ type: 1, page: 1, pageSize: 100 })
    categories.value = list.filter((c) => c.type === 1)
  } catch {
    categories.value = []
  }
}

/** 按分类加载口味配置；keep=true 时保留表单里已选的值（编辑场景） */
async function loadFlavors(categoryId, keep) {
  if (!categoryId) {
    availableFlavors.value = []
    crud.form.flavors = []
    return
  }
  const old = new Map((crud.form.flavors || []).map((f) => [f.name, f.values || []]))
  try {
    const list = await api.category.getFlavors(categoryId)
    availableFlavors.value = list
    crud.form.flavors = list.map((f) => ({
      name: f.name,
      values: keep ? old.get(f.name) || [] : []
    }))
  } catch {
    availableFlavors.value = []
  }
}

const selectedValues = (flavorName) =>
  (crud.form.flavors || []).find((f) => f.name === flavorName)?.values || []

function setValues(flavorName, values) {
  const hit = (crud.form.flavors || []).find((f) => f.name === flavorName)
  if (hit) hit.values = values
  else crud.form.flavors = [...(crud.form.flavors || []), { name: flavorName, values }]
}

function openCreate() {
  availableFlavors.value = []
  crud.openCreate({ name: '', categoryId: '', price: 0, image: '', description: '', status: 1, flavors: [] })
}

async function onEdit(row) {
  crud.openEdit(row)
  await loadFlavors(row.categoryId, true)
}

async function onSubmit() {
  if (!crud.form.categoryId) {
    ElMessage.warning('请选择所属分类')
    return
  }
  const ok = await crud.submit()
  if (ok) table.load()
}

async function onRemove(row) {
  const ok = await crud.confirmRemove(row, `确定删除菜品「${row.name}」吗？删除后不可恢复。`)
  if (ok) table.load()
}

/** 上下架：乐观更新，失败回滚 */
async function onToggleStatus(row, next) {
  const prev = row.status
  statusLoadingId.value = row.id
  row.status = next ? 1 : 0
  try {
    await api.dish.changeStatus(row.id, row.status)
    ElMessage.success(next ? '已起售' : '已停售')
  } catch (e) {
    row.status = prev
    ElMessage.error(e?.message || '操作失败')
  } finally {
    statusLoadingId.value = ''
  }
}

onMounted(loadCategories)
</script>

<style scoped>
.thumb {
  width: 44px;
  height: 44px;
  border-radius: 6px;
  display: block;
  margin: 0 auto;
}

.flavor-tag {
  margin: 2px 4px 2px 0;
}

.flavor-form {
  width: 100%;
}

.flavor-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.flavor-label {
  width: 56px;
  color: #4b5563;
  font-size: 13px;
  flex: none;
}

.mb-12 {
  margin-bottom: 12px;
}
</style>
