<template>
  <div class="workbench">
    <!-- 今日概览 -->
    <div class="cards">
      <div class="card">
        <div class="k">今日完成</div>
        <div class="v num">{{ stats.todayDone || 0 }}<span class="u">单</span></div>
      </div>
      <div class="card">
        <div class="k">在途</div>
        <div class="v num">{{ stats.onTheWay || 0 }}<span class="u">单</span></div>
      </div>
      <div class="card">
        <div class="k">累计收入</div>
        <div class="v num">¥{{ Number(stats.income || 0).toFixed(2) }}</div>
      </div>
      <div class="card">
        <div class="k">评分</div>
        <div class="v num">{{ Number(stats.rating || 5).toFixed(1) }}</div>
      </div>
    </div>

    <div class="section-title">
      可抢订单
      <span class="count">{{ list.length }}</span>
    </div>

    <div v-if="loading" class="pad">
      <div v-for="i in 3" :key="i" class="skeleton-block" style="height: 88px; margin-bottom: 10px" />
    </div>

    <el-empty v-else-if="!list.length" description="暂时没有可抢的单，稍等一下" :image-size="70" />

    <div v-else class="pad">
      <div v-for="o in list" :key="o.id" class="task">
        <div class="task-head">
          <span class="no">#{{ o.orderNo.slice(-6) }}</span>
          <span class="dist">{{ o.shopName || '外卖配送' }}</span>
        </div>
        <div class="addr">📍 {{ o.address || '—' }}</div>
        <div class="items">{{ summary(o) }}</div>
        <div class="task-foot">
          <div class="money">
            <span class="fee">配送费 ¥{{ o.deliveryFee.toFixed(2) }}</span>
            <span class="text-muted">　{{ timeAgo(o.createdAt) }}</span>
          </div>
          <el-button
            type="primary"
            size="small"
            :loading="grabbingId === o.id"
            :disabled="!online"
            @click="onGrab(o)"
          >
            抢单
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { request } from '@/api/http'
import { riderUrl } from '@/api/urls'
import { useRiderStore } from '@/stores/rider'
import { toModel as orderToModel, summary } from '@/api/adapters/order'

const router = useRouter()
const riderStore = useRiderStore()

const loading = ref(false)
const list = ref([])
const grabbingId = ref('')
/** 直接跟着 store 走：store 加载完卡片自动刷新，不用手动赋值 */
const stats = computed(() => riderStore.stats || {})
/** 休息中的骑手不能抢单：按钮置灰，点了也不会发请求 */
const online = computed(() => Number(riderStore.profile?.online ?? 1) === 1)

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return '刚刚'
  if (m < 60) return `${m} 分钟前`
  return `${Math.floor(m / 60)} 小时前`
}

async function load() {
  loading.value = true
  try {
    const d = await request({ url: riderUrl('/tasks'), method: 'get', params: { page: 1, pageSize: 20 } })
    list.value = (d?.records || []).map(orderToModel)
  } catch (e) {
    ElMessage.error(e?.message || '订单加载失败')
  } finally {
    loading.value = false
  }
}

async function onGrab(order) {
  grabbingId.value = order.id
  try {
    await riderStore.grab(order.id)
    ElMessage.success('抢单成功，去「我的配送」查看')
    await load()
  } catch (e) {
    ElMessage.error(e?.message || '抢单失败')
  } finally {
    grabbingId.value = ''
  }
}

onMounted(load)
</script>

<style scoped>
.cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 12px;
}

.card {
  background: #fff;
  border-radius: 10px;
  padding: 10px 8px;
  text-align: center;
}

.k {
  font-size: 11px;
  color: #9aa3b2;
}

.v {
  margin-top: 4px;
  font-size: 17px;
  font-weight: 700;
  color: #1f2d3d;
}

.u {
  font-size: 11px;
  font-weight: 400;
  color: #9aa3b2;
  margin-left: 2px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 14px 0;
  font-size: 13px;
  color: #6b7280;
}

.count {
  min-width: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: #eef1f6;
  color: #6b7280;
  font-size: 11px;
  line-height: 16px;
  text-align: center;
}

.pad {
  padding: 10px 12px 20px;
}

.task {
  background: #fff;
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 10px;
}

.task-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.no {
  font-size: 13px;
  font-weight: 600;
  color: #1f2d3d;
}

.dist {
  font-size: 11px;
  color: #1a4d8f;
  background: #eef4fc;
  padding: 1px 6px;
  border-radius: 8px;
}

.addr {
  margin-top: 8px;
  font-size: 13px;
  color: #374151;
  line-height: 1.5;
}

.items {
  margin-top: 4px;
  font-size: 12px;
  color: #9aa3b2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
}

.fee {
  font-size: 13px;
  font-weight: 600;
  color: #c0392b;
}
</style>
