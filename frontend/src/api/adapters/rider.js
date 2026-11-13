import { request } from '../http'
import { adminUrl } from '../urls'

/** 后端 DTO → 前端 model（骑手） */
export function toModel(d = {}) {
  return {
    id: String(d.id ?? ''),
    code: d.code ?? '',
    username: d.username ?? '',
    name: d.name ?? '',
    phone: d.phone ?? '',
    area: d.area ?? '',
    vehicle: d.vehicle ?? '电动车',
    status: Number(d.status ?? 1) === 0 ? 0 : 1,
    online: Number(d.online ?? 0) === 1 ? 1 : 0,
    todayDone: Number(d.todayDone ?? 0),
    doneCount: Number(d.doneCount ?? d.todayDone ?? 0),
    onTheWay: Number(d.onTheWay ?? 0),
    rating: Number(d.rating ?? 5),
    updateTime: d.updateTime ?? d.updateAt ?? null
  }
}

/** 表单 → 提交 payload */
export function fromForm(form = {}, isEdit = false) {
  const payload = {
    name: (form.name || '').trim(),
    phone: (form.phone || '').trim(),
    area: (form.area || '').trim(),
    vehicle: form.vehicle || '电动车',
    status: Number(form.status ?? 1),
    online: Number(form.online ?? 0)
  }
  if (isEdit) payload.id = String(form.id)
  else payload.username = (form.username || '').trim()
  return payload
}

export default {
  /** 分页查询，统一成 { list, total } */
  async page(params = {}) {
    const d = await request({ url: adminUrl('/rider/page'), method: 'get', params })
    const records = d?.records ?? d?.list ?? []
    return { list: records.map(toModel), total: Number(d?.total ?? records.length) }
  },

  async create(form) {
    return toModel(await request({ url: adminUrl('/rider'), method: 'post', data: fromForm(form, false) }))
  },

  async update(form) {
    return toModel(await request({ url: adminUrl('/rider'), method: 'put', data: fromForm(form, true) }))
  },

  async remove(id) {
    return request({ url: adminUrl(`/rider/${id}`), method: 'delete' })
  },

  /** 账号启停 */
  async changeStatus(id, status) {
    return request({ url: adminUrl(`/rider/${id}/status`), method: 'put', params: { status } })
  },

  /** 上线 / 休息 */
  async changeOnline(id, online) {
    return request({ url: adminUrl(`/rider/${id}/online`), method: 'put', params: { online } })
  },

  toModel,
  fromForm
}
