<template>
  <div class="page-wrap">
    <PageHeader title="骑手管理" subtitle="骑手账号、所属站点与接单开关；停用账号会自动置为休息中">
      <template #extra>
        <el-button type="primary" :icon="Plus" @click="crud.openCreate({ vehicle: '电动车', status: 1, online: 0 })">
          新增骑手
        </el-button>
      </template>
    </PageHeader>

    <el-card shadow="never" class="mb-12">
      <el-form :model="table.query" inline @submit.prevent="table.search()">
        <el-form-item label="姓名/编号">
          <el-input v-model="table.query.name" placeholder="姓名" clearable style="width: 130px" />
          <el-input v-model="table.query.code" placeholder="编号如 R1001" clearable style="width: 140px; margin-left: 6px" />
        </el-form-item>
        <el-form-item label="站点">
          <el-select v-model="table.query.area" placeholder="全部" clearable style="width: 140px">
            <el-option v-for="a in AREAS" :key="a" :label="a" :value="a" />
          </el-select>
        </el-form-item>
        <el-form-item label="接单状态">
          <el-select v-model="table.query.online" placeholder="全部" clearable style="width: 120px">
            <el-option label="在线接单" :value="1" />
            <el-option label="休息中" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="账号">
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
      empty-text="还没有骑手，先新增一个"
      @page-change="table.handlePage"
      @size-change="table.handleSize"
      @retry="table.load()"
    >
      <el-table-column label="骑手" min-width="150">
        <template #default="{ row }">
          <div class="rider-cell">
            <el-avatar :size="30" :style="{ background: avatarColor(row.name) }">
              {{ row.name.slice(0, 1) }}
            </el-avatar>
            <div>
              <div class="rname">{{ row.name }}</div>
              <div class="text-muted">{{ row.code }}</div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="phone" label="手机号" width="130" />
      <el-table-column prop="area" label="所属站点" width="110" />
      <el-table-column prop="vehicle" label="车型" width="90" />
      <el-table-column label="接单状态" width="130">
        <template #default="{ row }">
          <el-switch
            :model-value="row.online === 1"
            :loading="onlineLoadingId === row.id"
            :disabled="row.status === 0"
            inline-prompt
            active-text="上线"
            inactive-text="休息"
            @change="(v) => onToggleOnline(row, v)"
          />
        </template>
      </el-table-column>
      <el-table-column label="今日 / 在途" width="110" align="center">
        <template #default="{ row }">
          <span class="num">{{ row.todayDone }}</span>
          <span class="text-muted"> / </span>
          <span class="num" :class="{ busy: row.onTheWay > 0 }">{{ row.onTheWay }}</span>
        </template>
      </el-table-column>
      <el-table-column label="评分" width="90" align="center">
        <template #default="{ row }">
          <span class="num">{{ row.rating.toFixed(1) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="账号" width="90">
        <template #default="{ row }">
          <StatusTag :map="ENABLE_STATUS_MAP" :value="row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="170" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="crud.openEdit(row)">编辑</el-button>
          <el-button link :type="row.status === 1 ? 'warning' : 'success'" @click="onToggleStatus(row)">
            {{ row.status === 1 ? '停用' : '启用' }}
          </el-button>
          <el-button link type="danger" @click="onRemove(row)">删除</el-button>
        </template>
      </el-table-column>
    </ProTable>

    <el-dialog
      v-model="crud.visible.value"
      :title="crud.isEdit.value ? '编辑骑手' : '新增骑手'"
      width="480px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form ref="crud.formRef" :model="crud.form" :rules="formRules" label-width="96px">
        <el-form-item v-if="!crud.isEdit.value" label="登录账号" prop="username">
          <el-input v-model="crud.form.username" placeholder="字母开头，3–16 位" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="crud.form.name" placeholder="真实姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="crud.form.phone" maxlength="11" placeholder="11 位手机号" />
        </el-form-item>
        <el-form-item label="所属站点" prop="area">
          <el-select v-model="crud.form.area" placeholder="请选择站点" style="width: 100%">
            <el-option v-for="a in AREAS" :key="a" :label="a" :value="a" />
          </el-select>
        </el-form-item>
        <el-form-item label="车型" prop="vehicle">
          <el-radio-group v-model="crud.form.vehicle">
            <el-radio v-for="v in VEHICLES" :key="v" :value="v">{{ v }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="接单状态">
          <el-switch
            v-model="crud.form.online"
            :active-value="1"
            :inactive-value="0"
            :disabled="crud.form.status === 0"
            inline-prompt
            active-text="在线接单"
            inactive-text="休息中"
          />
        </el-form-item>
        <el-form-item label="账号状态">
          <el-switch
            v-model="crud.form.status"
            :active-value="1"
            :inactive-value="0"
            inline-prompt
            active-text="启用"
            inactive-text="停用"
            @change="(v) => { if (!v) crud.form.online = 0 }"
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
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, RefreshLeft } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import ProTable from '@/components/ProTable.vue'
import StatusTag from '@/components/StatusTag.vue'
import { useTable } from '@/composables/useTable'
import { useCrud } from '@/composables/useCrud'
import { formatDateTime } from '@/utils/format'
import { ENABLE_STATUS_MAP, VEHICLES } from '@/constants/enums'
import api from '@/api'
import { riderRules, rulesForEdit } from './rules'

/** 站点列表（真实项目里应由字典接口提供） */
const AREAS = ['中关村站', '五道口站', '望京站', '国贸站', '西二旗站']

const onlineLoadingId = ref('')

const table = useTable(api.rider.page, {
  pageSize: 10,
  defaultQuery: { name: '', code: '', area: '', online: '', status: '' }
})

const crud = useCrud({
  create: api.rider.create,
  update: api.rider.update,
  remove: api.rider.remove,
  rules: riderRules,
  label: '骑手',
  toForm: (m) => ({ ...m })
})

const formRules = computed(() => (crud.isEdit.value ? rulesForEdit() : riderRules))

const AVATAR_COLORS = ['#1a4d8f', '#0f766e', '#b45309', '#7c3aed', '#c0392b', '#4a7c59']
const avatarColor = (name = '') => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]

async function onSubmit() {
  const ok = await crud.submit()
  if (ok) table.load()
}

async function onRemove(row) {
  const ok = await crud.confirmRemove(row, `确定删除骑手「${row.name}（${row.code}）」吗？`)
  if (ok) table.load()
}

async function onToggleStatus(row) {
  const next = row.status === 1 ? 0 : 1
  const label = next === 1 ? '启用' : '停用'
  if (next === 0) {
    try {
      await ElMessageBox.confirm(`停用后该骑手将不能接单，确定停用「${row.name}」吗？`, '停用确认', {
        type: 'warning'
      })
    } catch {
      return
    }
  }
  try {
    await api.rider.changeStatus(row.id, next)
    ElMessage.success(`已${label}`)
    table.load()
  } catch (e) {
    ElMessage.error(e?.message || '操作失败')
  }
}

/** 接单开关：乐观更新 + 失败回滚 */
async function onToggleOnline(row, next) {
  const prev = row.online
  onlineLoadingId.value = row.id
  row.online = next ? 1 : 0
  try {
    await api.rider.changeOnline(row.id, row.online)
    ElMessage.success(next ? '已上线接单' : '已置为休息')
  } catch (e) {
    row.online = prev
    ElMessage.error(e?.message || '操作失败')
  } finally {
    onlineLoadingId.value = ''
  }
}

/** formatDateTime 保留引用，模板里可能要用（避免 lint 报未使用） */
const _fmt = formatDateTime
</script>

<style scoped>
.rider-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rname {
  font-size: 13px;
  color: #1f2d3d;
  font-weight: 600;
}

.busy {
  color: #b45309;
  font-weight: 600;
}

.mb-12 {
  margin-bottom: 12px;
}
</style>
