import { request, resolveFileUrl } from '../http'
import { adminUrl } from '../urls'

/** 后端 DTO → 前端 model */
export function toModel(d = {}) {
  const dishes = (d.dishes || []).map((x) => ({
    id: String(x.id ?? ''),
    name: x.name ?? '',
    price: Number(x.price ?? 0)
  }))
  const dishIds = (d.dishIds || dishes.map((x) => x.id)).map(String)
  return {
    id: String(d.id ?? ''),
    name: d.name ?? '',
    categoryId: d.categoryId === undefined || d.categoryId === null ? '' : String(d.categoryId),
    categoryName: d.categoryName ?? '',
    price: Number(d.price ?? 0),
    image: d.image ?? '',
    imageUrl: d.image ? resolveFileUrl(d.image) : '',
    description: d.description ?? '',
    status: Number(d.status ?? 1) === 0 ? 0 : 1,
    dishIds,
    dishes,
    dishCount: Number(d.dishCount ?? dishIds.length),
    // 后端若直接给原价合计就用它，否则按选中的菜品累加
    originPrice: Number(d.originPrice ?? dishes.reduce((s, x) => s + Number(x.price || 0), 0).toFixed(2)),
    updateTime: d.updateTime ?? d.updateAt ?? null
  }
}

export function fromForm(form = {}, isEdit = false) {
  const payload = {
    name: (form.name || '').trim(),
    categoryId: form.categoryId ? String(form.categoryId) : '',
    price: Number(Number(form.price ?? 0).toFixed(2)),
    dishIds: (form.dishIds || []).map(String),
    image: form.image || '',
    description: (form.description || '').trim(),
    status: Number(form.status ?? 1)
  }
  if (isEdit) payload.id = String(form.id)
  return payload
}

export default {
  async page(params = {}) {
    const d = await request({ url: adminUrl('/combo/page'), method: 'get', params })
    const records = d?.records ?? d?.list ?? []
    return { list: records.map(toModel), total: Number(d?.total ?? records.length) }
  },

  async detail(id) {
    return toModel(await request({ url: adminUrl(`/combo/${id}`), method: 'get' }))
  },

  async create(form) {
    return toModel(await request({ url: adminUrl('/combo'), method: 'post', data: fromForm(form, false) }))
  },

  async update(form) {
    return toModel(await request({ url: adminUrl('/combo'), method: 'put', data: fromForm(form, true) }))
  },

  async remove(id) {
    return request({ url: adminUrl(`/combo/${id}`), method: 'delete' })
  },

  async changeStatus(id, status) {
    return request({ url: adminUrl(`/combo/${id}/status`), method: 'put', params: { status } })
  },

  toModel,
  fromForm
}
