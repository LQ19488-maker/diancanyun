<template>
  <div class="page-wrap">
    <PageHeader title="员工管理" subtitle="账号、角色与启用状态；删除前会二次确认">
      <template #extra>
        <el-button type="primary" :icon="Plus" @click="crud.openCreate({ role: 'STAFF', status: 1 })">
          新增员工
        </el-button>
      </template>
    </PageHeader>

    <!-- 搜索区 -->
    <el-card shadow="never" class="mb-12">
      <el-form :model="table.query" inline @submit.prevent="table.search()">
        <el-form-item label="姓名">
          <el-input v-model="table.query.name" placeholder="按姓名模糊查询" clearable style="width: 160px" />
        </el-form-item>
        <el-form-item label="账号">
          <el-input v-model="table.query.username" placeholder="按账号模糊查询" clearable style="width: 160px" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="table.query.role" placeholder="全部" clearable style="width: 120px">
            <el-option label="管理员" value="ADMIN" />
            <el-option label="员工" value="STAFF" />
          </el-select>
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

    <!-- 列表 -->
    <ProTable
      :data="table.list.value"
      :loading="table.loading.value"
      :error="table.error.value"
      :total="table.total.value"
      :page="table.page.value"
      :page-size="table.size.value"
      empty-text="还没有员工，先新增一个吧"
      @page-change="table.handlePage"
      @size-change="table.handleSize"
      @retry="table.load()"
    >
      <el-table-column prop="username" label="账号" width="130" fixed />
      <el-table-column prop="name" label="姓名" width="110" />
      <el-table-column prop="phone" label="手机号" width="140" />
      <el-table-column label="角色" width="100">
        <template #default="{ row }">
          <el-tag :type="row.role === 'ADMIN' ? 'danger' : 'info'" size="small" effect="light">
            {{ row.role === 'ADMIN' ? '管理员' : '员工' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="120">
        <template #default="{ row }">
          <el-switch
            :model-value="row.status === 1"
            :loading="statusLoadingId === row.id"
            :disabled="row.username === 'admin'"
            inline-prompt
            active-text="启用"
            inactive-text="停用"
            @change="(v) => onToggleStatus(row, v)"
          />
        </template>
      </el-table-column>
      <el-table-column label="最后登录" width="170">
        <template #default="{ row }">
          <span class="text-muted">{{ formatDateTime(row.lastLoginTime, 'YYYY-MM-DD HH:mm') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="更新时间" min-width="160">
        <template #default="{ row }">
          <span class="text-muted">{{ formatDateTime(row.updateTime, 'YYYY-MM-DD HH:mm') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="crud.openEdit(row)">编辑</el-button>
          <el-button
            link
            type="danger"
            :disabled="row.username === 'admin'"
            @click="onRemove(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </ProTable>

    <!-- 新增 / 编辑 -->
    <el-dialog
      v-model="crud.visible.value"
      :title="crud.isEdit.value ? '编辑员工' : '新增员工'"
      width="480px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form
        ref="crud.formRef"
        :model="crud.form"
        :rules="formRules"
        label-width="86px"
        @submit.prevent
      >
        <el-form-item label="登录账号" prop="username">
          <el-input
            v-model="crud.form.username"
            :disabled="crud.isEdit.value"
            placeholder="字母开头，3–16 位"
          />
        </el-form-item>
        <el-form-item v-if="!crud.isEdit.value" label="初始密码" prop="password">
          <el-input v-model="crud.form.password" type="password" show-password placeholder="8–64 位" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="crud.form.name" placeholder="真实姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="crud.form.phone" maxlength="11" placeholder="11 位手机号" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-radio-group v-model="crud.form.role">
            <el-radio value="STAFF">员工</el-radio>
            <el-radio value="ADMIN">管理员</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="crud.form.status" :active-value="1" :inactive-value="0" inline-prompt
            active-text="启用" inactive-text="停用" />
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
import { ElMessage } from 'element-plus'
import { Plus, Search, RefreshLeft } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import ProTable from '@/components/ProTable.vue'
import { useTable } from '@/composables/useTable'
import { useCrud } from '@/composables/useCrud'
import { formatDateTime } from '@/utils/format'
import api from '@/api'
import { employeeRules, rulesForEdit } from './rules'

const statusLoadingId = ref('')

const table = useTable(api.employee.page, {
  pageSize: 10,
  defaultQuery: { name: '', username: '', role: '', status: '' }
})

const crud = useCrud({
  create: api.employee.create,
  update: api.employee.update,
  remove: api.employee.remove,
  rules: employeeRules,
  label: '员工',
  toForm: (m) => ({ ...m })
})

const formRules = computed(() => (crud.isEdit.value ? rulesForEdit() : employeeRules))

async function onSubmit() {
  const ok = await crud.submit()
  if (ok) table.search()
}

async function onRemove(row) {
  const ok = await crud.confirmRemove(row, `确定删除员工「${row.name}（${row.username}）」吗？`)
  if (ok) table.load()
}

/** 启停：先乐观更新界面，失败再回滚，避免等了 800ms 才变色 */
async function onToggleStatus(row, next) {
  const prev = row.status
  statusLoadingId.value = row.id
  row.status = next ? 1 : 0
  try {
    await api.employee.changeStatus(row.id, row.status)
    ElMessage.success(next ? '已启用' : '已停用')
  } catch (e) {
    row.status = prev
    ElMessage.error(e?.message || '操作失败')
  } finally {
    statusLoadingId.value = ''
  }
}
</script>
