<template>
  <div class="page-wrap">
    <PageHeader title="套餐管理" subtitle="套餐由若干菜品组成；套餐价与菜品原价合计的差额会实时提示">
      <template #extra>
        <el-button type="primary" :icon="Plus" @click="openCreate">新增套餐</el-button>
      </template>
    </PageHeader>

    <el-card shadow="never" class="mb-12">
      <el-form :model="table.query" inline @submit.prevent="table.search()">
        <el-form-item label="套餐名称">
          <el-input v-model="table.query.name" placeholder="按名称模糊查询" clearable style="width: 170px" />
        </el-form-item>
        <el-form-item label="套餐分类">
          <el-select v-model="table.query.categoryId" placeholder="全部" clearable style="width: 150px">
            <el-option v-for="c in comboCategories" :key="c.id" :label="c.name" :value="c.id" />
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
      empty-text="还没有套餐，先新增一个"
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
      <el-table-column prop="name" label="套餐名称" min-width="130" show-overflow-tooltip />
      <el-table-column prop="categoryName" label="套餐分类" width="110" />
      <el-table-column label="套餐价" width="110" align="right">
        <template #default="{ row }">
          <span class="num">{{ formatPrice(row.price) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="原价合计" width="120" align="right">
        <template #default="{ row }">
          <span class="num text-muted">{{ formatPrice(row.originPrice) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="包含菜品" min-width="180">
        <template #default="{ row }">
          <el-tooltip placement="top" :disabled="!row.dishes.length">
            <template #content>
              <div v-for="d in row.dishes" :key="d.id">{{ d.name }}　¥{{ d.price.toFixed(2) }}</div>
            </template>
            <el-tag size="small" effect="plain" type="info">{{ row.dishCount }} 个菜品</el-tag>
          </el-tooltip>
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

    <el-dialog
      v-model="crud.visible.value"
      :title="crud.isEdit.value ? '编辑套餐' : '新增套餐'"
      width="760px"
      :close-on-click-modal="false"
      destroy-on-close
      top="5vh"
    >
      <el-form ref="crud.formRef" :model="crud.form" :rules="comboRules" label-width="116px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="套餐名称" prop="name">
              <el-input v-model="crud.form.name" placeholder="如：双人超值餐" maxlength="20" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="套餐分类" prop="categoryId">
              <el-select v-model="crud.form.categoryId" placeholder="请选择套餐分类" style="width: 100%">
                <el-option v-for="c in comboCategories" :key="c.id" :label="c.name" :value="c.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="套餐价（元）" prop="price">
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

        <el-form-item label="套餐图片">
          <ImageUpload v-model="crud.form.image" />
        </el-form-item>

        <el-form-item label="选择菜品">
          <div class="picker-wrap">
            <DishPicker v-model="crud.form.dishIds" :dishes="allDishes" />
            <el-alert
              v-if="priceHint"
              :type="priceHint.type"
              :closable="false"
              show-icon
              :title="priceHint.text"
              class="mt-8"
            />
          </div>
        </el-form-item>

        <el-form-item label="套餐描述">
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
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Search, RefreshLeft } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import ProTable from '@/components/ProTable.vue'
import ImageUpload from '@/components/ImageUpload.vue'
import DishPicker from './dish-picker.vue'
import { useTable } from '@/composables/useTable'
import { useCrud } from '@/composables/useCrud'
import { formatDateTime, formatPrice } from '@/utils/format'
import api from '@/api'
import { comboRules } from './rules'

const statusLoadingId = ref('')
const comboCategories = ref([])
const allDishes = ref([])

const table = useTable(api.combo.page, {
  pageSize: 10,
  defaultQuery: { name: '', categoryId: '', status: '' }
})

const crud = useCrud({
  create: api.combo.create,
  update: api.combo.update,
  remove: api.combo.remove,
  rules: comboRules,
  label: '套餐',
  toForm: (m) => ({
    ...m,
    price: Number(m.price ?? 0),
    dishIds: [...(m.dishIds || [])]
  })
})

/** 套餐分类（type=2）与全部菜品（供穿梭框） */
async function loadOptions() {
  try {
    const [cats, dishes] = await Promise.all([
      api.category.page({ type: 2, page: 1, pageSize: 100 }),
      api.dish.page({ page: 1, pageSize: 200 })
    ])
    comboCategories.value = cats.list.filter((c) => c.type === 2)
    allDishes.value = dishes.list.map((d) => ({ id: d.id, name: d.name, price: d.price }))
  } catch {
    comboCategories.value = []
    allDishes.value = []
  }
}

/** 已选菜品的原价合计 */
const originPrice = computed(() =>
  (crud.form.dishIds || []).reduce((sum, id) => {
    const hit = allDishes.value.find((d) => String(d.id) === String(id))
    return sum + (hit ? Number(hit.price) : 0)
  }, 0)
)

/** 套餐价与原价合计的对比提示 */
const priceHint = computed(() => {
  const count = (crud.form.dishIds || []).length
  if (!count) return { type: 'warning', text: '还没有选择菜品，套餐至少要含 1 个菜品' }
  const origin = Number(originPrice.value.toFixed(2))
  const price = Number(crud.form.price || 0)
  const diff = Number((origin - price).toFixed(2))
  const rate = origin > 0 ? ((diff / origin) * 100).toFixed(1) : '0.0'
  if (diff > 0) return { type: 'success', text: `已选 ${count} 个菜品，原价合计 ${formatPrice(origin)}，比套餐价高 ${formatPrice(diff)}（省 ${rate}%）` }
  if (diff === 0) return { type: 'info', text: `已选 ${count} 个菜品，原价合计 ${formatPrice(origin)}，与套餐价持平` }
  return { type: 'warning', text: `已选 ${count} 个菜品，原价合计 ${formatPrice(origin)}，比套餐价低 ${formatPrice(-diff)}，请确认是否合理` }
})

function openCreate() {
  crud.openCreate({
    name: '',
    categoryId: '',
    price: 0,
    image: '',
    description: '',
    status: 1,
    dishIds: []
  })
}

async function onEdit(row) {
  // 列表已带 dishes，直接用；若后端列表不返明细，这里会再拉一次详情
  if (row.dishes?.length) {
    crud.openEdit(row)
    return
  }
  try {
    const detail = await api.combo.detail(row.id)
    crud.openEdit(detail)
  } catch (e) {
    ElMessage.error(e?.message || '套餐详情加载失败')
  }
}

async function onSubmit() {
  if (!(crud.form.dishIds || []).length) {
    ElMessage.warning('套餐至少要选 1 个菜品')
    return
  }
  const ok = await crud.submit()
  if (ok) table.load()
}

async function onRemove(row) {
  const ok = await crud.confirmRemove(row, `确定删除套餐「${row.name}」吗？删除后不可恢复。`)
  if (ok) table.load()
}

async function onToggleStatus(row, next) {
  const prev = row.status
  statusLoadingId.value = row.id
  row.status = next ? 1 : 0
  try {
    await api.combo.changeStatus(row.id, row.status)
    ElMessage.success(next ? '已起售' : '已停售')
  } catch (e) {
    row.status = prev
    ElMessage.error(e?.message || '操作失败')
  } finally {
    statusLoadingId.value = ''
  }
}

onMounted(loadOptions)
</script>

<style scoped>
.thumb {
  width: 44px;
  height: 44px;
  border-radius: 6px;
  display: block;
  margin: 0 auto;
}

.picker-wrap {
  width: 100%;
}

.mt-8 {
  margin-top: 8px;
}

.mb-12 {
  margin-bottom: 12px;
}
</style>
