<template>
  <div class="cart-page">
    <el-empty v-if="cart.isEmpty" description="购物车还是空的" :image-size="80">
      <el-button type="primary" @click="router.push('/h5/shop')">去逛逛</el-button>
    </el-empty>

    <template v-else>
      <div class="pad">
        <div v-if="cart.shop" class="shop-line">
          <span class="s-ico">🏪</span>
          <span class="s-name">{{ cart.shop.name }}</span>
          <el-button link type="primary" size="small" @click="router.push('/h5/shop')">切换</el-button>
        </div>

        <div class="section-title">
          已选 {{ cart.items.length }} 种 / 共 {{ cart.totalCount }} 份
          <el-button link type="danger" size="small" @click="onClear">清空</el-button>
        </div>

        <div v-for="it in cart.items" :key="it.key" class="line">
          <el-image v-if="it.image" :src="it.image" fit="cover" class="thumb" />
          <div class="info">
            <div class="name">{{ it.name }}</div>
            <div v-if="Object.keys(it.selection || {}).length" class="sel">
              {{ Object.entries(it.selection).map(([k, v]) => `${k}:${v}`).join('　') }}
            </div>
            <div class="row">
              <span class="price">¥{{ (it.price * it.quantity).toFixed(2) }}</span>
              <div class="qty">
                <el-button circle size="small" :icon="Minus" @click="cart.dec(it.key)" />
                <span class="num">{{ it.quantity }}</span>
                <el-button circle size="small" :icon="Plus" @click="cart.inc(it.key)" />
              </div>
            </div>
          </div>
        </div>

        <div class="remark">
          <div class="section-title">备注</div>
          <el-input
            v-model="remark"
            type="textarea"
            :rows="2"
            maxlength="60"
            show-word-limit
            placeholder="口味偏好、忌口等（可留空）"
          />
        </div>

        <div class="amounts">
          <div class="a-line">
            <span>菜品小计</span>
            <span class="num">¥{{ cart.totalAmount.toFixed(2) }}</span>
          </div>
          <div class="a-line">
            <span>配送费</span>
            <span class="num">¥{{ cart.deliveryFee.toFixed(2) }}</span>
          </div>
        </div>

        <div v-if="cart.minGap > 0" class="gap-tip">
          还差 ¥{{ cart.minGap.toFixed(2) }} 起送（起送价 ¥{{ cart.minPrice }}）
        </div>
      </div>

      <div class="foot">
        <div class="sum">
          <span class="text-muted">合计</span>
          <span class="total">¥{{ cart.payableAmount.toFixed(2) }}</span>
        </div>
        <el-button type="primary" size="large" :disabled="!cart.canSubmit" @click="goConfirm">去下单</el-button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Minus } from '@element-plus/icons-vue'
import { useCartStore } from '@/stores/cart'

const router = useRouter()
const cart = useCartStore()
const remark = ref(localStorage.getItem('dcy_h5_remark') || '')

async function onClear() {
  try {
    await ElMessageBox.confirm('确定要清空购物车吗？', '提示', { type: 'warning' })
  } catch {
    return
  }
  cart.clear()
  ElMessage.success('已清空')
}

function goConfirm() {
  if (cart.minGap > 0) {
    ElMessage.warning(`还差 ¥${cart.minGap.toFixed(2)} 才到起送价`)
    return
  }
  localStorage.setItem('dcy_h5_remark', remark.value)
  router.push('/h5/confirm')
}
</script>

<style scoped>
.pad {
  padding: 12px 12px 96px;
}

.shop-line {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #fff;
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 10px;
  font-size: 13px;
}

.s-ico {
  font-size: 16px;
}

.s-name {
  flex: 1;
  min-width: 0;
  font-weight: 600;
  color: #1f2d3d;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
}

.line {
  display: flex;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f2f4f8;
}

.thumb {
  width: 62px;
  height: 62px;
  border-radius: 8px;
  flex: none;
}

.info {
  flex: 1;
  min-width: 0;
}

.name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2d3d;
}

.sel {
  margin-top: 2px;
  font-size: 11px;
  color: #b45309;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
}

.price {
  color: #c0392b;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.qty {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qty .num {
  min-width: 18px;
  text-align: center;
  font-size: 14px;
}

.remark {
  margin-top: 16px;
}

.amounts {
  margin-top: 14px;
  background: #fff;
  border-radius: 10px;
  padding: 10px 12px;
}

.a-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: #6b7280;
  padding: 3px 0;
}

.a-line .num {
  color: #1f2d3d;
  font-variant-numeric: tabular-nums;
}

.gap-tip {
  margin-top: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  background: #fdf4e7;
  color: #b45309;
  font-size: 12px;
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
