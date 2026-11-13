import { request, resolveFileUrl } from '../http'
import { userUrl } from '../urls'

/** 店铺模型：列表卡片与菜单页头部共用 */
export function toShop(d = {}) {
  return {
    id: String(d.id ?? ''),
    name: d.name ?? '',
    image: d.image ?? '',
    imageUrl: d.image ? resolveFileUrl(d.image) : '',
    rating: Number(d.rating ?? 0),
    monthlySales: Number(d.monthlySales ?? 0),
    minPrice: Number(d.minPrice ?? 0),
    deliveryFee: Number(d.deliveryFee ?? 0),
    deliveryTime: Number(d.deliveryTime ?? 0),
    distance: d.distance ?? '',
    notice: d.notice ?? '',
    status: Number(d.status ?? 1),
    /* 菜单是否已接入：false 表示平台里有这家店但暂时点不了 */
    openMenu: Boolean(d.openMenu),
    tags: d.tags || []
  }
}

export function toAddress(a = {}) {
  return {
    id: String(a.id ?? ''),
    tag: a.tag ?? '其他',
    name: a.name ?? '',
    phone: a.phone ?? '',
    detail: a.detail ?? '',
    isDefault: Number(a.isDefault ?? 0) === 1
  }
}

export default {
  /** 店铺列表（外卖平台首页） */
  async shops(params = {}) {
    const d = await request({ url: userUrl('/shops'), method: 'get', params })
    const records = d?.records ?? d?.list ?? []
    return { list: records.map(toShop), total: Number(d?.total ?? records.length) }
  },

  async shop(id) {
    return toShop(await request({ url: userUrl(`/shop/${id}`), method: 'get' }))
  },

  /** 收货地址列表 */
  async addresses() {
    const d = await request({ url: userUrl('/addresses'), method: 'get' })
    const records = d?.records ?? d?.list ?? d ?? []
    return { list: (Array.isArray(records) ? records : []).map(toAddress) }
  },

  async createAddress(payload) {
    return toAddress(await request({ url: userUrl('/address'), method: 'post', data: payload }))
  },

  async updateAddress(payload) {
    return toAddress(await request({ url: userUrl('/address'), method: 'put', data: payload }))
  },

  async setDefaultAddress(id) {
    return toAddress(await request({ url: userUrl(`/address/${id}/default`), method: 'put' }))
  },

  async removeAddress(id) {
    await request({ url: userUrl(`/address/${id}`), method: 'delete' })
    return true
  },

  toShop,
  toAddress
}
