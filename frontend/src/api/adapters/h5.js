import { request, resolveFileUrl } from '../http'
import { userUrl } from '../urls'
import { toModel as orderToModel } from './order'

/** 菜单：分类 + 在售菜品 */
export function toDish(d = {}) {
  return {
    id: String(d.id ?? ''),
    name: d.name ?? '',
    categoryId: String(d.categoryId ?? ''),
    price: Number(d.price ?? 0),
    image: d.image ?? '',
    imageUrl: d.image ? resolveFileUrl(d.image) : '',
    description: d.description ?? '',
    flavors: (d.flavors || []).map((f) => ({
      name: f.name ?? '',
      values: (f.values || []).map((v) => (typeof v === 'string' ? v : v.name ?? ''))
    }))
  }
}

/** 团购套餐（多人餐）：比单点便宜，按套餐价卖 */
export function toCombo(c = {}) {
  return {
    id: String(c.id ?? ''),
    name: c.name ?? '',
    image: c.image ?? '',
    imageUrl: c.image ? resolveFileUrl(c.image) : '',
    price: Number(c.price ?? 0),
    originPrice: Number(c.originPrice ?? 0),
    dishCount: Number(c.dishCount ?? 0),
    dishNames: c.dishNames || [],
    description: c.description ?? '',
    /** 相对原价省了多少（前端直接展示，不再自己算） */
    save: Number(Math.max(0, Number(c.originPrice ?? 0) - Number(c.price ?? 0)).toFixed(2))
  }
}

export default {
  /** 顾客端菜单（只返回在售菜品与启用分类，外加该店的团购套餐） */
  async menu(params = {}) {
    const d = await request({ url: userUrl('/menu'), method: 'get', params })
    return {
      categories: (d?.categories || []).map((c) => ({ id: String(c.id), name: c.name })),
      dishes: (d?.dishes || []).map(toDish),
      combos: (d?.combos || []).map(toCombo)
    }
  },

  /** 提交订单 */
  async submit(payload) {
    return orderToModel(await request({ url: userUrl('/order'), method: 'post', data: payload }))
  },

  /** 订单详情（结果页/详情页都用它） */
  async order(id) {
    return orderToModel(await request({ url: userUrl(`/order/${id}`), method: 'get' }))
  },

  /** 我的订单 */
  async myOrders(params = {}) {
    const d = await request({ url: userUrl('/orders'), method: 'get', params })
    const records = d?.records ?? d?.list ?? []
    return { list: records.map(orderToModel), total: Number(d?.total ?? records.length) }
  },

  toDish,
  toCombo
}
