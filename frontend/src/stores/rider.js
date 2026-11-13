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
  const stats = ref({ online: 0, todayDone: 0, onTheWay: 0, rating: 5, income: 0, availableTasks: 0 })

  async function load() {
    const [me, st] = await Promise.all([
      request({ url: riderUrl('/me'), method: 'get' }),
      request({ url: riderUrl('/stats'), method: 'get' })
    ])
    profile.value = me
    stats.value = st
    return me
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

  return { profile, stats, load, setOnline, grab, finish }
})
