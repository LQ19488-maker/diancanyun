<template>
  <div class="confirm-page">
    <div class="pad">
      <div class="card">
        <div class="row">
          <span class="label">桌号</span>
          <el-input v-model="tableNo" size="small" style="width: 130px" @change="onTableChange" />
        </div>
        <div class="row">
          <span class="label">备注</span>
          <el-input v-model="remark" size="small" placeholder="口味偏好、忌口" />
        </div>
      </div>

      <div class="card">
        <div class="section-title">订单明细</div>
        <div v-for="it in cart.items" :key="it.key" class="line">
          <span class="n">{{ it.name }}<i v-if="Object.keys(it.selection || {}).length" class="sel">
            {{ Object.entries(it.selection).map(([k, v]) => `${k}:${v}`).join(' ') }}</i></span>
          <span class="q num">×{{ it.quantity }}</span>
          <span class="a num">¥{{ (it.price * it.quantity).toFixed(2) }}</span>
        </div>
        <div class="amounts">
          <div class="line total">
            <span>合计</span>
            <span class="num">¥{{ cart.totalAmount.toFixed(2) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="foot">
      <div class="sum">
        <span class="text-muted">应付</span>
        <span class="total">¥{{ cart.totalAmount.toFixed(2) }}</span>
      </div>
      <el-button type="primary" size="large" :loading="submitting" @click="onSubmit">提交订单</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/api'
import { useCartStore } from '@/stores/cart'

const router = useRouter()
const cart = useCartStore()

const tableNo = ref(cart.tableNo)
const remark = ref(localStorage.getItem('dcy_h5_remark') || '')
const submitting = ref(false)

function onTableChange(v) {
  cart.setTable(v || '3 号桌')
}

async function onSubmit() {
  if (cart.isEmpty) {
    ElMessage.warning('购物车是空的')
    router.replace('/h5/menu')
    return
  }
  submitting.value = true
  try {
    const payload = cart.toOrderPayload(remark.value)
    const order = await api.h5.submit(payload)
    cart.clear()
    localStorage.removeItem('dcy_h5_remark')
    ElMessage.success('下单成功')
    router.replace(`/h5/order/${order.id}`)
  } catch (e) {
    ElMessage.error(e?.message || '下单失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.pad {
  padding: 12px 12px 96px;
}

.card {
  background: #fff;
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 12px;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 4px 0;
}

.label {
  font-size: 13px;
  color: #6b7280;
}

.section-title {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
}

.line {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid #f5f7fa;
  font-size: 13px;
}

.n {
  flex: 1;
  min-width: 0;
  color: #1f2d3d;
}

.sel {
  display: block;
  margin-top: 2px;
  font-size: 11px;
  color: #b45309;
  font-style: normal;
}

.q {
  width: 40px;
  text-align: right;
  color: #6b7280;
}

.a {
  width: 74px;
  text-align: right;
  color: #1f2d3d;
}

.amounts {
  margin-top: 8px;
}

.line.total {
  border: none;
  font-size: 15px;
  font-weight: 600;
  color: #c0392b;
}

.foot {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: 56px;
  width: 100%;
  max-width: 480px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 12px;
  background: #fff;
  border-top: 1px solid #eef1f6;
  box-shadow: 0 -4px 12px rgba(31, 45, 61, 0.06);
  z-index: 15;
}

.sum {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.total {
  font-size: 18px;
  font-weight: 700;
  color: #c0392b;
  font-variant-numeric: tabular-nums;
}
</style>
