import { request } from '../http'
import { adminUrl } from '../urls'

const STATUS_SET = ['PENDING', 'ACCEPTED', 'DELIVERING', 'DONE', 'CANCELED']

export function toModel(d = {}) {
  return {
    id: String(d.id ?? ''),
    orderNo: d.orderNo ?? d.order_no ?? '',
    userName: d.userName ?? d.customerName ?? '',
    phone: d.phone ?? '',
    tableNo: d.tableNo ?? d.table_no ?? '',
    address: d.address ?? '',
    items: (d.items || d.details || []).map((x) => ({
      dishId: String(x.dishId ?? x.id ?? ''),
      dishName: x.dishName ?? x.name ?? '',
      quantity: Number(x.quantity ?? x.number ?? 1),
      unitPrice: Number(x.unitPrice ?? x.amount ?? 0),
      amount: Number(x.amount ?? 0),
      flavors: x.flavors || []
    })),
    amount: Number(d.amount ?? 0),
    packFee: Number(d.packFee ?? 0),
    totalAmount: Number(d.totalAmount ?? d.amount ?? 0),
    remark: d.remark ?? '',
    payStatus: d.payStatus ?? 'PAID',
    status: STATUS_SET.includes(d.status) ? d.status : 'PENDING',
    createdAt: d.createdAt ?? d.createTime ?? null,
    timeline: (d.timeline || []).map((t) => ({ status: t.status, time: t.time }))
  }
}

/** 订单内容摘要：宫保鸡丁×2、米饭×1 */
export function summary(order) {
  return (order.items || []).map((i) => `${i.dishName}×${i.quantity}`).join('、')
}

export default {
  async page(params = {}) {
    const d = await request({ url: adminUrl('/order/page'), method: 'get', params })
    const records = d?.records ?? d?.list ?? []
    return { list: records.map(toModel), total: Number(d?.total ?? records.length) }
  },

  /** 各状态数量，用于标签页角标 */
  async statusCount() {
    const d = await request({ url: adminUrl('/order/status-count'), method: 'get' })
    return {
      ALL: Number(d?.ALL ?? 0),
      PENDING: Number(d?.PENDING ?? 0),
      ACCEPTED: Number(d?.ACCEPTED ?? 0),
      DELIVERING: Number(d?.DELIVERING ?? 0),
      DONE: Number(d?.DONE ?? 0),
      CANCELED: Number(d?.CANCELED ?? 0)
    }
  },

  async detail(id) {
    return toModel(await request({ url: adminUrl(`/order/${id}`), method: 'get' }))
  },

  /** 状态流转：后端会校验是否允许该跃迁 */
  async changeStatus(id, status) {
    return toModel(
      await request({ url: adminUrl(`/order/${id}/status`), method: 'put', data: { status } })
    )
  },

  toModel,
  summary
}
