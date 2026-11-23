<template>
  <div class="menu-page">
    <!-- 店铺头：名称、评分、起送/配送/时长 -->
    <div v-if="cart.shop" class="shop-bar" @click="router.push('/h5/shop')">
      <div class="s-line1">
        <span class="s-name">{{ cart.shop.name }}</span>
        <span class="s-more">切换店铺 ›</span>
      </div>
      <div class="s-line2">
        <span>起送 ¥{{ cart.minPrice }}</span>
        <span class="sep">|</span>
        <span>配送 ¥{{ cart.deliveryFee }}</span>
        <span class="sep">|</span>
        <span>约 {{ cart.shop.deliveryTime }} 分钟</span>
      </div>
    </div>

    <!-- 分类竖排 + 菜品列表 -->
    <div class="body">
      <aside class="rail">
        <div v-if="combos.length" class="rail-item" :class="{ on: activeId === COMBO_TAB }" @click="activeId = COMBO_TAB">
          超值套餐
        </div>
        <div
          v-for="c in categories"
          :key="c.id"
          class="rail-item"
          :class="{ on: c.id === activeId }"
          @click="activeId = c.id"
        >
          {{ c.name }}
        </div>
      </aside>

      <section class="list">
        <div v-if="loading" class="pad">
          <div v-for="i in 4" :key="i" class="skeleton-block" style="height: 76px; margin-bottom: 10px" />
        </div>

        <!-- 团购套餐 -->
        <div v-else-if="activeId === COMBO_TAB" class="pad">
          <el-empty v-if="!combos.length" description="这家店暂时没有团购套餐" :image-size="70" />
          <div v-for="c in combos" :key="c.id" class="dish combo">
            <el-image v-if="c.imageUrl" :src="c.imageUrl" fit="cover" class="thumb" />
            <div class="info">
              <div class="name">
                {{ c.name }}
                <el-tag size="small" type="danger" effect="plain" class="combo-tag">团购</el-tag>
              </div>
              <div class="desc">{{ c.dishNames.join('、') }}</div>
              <div class="flavor">含 {{ c.dishCount }} 道菜，比单点省 ¥{{ c.save.toFixed(2) }}</div>
              <div class="row">
                <span class="price">
                  ¥{{ c.price.toFixed(2) }}
                  <i class="origin">¥{{ c.originPrice.toFixed(2) }}</i>
                </span>
                <el-button type="primary" circle size="small" :icon="Plus" @click="onAddCombo(c)" />
              </div>
            </div>
          </div>
        </div>

        <el-empty v-else-if="!dishes.length" description="这家店暂时没有在售菜品" :image-size="70" />
        <div v-else class="pad">
          <div v-for="d in dishes" :key="d.id" class="dish">
            <el-image v-if="d.imageUrl" :src="d.imageUrl" fit="cover" class="thumb" />
            <div class="info">
              <div class="name">{{ d.name }}</div>
              <div class="desc">{{ d.description || '现点现做' }}</div>
              <div class="flavor" v-if="d.flavors.length">
                {{ d.flavors.map((f) => f.name).join(' / ') }} 可选
              </div>
              <div class="row">
                <span class="price">¥{{ d.price.toFixed(2) }}</span>
                <el-button type="primary" circle size="small" :icon="Plus" @click="onAdd(d)" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- 悬浮购物车条 -->
    <div class="cart-bar" :class="{ empty: cart.isEmpty }">
      <div class="left" @click="router.push('/h5/cart')">
        <span class="cart-ico">🛒</span>
        <span v-if="cart.totalCount" class="count">{{ cart.totalCount }}</span>
        <span class="amount">¥{{ cart.totalAmount.toFixed(2) }}</span>
        <span v-if="cart.isEmpty" class="tip">还没点菜</span>
        <span v-else-if="cart.minGap > 0" class="tip">差 ¥{{ cart.minGap.toFixed(2) }} 起送</span>
      </div>
      <el-button type="primary" :disabled="!cart.canSubmit" @click="router.push('/h5/cart')">去结算</el-button>
    </div>

    <!-- 规格/口味选择 -->
    <el-dialog v-model="specVisible" :title="specDish?.name" width="360px" align-center class="spec-dialog">
      <div v-if="specDish" class="spec">
        <div v-for="f in specDish.flavors" :key="f.name" class="spec-group">
          <div class="spec-name">{{ f.name }}</div>
          <div class="chips">
            <span
              v-for="v in f.values"
              :key="v"
              class="chip"
              :class="{ on: selection[f.name] === v }"
              @click="selection[f.name] = v"
            >
              {{ v }}
            </span>
          </div>
        </div>

        <div class="qty">
          <span>数量</span>
          <el-input-number v-model="quantity" :min="1" :max="20" size="small" />
        </div>
      </div>
      <template #footer>
        <el-button @click="specVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAdd">
          加入购物车 ¥{{ ((specDish?.price || 0) * quantity).toFixed(2) }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import api from '@/api'
import { useCartStore } from '@/stores/cart'

const router = useRouter()
const cart = useCartStore()

const loading = ref(false)
const categories = ref([])
const allDishes = ref([])
const combos = ref([])
const activeId = ref('')

/** 虚拟分类：团购套餐不占真实分类，排在最上面 */
const COMBO_TAB = '__combo__'

const specVisible = ref(false)
const specDish = ref(null)
const selection = ref({})
const quantity = ref(1)

const dishes = computed(() => allDishes.value.filter((d) => d.categoryId === activeId.value))

async function load() {
  loading.value = true
  try {
    // 没选过店铺（比如直接访问 #/h5/menu）就回店铺列表挑一家
    if (!cart.shop) {
      const res = await api.shop.shops({ page: 1, pageSize: 1 })
      const first = res.list.find((s) => s.status && s.openMenu)
      if (first) cart.setShop(first)
      else {
        ElMessage.warning('暂时没有营业中的店铺')
        router.replace('/h5/shop')
        return
      }
    }
    const { categories: cats, dishes: list, combos: comboList } = await api.h5.menu({ shopId: cart.shop?.id })
    categories.value = cats
    allDishes.value = list
    combos.value = comboList || []
    // 默认选中第一个"有菜"的分类；这家店有团购套餐就先进套餐页
    const firstWithDish = cats.find((c) => list.some((d) => d.categoryId === c.id))
    activeId.value = combos.value.length ? COMBO_TAB : (firstWithDish || cats[0])?.id || ''
  } catch (e) {
    ElMessage.error(e?.message || '菜单加载失败')
  } finally {
    loading.value = false
  }
}

function onAdd(dish) {
  if (!dish.flavors.length) {
    cart.add(dish, {}, 1)
    ElMessage.success(`已加入 ${dish.name}`)
    return
  }
  specDish.value = dish
  quantity.value = 1
  // 每个口味默认选第一个值，减少用户点击
  const sel = {}
  dish.flavors.forEach((f) => {
    if (f.values.length) sel[f.name] = f.values[0]
  })
  selection.value = sel
  specVisible.value = true
}

function confirmAdd() {
  if (!specDish.value) return
  cart.add(specDish.value, { ...selection.value }, quantity.value)
  ElMessage.success(`已加入 ${specDish.value.name}`)
  specVisible.value = false
}

/** 团购套餐一次就是一整套，不做口味选择 */
function onAddCombo(combo) {
  cart.addCombo(combo, 1)
  ElMessage.success(`已加入 ${combo.name}`)
}

onMounted(load)
</script>

<style scoped>
.menu-page {
  display: flex;
  flex-direction: column;
}

.shop-bar {
  background: #fff;
  padding: 8px 12px;
  border-bottom: 1px solid #eef1f6;
  cursor: pointer;
}

.s-line1 {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.s-name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2d3d;
}

.s-more {
  font-size: 11px;
  color: #1a4d8f;
}

.s-line2 {
  margin-top: 3px;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: #8c93a1;
}

.sep {
  color: #d6dbe5;
}

.body {
  display: flex;
  min-height: calc(100vh - 190px);
}

.rail {
  width: 92px;
  flex: none;
  background: #eef1f6;
}

.rail-item {
  padding: 14px 8px;
  font-size: 13px;
  color: #4b5563;
  text-align: center;
  cursor: pointer;
  border-left: 3px solid transparent;
}

.rail-item.on {
  background: #fff;
  color: #1a4d8f;
  font-weight: 600;
  border-left-color: #1a4d8f;
}

.list {
  flex: 1;
  min-width: 0;
  background: #fff;
}

.pad {
  padding: 10px 12px 90px;
}

.dish {
  display: flex;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f2f4f8;
}

.thumb {
  width: 76px;
  height: 76px;
  border-radius: 8px;
  flex: none;
}

.info {
  flex: 1;
  min-width: 0;
}

.name {
  font-size: 15px;
  font-weight: 600;
  color: #1f2d3d;
}

.desc {
  margin-top: 2px;
  font-size: 12px;
  color: #9aa3b2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flavor {
  margin-top: 2px;
  font-size: 11px;
  color: #b45309;
}

.combo-tag {
  margin-left: 4px;
  vertical-align: middle;
}

.origin {
  margin-left: 4px;
  font-size: 11px;
  font-weight: 400;
  color: #9aa3b2;
  text-decoration: line-through;
  font-style: normal;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
}

.price {
  color: #c0392b;
  font-weight: 600;
  font-size: 15px;
  font-variant-numeric: tabular-nums;
}

.cart-bar {
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

.cart-bar.empty {
  opacity: 0.92;
}

.left {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  cursor: pointer;
}

.cart-ico {
  font-size: 22px;
}

.count {
  position: absolute;
  top: -6px;
  left: 16px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: #e8833a;
  color: #fff;
  font-size: 10px;
  line-height: 16px;
  text-align: center;
}

.amount {
  font-size: 16px;
  font-weight: 600;
  color: #c0392b;
  font-variant-numeric: tabular-nums;
}

.tip {
  font-size: 12px;
  color: #9aa3b2;
}

.spec-group {
  margin-bottom: 12px;
}

.spec-name {
  font-size: 13px;
  color: #4b5563;
  margin-bottom: 6px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  padding: 4px 12px;
  border: 1px solid #dde3ec;
  border-radius: 14px;
  font-size: 12px;
  color: #4b5563;
  cursor: pointer;
}

.chip.on {
  border-color: #1a4d8f;
  background: #eef4fc;
  color: #1a4d8f;
  font-weight: 600;
}

.qty {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: #4b5563;
  margin-top: 4px;
}
</style>
