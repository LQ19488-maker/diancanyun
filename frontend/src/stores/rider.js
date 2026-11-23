import { defineStore } from 'pinia'
import { ref } from 'vue'
import { request } from '@/api/http'
import { riderUrl } from '@/api/urls'

/**
 * 骑手自己的状态（在 RiderLayout 里加载一次，页面共享）。
 * 与「商家端的骑手管理」不是一回事：那个是商家看骑手，这个是骑手看自己。
 */
export const useRiderStore = defineStore('rider', () => {
  const profile = ref(null)
  const stats = ref({
    online: 0,
    todayDone: 0,
    onTheWay: 0,
    rating: 5,
    income: 0,
    baseIncome: 0,
    todaySubsidy: 0,
    subsidyPer: 0,
    balance: 0,
    availableTasks: 0
  })
  const weather = ref(null)
  const wallet = ref(null)

  async function load() {
    const [me, st, wt] = await Promise.all([
      request({ url: riderUrl('/me'), method: 'get' }),
      request({ url: riderUrl('/stats'), method: 'get' }),
      request({ url: riderUrl('/weather'), method: 'get' }).catch(() => null)
    ])
    profile.value = me
    stats.value = st
    if (wt) weather.value = wt
    return me
  }

  /** 钱包单独拉：里面是提现记录，比其他数据重一些 */
  async function loadWallet() {
    wallet.value = await request({ url: riderUrl('/wallet'), method: 'get' })
    return wallet.value
  }

  async function withdraw(amount, channel) {
    const res = await request({ url: riderUrl('/withdraw'), method: 'post', data: { amount, channel } })
    await Promise.all([loadWallet(), load()])
    return res
  }

  async function setOnline(online) {
    const me = await request({ url: riderUrl('/online'), method: 'put', params: { online } })
    profile.value = me
    stats.value = { ...stats.value, online: Number(me.online) }
    return me
  }

  async function grab(orderId) {
    const row = await request({ url: riderUrl(`/tasks/${orderId}/grab`), method: 'post' })
    await load()
    return row
  }

  async function finish(orderId) {
    const row = await request({ url: riderUrl(`/orders/${orderId}/finish`), method: 'post' })
    await load()
    return row
  }

  return { profile, stats, weather, wallet, load, loadWallet, withdraw, setOnline, grab, finish }
})
