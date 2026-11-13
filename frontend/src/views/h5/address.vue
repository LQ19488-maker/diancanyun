<template>
  <div class="addr-page">
    <div class="pad">
      <div class="section-title">
        收货地址
        <el-button link type="primary" size="small" :icon="Plus" @click="openCreate">新增</el-button>
      </div>

      <div v-if="loading">
        <div v-for="i in 2" :key="i" class="skeleton-block" style="height: 68px; margin-bottom: 10px" />
      </div>

      <el-empty v-else-if="!list.length" description="还没有收货地址" :image-size="70">
        <el-button type="primary" @click="openCreate">添加地址</el-button>
      </el-empty>

      <div v-else>
        <div
          v-for="a in list"
          :key="a.id"
          class="addr-card"
          :class="{ picked: selecting && pickedId === a.id }"
          @click="onPick(a)"
        >
          <div class="top">
            <el-tag v-if="a.tag" size="small" effect="plain">{{ a.tag }}</el-tag>
            <span class="name">{{ a.name }}</span>
            <span class="phone">{{ a.phone }}</span>
            <el-tag v-if="a.isDefault" size="small" type="success" effect="plain">默认</el-tag>
          </div>
          <div class="detail">{{ a.detail }}</div>
          <div class="ops">
            <el-button v-if="!a.isDefault" link type="primary" size="small" @click.stop="onSetDefault(a)">
              设为默认
            </el-button>
            <el-button link type="primary" size="small" @click.stop="openEdit(a)">编辑</el-button>
            <el-button link type="danger" size="small" @click.stop="onRemove(a)">删除</el-button>
          </div>
        </div>
      </div>

      <div v-if="selecting" class="hint">点击地址即可选中并返回下单页</div>
    </div>

    <!-- 新增 / 编辑 -->
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑地址' : '新增地址'" width="90%" align-center>
      <div class="form">
        <div class="row">
          <span class="label">联系人</span>
          <el-input v-model="form.name" size="small" placeholder="收货人姓名" />
        </div>
        <div class="row">
          <span class="label">手机号</span>
          <el-input v-model="form.phone" size="small" maxlength="11" placeholder="11 位手机号" />
        </div>
        <div class="row">
          <span class="label">标签</span>
          <el-select v-model="form.tag" size="small" style="width: 110px">
            <el-option v-for="t in TAGS" :key="t" :label="t" :value="t" />
          </el-select>
        </div>
        <div class="row top">
          <span class="label">详细地址</span>
          <el-input
            v-model="form.detail"
            size="small"
            type="textarea"
            :rows="2"
            placeholder="小区 / 写字楼 + 门牌号"
          />
        </div>
        <div class="row">
          <span class="label">设为默认</span>
          <el-switch v-model="form.isDefault" />
        </div>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="onSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import api from '@/api'
import { useCartStore } from '@/stores/cart'

const route = useRoute()
const router = useRouter()
const cart = useCartStore()

const TAGS = ['家', '公司', '学校', '其他']

/** ?select=1 表示从下单页过来挑地址，点一下选中就返回 */
const selecting = ref(route.query.select === '1')
const pickedId = ref(cart.address?.id || '')

const loading = ref(false)
const saving = ref(false)
const list = ref([])
const dialogVisible = ref(false)
const form = ref(emptyForm())

function emptyForm() {
  return { id: '', name: '', phone: '', tag: '家', detail: '', isDefault: false }
}

async function load() {
  loading.value = true
  try {
    const res = await api.shop.addresses()
    list.value = res.list
    // 没有选过地址时，默认用「默认地址」，省掉用户一次点击
    if (!cart.address) {
      const def = res.list.find((a) => a.isDefault) || res.list[0]
      if (def) cart.setAddress(def)
    }
  } catch (e) {
    ElMessage.error(e?.message || '地址加载失败')
  } finally {
    loading.value = false
  }
}

function openCreate() {
  form.value = emptyForm()
  dialogVisible.value = true
}

function openEdit(a) {
  form.value = { ...a }
  dialogVisible.value = true
}

async function onSave() {
  if (!form.value.name.trim()) return ElMessage.warning('请填写联系人')
  if (!/^1\d{10}$/.test(form.value.phone.trim())) return ElMessage.warning('请填写正确的手机号')
  if (!form.value.detail.trim()) return ElMessage.warning('请填写详细地址')

  saving.value = true
  try {
    const payload = {
      id: form.value.id || undefined,
      name: form.value.name.trim(),
      phone: form.value.phone.trim(),
      tag: form.value.tag,
      detail: form.value.detail.trim(),
      isDefault: form.value.isDefault ? 1 : 0
    }
    if (form.value.id) await api.shop.updateAddress(payload)
    else await api.shop.createAddress(payload)
    ElMessage.success('已保存')
    dialogVisible.value = false
    await load()
  } catch (e) {
    ElMessage.error(e?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

async function onSetDefault(a) {
  try {
    await api.shop.setDefaultAddress(a.id)
    ElMessage.success('已设为默认地址')
    await load()
  } catch (e) {
    ElMessage.error(e?.message || '设置失败')
  }
}

async function onRemove(a) {
  try {
    await ElMessageBox.confirm(`确定删除「${a.detail}」吗？`, '删除地址', { type: 'warning' })
  } catch {
    return
  }
  try {
    await api.shop.removeAddress(a.id)
    if (cart.address?.id === a.id) cart.setAddress(null)
    ElMessage.success('已删除')
    await load()
  } catch (e) {
    ElMessage.error(e?.message || '删除失败')
  }
}

function onPick(a) {
  cart.setAddress(a)
  if (selecting.value) {
    ElMessage.success('已选择收货地址')
    router.back()
  }
}

onMounted(load)
</script>

<style scoped>
.pad {
  padding: 12px 12px 76px;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 10px;
}

.addr-card {
  background: #fff;
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 10px;
  border: 1px solid transparent;
  cursor: pointer;
}

.addr-card.picked {
  border-color: #1a4d8f;
  background: #f4f8fd;
}

.top {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.name {
  font-weight: 600;
  color: #1f2d3d;
}

.phone {
  color: #6b7280;
}

.detail {
  margin-top: 6px;
  font-size: 12px;
  color: #4b5563;
  line-height: 1.5;
}

.ops {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  border-top: 1px solid #f5f7fa;
  padding-top: 6px;
}

.hint {
  margin-top: 8px;
  text-align: center;
  font-size: 11px;
  color: #9aa3b2;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.row.top {
  align-items: flex-start;
}

.label {
  font-size: 13px;
  color: #6b7280;
  flex: none;
  width: 62px;
}
</style>
