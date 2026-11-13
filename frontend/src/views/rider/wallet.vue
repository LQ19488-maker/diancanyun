<template>
  <div class="mine-page">
    <!-- 余额 -->
    <div class="balance-card">
      <div class="b-label">可提现余额（元）</div>
      <div class="b-amount">{{ Number(wallet?.balance || 0).toFixed(2) }}</div>
      <div class="b-foot">
        <span>累计收入 ¥{{ Number(wallet?.totalIncome || 0).toFixed(2) }}</span>
        <span>已提现 ¥{{ Number(wallet?.withdrawn || 0).toFixed(2) }}</span>
      </div>
      <el-button type="primary" class="b-btn" :disabled="!canWithdraw" @click="openWithdraw">
        提现
      </el-button>
    </div>

    <!-- 今日收入明细 -->
    <div class="card">
      <div class="card-title">今日收入</div>
      <div class="rows">
        <div class="row">
          <span class="k">完成单量</span>
          <span class="v">{{ stats.todayDone || 0 }} 单</span>
        </div>
        <div class="row">
          <span class="k">基础配送费</span>
          <span class="v">¥{{ Number(basePrice).toFixed(2) }} / 单</span>
        </div>
        <div class="row">
          <span class="k">
            天气补贴
            <i v-if="wallet?.subsidyPer" class="tag">+¥{{ wallet.subsidyPer }}/单</i>
          </span>
          <span class="v" :class="{ plus: Number(wallet?.todaySubsidy || 0) > 0 }">
            ¥{{ Number(wallet?.todaySubsidy || 0).toFixed(2) }}
          </span>
        </div>
        <div class="row total">
          <span class="k">今日合计</span>
          <span class="v">¥{{ Number(wallet?.todayIncome || 0).toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <!-- 骑手信息 -->
    <div class="card">
      <div class="card-title">骑手信息</div>
      <div class="rows">
        <div class="row">
          <span class="k">姓名 / 工号</span>
          <span class="v">{{ rider.profile?.name || '—' }}　{{ rider.profile?.code || '' }}</span>
        </div>
        <div class="row">
          <span class="k">所属站点</span>
          <span class="v">{{ rider.profile?.area || '—' }}</span>
        </div>
        <div class="row">
          <span class="k">接单状态</span>
          <span class="v">{{ Number(rider.profile?.online) === 1 ? '接单中' : '休息中' }}</span>
        </div>
        <div class="row">
          <span class="k">评分</span>
          <span class="v">{{ Number(stats.rating || 5).toFixed(1) }}</span>
        </div>
      </div>
    </div>

    <!-- 提现记录 -->
    <div class="card">
      <div class="card-title">
        提现记录
        <span class="count">{{ records.length }} 笔</span>
      </div>
      <div v-if="loading" class="skeleton-block" style="height: 60px" />
      <el-empty v-else-if="!records.length" description="还没有提现记录" :image-size="60" />
      <div v-else>
        <div v-for="r in records" :key="r.id" class="record">
          <div class="r-left">
            <div class="r-channel">{{ r.channel }}</div>
            <div class="r-time">{{ formatDateTime(r.createdAt, 'MM-DD HH:mm') }}</div>
          </div>
          <div class="r-right">
            <div class="r-amount">-¥{{ Number(r.amount).toFixed(2) }}</div>
            <el-tag size="small" type="success" effect="plain">已到账</el-tag>
          </div>
        </div>
      </div>
    </div>

    <!-- 提现弹窗 -->
    <el-dialog v-model="dialogVisible" title="提现" width="88%" align-center>
      <div class="form">
        <div class="form-row">
          <span class="label">提现金额</span>
          <el-input v-model="amount" size="small" placeholder="最低 1 元">
            <template #prefix>¥</template>
          </el-input>
        </div>
        <div class="quick">
          <span class="chip" @click="amount = String(wallet?.balance || 0)">全部提现</span>
          <span v-for="v in QUICK" :key="v" class="chip" @click="amount = String(v)">{{ v }} 元</span>
        </div>
        <div class="form-row">
          <span class="label">到账方式</span>
          <el-select v-model="channel" size="small" style="width: 130px">
            <el-option v-for="c in CHANNELS" :key="c" :label="c" :value="c" />
          </el-select>
        </div>
        <div class="tip">
          可提现 ¥{{ Number(wallet?.balance || 0).toFixed(2) }}，提现后 1 个工作日内到账（演示环境即时到账）
        </div>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="onWithdraw">确认提现</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { formatDateTime } from '@/utils/format'
import { useRiderStore } from '@/stores/rider'

const CHANNELS = ['微信零钱', '支付宝', '银行卡']
const QUICK = [50, 100, 200]

const rider = useRiderStore()
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const amount = ref('')
const channel = ref(CHANNELS[0])

const wallet = computed(() => rider.wallet)
const stats = computed(() => rider.stats || {})
const records = computed(() => wallet.value?.records || [])
const basePrice = computed(() => Number(wallet.value?.basePrice || 5))
const canWithdraw = computed(() => Number(wallet.value?.balance || 0) >= 1)

async function load() {
  loading.value = true
  try {
    await rider.loadWallet()
  } catch (e) {
    ElMessage.error(e?.message || '钱包加载失败')
  } finally {
    loading.value = false
  }
}

function openWithdraw() {
  amount.value = Number(wallet.value?.balance || 0).toFixed(2)
  dialogVisible.value = true
}

async function onWithdraw() {
  const val = Number(amount.value)
  if (!val || val <= 0) return ElMessage.warning('请输入提现金额')
  if (val < 1) return ElMessage.warning('单次最少提现 ¥1')
  if (val > Number(wallet.value?.balance || 0)) return ElMessage.warning('超过可提现余额')
  submitting.value = true
  try {
    await rider.withdraw(val, channel.value)
    ElMessage.success(`已提交提现 ¥${val.toFixed(2)}，将转入${channel.value}`)
    dialogVisible.value = false
  } catch (e) {
    ElMessage.error(e?.message || '提现失败')
  } finally {
    submitting.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.mine-page {
  padding: 12px 12px 76px;
}

.balance-card {
  position: relative;
  border-radius: 12px;
  padding: 16px 14px;
  background: linear-gradient(135deg, #1f2d3d, #2f5a8f);
  color: #fff;
  margin-bottom: 12px;
}

.b-label {
  font-size: 11px;
  color: #c3d1e2;
}

.b-amount {
  margin-top: 6px;
  font-size: 30px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.5px;
}

.b-foot {
  margin-top: 6px;
  display: flex;
  gap: 14px;
  font-size: 11px;
  color: #c3d1e2;
}

.b-btn {
  position: absolute;
  right: 14px;
  bottom: 16px;
  border: none;
}

.card {
  background: #fff;
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 12px;
}

.card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 600;
  color: #1f2d3d;
  margin-bottom: 8px;
}

.count {
  font-size: 11px;
  font-weight: 400;
  color: #9aa3b2;
}

.rows .row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 13px;
  border-bottom: 1px solid #f5f7fa;
}

.rows .row:last-child {
  border-bottom: none;
}

.rows .k {
  color: #6b7280;
}

.rows .v {
  color: #1f2d3d;
  font-variant-numeric: tabular-nums;
}

.rows .v.plus {
  color: #c0392b;
  font-weight: 600;
}

.rows .row.total .k,
.rows .row.total .v {
  font-weight: 600;
  color: #c0392b;
}

.tag {
  margin-left: 4px;
  padding: 1px 5px;
  border-radius: 4px;
  background: #fdf4e7;
  color: #b45309;
  font-size: 10px;
  font-style: normal;
}

.record {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 0;
  border-bottom: 1px solid #f5f7fa;
}

.record:last-child {
  border-bottom: none;
}

.r-channel {
  font-size: 13px;
  color: #1f2d3d;
}

.r-time {
  margin-top: 2px;
  font-size: 11px;
  color: #9aa3b2;
}

.r-right {
  text-align: right;
}

.r-amount {
  font-size: 14px;
  font-weight: 600;
  color: #1f2d3d;
  font-variant-numeric: tabular-nums;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.label {
  font-size: 13px;
  color: #6b7280;
  flex: none;
  width: 64px;
}

.quick {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding-left: 74px;
}

.chip {
  padding: 3px 10px;
  border-radius: 12px;
  border: 1px solid #dde3ec;
  font-size: 12px;
  color: #4b5563;
  cursor: pointer;
}

.tip {
  font-size: 11px;
  color: #9aa3b2;
  line-height: 1.6;
}
</style>
