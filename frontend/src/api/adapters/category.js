import { request } from '../http'
import { adminUrl } from '../urls'

/** 后端 DTO → 前端 model */
export function toModel(d = {}) {
  return {
    id: String(d.id ?? ''),
    name: d.name ?? '',
    type: Number(d.type) === 2 ? 2 : 1,
    sort: Number(d.sort ?? 1),
    status: Number(d.status ?? 1) === 0 ? 0 : 1,
    dishCount: Number(d.dishCount ?? 0),
    updateTime: d.updateTime ?? d.updateAt ?? null
  }
}

/** 表单 → 提交 payload */
export function fromForm(form = {}, isEdit = false) {
  const payload = {
    name: (form.name || '').trim(),
    sort: Number(form.sort ?? 1),
    status: Number(form.status ?? 1)
  }
  if (isEdit) payload.id = String(form.id)
  else payload.type = Number(form.type) === 2 ? 2 : 1
  return payload
}

/** 口味：后端 [{name, values:[{name}]}] → 前端同构，只做兜底 */
export function toFlavors(list = []) {
  return (list || []).map((f) => ({
    name: f.name ?? '',
    values: (f.values || []).map((v) => ({ name: typeof v === 'string' ? v : v.name ?? '' }))
  }))
}

export default {
  async page(params = {}) {
    const d = await request({ url: adminUrl('/category/page'), method: 'get', params })
    const records = d?.records ?? d?.list ?? []
    return { list: records.map(toModel), total: Number(d?.total ?? records.length) }
  },

  async create(form) {
    return toModel(await request({ url: adminUrl('/category'), method: 'post', data: fromForm(form, false) }))
  },

  async update(form) {
    return toModel(await request({ url: adminUrl('/category'), method: 'put', data: fromForm(form, true) }))
  },

  async remove(id) {
    return request({ url: adminUrl(`/category/${id}`), method: 'delete' })
  },

  /** 某个分类下的口味配置（整体读取 / 整体覆盖保存） */
  async getFlavors(categoryId) {
    const d = await request({ url: adminUrl(`/flavor/${categoryId}`), method: 'get' })
    return toFlavors(d?.flavors || [])
  },

  async saveFlavors(categoryId, flavors) {
    const d = await request({
      url: adminUrl(`/flavor/${categoryId}`),
      method: 'put',
      data: { flavors: toFlavors(flavors) }
    })
    return toFlavors(d?.flavors || [])
  },

  toModel,
  fromForm,
  toFlavors
}
