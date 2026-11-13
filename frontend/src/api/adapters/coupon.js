import { request } from '../http'
import { userUrl } from '../urls'

/** 领券中心的可领券模板 */
export function toTemplate(d = {}) {
  return {
    id: String(d.id ?? ''),
    title: d.title ?? '',
    threshold: Number(d.threshold ?? 0),
    amount: Number(d.amount ?? 0),
    shopId: d.shopId ? String(d.shopId) : '',
    desc: d.desc ?? '',
    left: Number(d.left ?? 0),
    claimed: Boolean(d.claimed)
  }
}

/** 我手上的券 */
export function toCoupon(d = {}) {
  return {
    id: String(d.id ?? ''),
    couponId: String(d.couponId ?? ''),
    title: d.title ?? '',
    threshold: Number(d.threshold ?? 0),
    amount: Number(d.amount ?? 0),
    shopId: d.shopId ? String(d.shopId) : '',
    status: d.status ?? 'UNUSED',
    expireAt: d.expireAt ?? null,
    usedAt: d.usedAt ?? null,
    usable: d.usable === undefined ? undefined : Boolean(d.usable)
  }
}

export default {
  /** 领券中心：所有可领的券（带「已领」标记） */
  async templates() {
    const d = await request({ url: userUrl('/coupon/templates'), method: 'get' })
    const records = d?.records ?? d?.list ?? []
    return { list: records.map(toTemplate) }
  },

  async claim(id) {
    return toCoupon(await request({ url: userUrl(`/coupon/${id}/claim`), method: 'post' }))
  },

  /**
   * 我的券。传 amount + shopId 时会返回 usable 标记，
   * 下单页据此只列「现在能用」的券。
   */
  async mine(params = {}) {
    const d = await request({ url: userUrl('/coupons'), method: 'get', params })
    const records = d?.records ?? d?.list ?? []
    return { list: records.map(toCoupon), total: Number(d?.total ?? records.length) }
  },

  /** 下单页用：只取当前店铺、当前金额下能用的券 */
  async available(amount, shopId) {
    const { list } = await this.mine({ orderAmount: amount, shopId })
    return list.filter((c) => c.usable)
  },

  toTemplate,
  toCoupon
}
