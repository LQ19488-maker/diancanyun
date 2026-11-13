<template>
  <div class="shop-page">
    <!-- 搜索 -->
    <div class="search">
      <el-input
        v-model="keyword"
        placeholder="搜店铺、菜系，如 川菜 / 轻食"
        clearable
        :prefix-icon="Search"
        @keyup.enter="load"
        @clear="load"
      />
    </div>

    <div class="pad">
      <div class="banner">
        <div class="b-title">外卖配送 · 30 分钟送到</div>
        <div class="b-sub">下单后由骑手接单配送，可在订单详情查看实时进度</div>
      </div>

      <div v-if="loading">
        <div v-for="i in 4" :key="i" class="skeleton-block" style="height: 92px; margin-bottom: 10px" />
      </div>

      <el-empty v-else-if="!list.length" description="没有找到相关店铺" :image-size="70" />

      <div v-else>
        <div
          v-for="s in list"
          :key="s.id"
          class="shop-card"
          :class="{ closed: !s.openMenu || !s.status }"
          @click="onEnter(s)"
        >
          <el-image v-if="s.imageUrl" :src="s.imageUrl" fit="cover" class="logo" />
          <div class="info">
            <div class="line1">
              <span class="name">{{ s.name }}</span>
              <el-tag v-if="!s.status" size="small" type="info" effect="plain">休息中</el-tag>
              <el-tag v-else-if="!s.openMenu" size="small" type="warning" effect="plain">菜单接入中</el-tag>
            </div>
            <div class="line2">
              <span class="rate">★ {{ s.rating.toFixed(1) }}</span>
              <span class="sep">·</span>
              <span>月售 {{ s.monthlySales }}</span>
              <span class="sep">·</span>
              <span>{{ s.deliveryTime }} 分钟</span>
              <span class="sep">·</span>
              <span>{{ s.distance }}</span>
            </div>
            <div class="line3">
              <span>起送 ¥{{ s.minPrice }}</span>
              <span class="sep">|</span>
              <span>配送 ¥{{ s.deliveryFee }}</span>
              <span v-if="s.notice" class="notice">{{ s.notice }}</span>
            </div>
            <div class="tags">
              <span v-for="t in s.tags" :key="t" class="tag">{{ t }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import api from '@/api'
import { useCartStore } from '@/stores/cart'

const router = useRouter()
const cart = useCartStore()

const keyword = ref('')
const loading = ref(false)
const list = ref([])

async function load() {
  loading.value = true
  try {
    const res = await api.shop.shops({ keyword: keyword.value.trim(), page: 1, pageSize: 20 })
    list.value = res.list
  } catch (e) {
    ElMessage.error(e?.message || '店铺加载失败')
  } finally {
    loading.value = false
  }
}

/** 进店：只有接入菜单且营业中的店能点单，其余给出明确提示 */
function onEnter(s) {
  if (!s.status) {
    ElMessage.warning('该店铺休息中，暂不接单')
    return
  }
  if (!s.openMenu) {
    ElMessage.info('该店铺菜单还在接入中，先看看别家吧')
    return
  }
  cart.setShop(s)
  router.push('/h5/menu')
}

onMounted(load)
</script>

<style scoped>
.search {
  padding: 8px 12px;
  background: #fff;
}

.pad {
  padding: 12px 12px 76px;
}

.banner {
  border-radius: 10px;
  padding: 12px 14px;
  background: linear-gradient(120deg, #1a4d8f, #2f7bd6);
  color: #fff;
  margin-bottom: 12px;
}

.b-title {
  font-size: 14px;
  font-weight: 600;
}

.b-sub {
  margin-top: 4px;
  font-size: 11px;
  color: #d7e6fa;
}

.shop-card {
  display: flex;
  gap: 10px;
  background: #fff;
  border-radius: 10px;
  padding: 10px;
  margin-bottom: 10px;
  cursor: pointer;
}

.shop-card.closed {
  opacity: 0.72;
}

.logo {
  width: 62px;
  height: 62px;
  border-radius: 8px;
  flex: none;
}

.info {
  flex: 1;
  min-width: 0;
}

.line1 {
  display: flex;
  align-items: center;
  gap: 6px;
}

.name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2d3d;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.line2,
.line3 {
  margin-top: 4px;
  font-size: 11px;
  color: #8c93a1;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.rate {
  color: #e8833a;
  font-weight: 600;
}

.sep {
  color: #d6dbe5;
}

.notice {
  margin-left: 4px;
  color: #b45309;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 130px;
}

.tags {
  margin-top: 6px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag {
  padding: 1px 6px;
  border-radius: 4px;
  background: #f2f5fa;
  color: #6b7280;
  font-size: 10px;
}
</style>
