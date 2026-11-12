import { request } from '../http'

/** 统计看板：营业额、订单量、客单价、完成率 + 三类图表数据 */
export function toOverview(d = {}) {
  return {
    turnover: Number(d.turnover ?? 0),
    orderCount: Number(d.orderCount ?? 0),
    avgPrice: Number(d.avgPrice ?? 0),
    finishRate: Number(d.finishRate ?? 0),
    trend: d.trend || [],
    statusDist: d.statusDist || [],
    hotDishes: d.hotDishes || []
  }
}

export default {
  async overview(params = {}) {
    return toOverview(await request({ url: '/statistics/overview', method: 'get', params }))
  },
  toOverview
}
