import { request, resolveFileUrl } from '../http'
import { adminUrl } from '../urls'

/** 后端 DTO → 前端 model */
export function toModel(d = {}) {
  return {
    id: String(d.id ?? ''),
    name: d.name ?? '',
    categoryId: d.categoryId === undefined || d.categoryId === null ? '' : String(d.categoryId),
    categoryName: d.categoryName ?? d.category ?? '',
    // 价格统一按「元」浮点使用；后端若返回分，请在 adapter 里 /100
    price: Number(d.price ?? 0),
    image: d.image ?? '',
    imageUrl: d.image ? resolveFileUrl(d.image) : '',
    description: d.description ?? '',
    status: Number(d.status ?? 1) === 0 ? 0 : 1,
    flavors: (d.flavors || []).map((f) => ({
      name: f.name ?? '',
      values: (f.values || []).map((v) => (typeof v === 'string' ? v : v.name ?? ''))
    })),
    updateTime: d.updateTime ?? d.updateAt ?? null
  }
}

/** 表单 → 提交 payload */
export function fromForm(form = {}, isEdit = false) {
  const payload = {
    name: (form.name || '').trim(),
    categoryId: form.categoryId ? String(form.categoryId) : '',
    price: Number(Number(form.price ?? 0).toFixed(2)),
    image: form.image || '',
    description: (form.description || '').trim(),
    status: Number(form.status ?? 1),
    flavors: (form.flavors || []).map((f) => ({
      name: f.name,
      values: (f.values || []).filter(Boolean)
    }))
  }
  if (isEdit) payload.id = String(form.id)
  return payload
}

/** 口味展示用文本：辣度:微辣/中辣 ; 份量:大份 */
export function flavorText(flavors = []) {
  return flavors
    .filter((f) => f.values && f.values.length)
    .map((f) => `${f.name}:${f.values.join('/')}`)
    .join(' ; ')
}

export default {
  async page(params = {}) {
    const d = await request({ url: adminUrl('/dish/page'), method: 'get', params })
    const records = d?.records ?? d?.list ?? []
    return { list: records.map(toModel), total: Number(d?.total ?? records.length) }
  },

  async create(form) {
    return toModel(await request({ url: adminUrl('/dish'), method: 'post', data: fromForm(form, false) }))
  },

  async update(form) {
    return toModel(await request({ url: adminUrl('/dish'), method: 'put', data: fromForm(form, true) }))
  },

  async remove(id) {
    return request({ url: adminUrl(`/dish/${id}`), method: 'delete' })
  },

  async changeStatus(id, status) {
    return request({ url: adminUrl(`/dish/${id}/status`), method: 'put', params: { status } })
  },

  toModel,
  fromForm,
  flavorText
}
