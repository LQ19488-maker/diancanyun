import { request } from '../http'
import { adminUrl } from '../urls'

/** 后端 DTO → 前端 model */
export function toModel(d = {}) {
  return {
    id: String(d.id ?? ''),
    username: d.username ?? '',
    name: d.name ?? d.realName ?? '',
    phone: d.phone ?? '',
    role: d.role === 'ADMIN' || d.role === 'STAFF' ? d.role : 'STAFF',
    status: Number(d.status ?? 1) === 0 ? 0 : 1,
    lastLoginTime: d.lastLoginTime ?? d.lastLoginAt ?? null,
    updateTime: d.updateTime ?? d.updateAt ?? null
  }
}

/** 前端表单 → 提交给后端的 payload（去掉只读字段，密码单独传） */
export function fromForm(form = {}, isEdit = false) {
  const payload = {
    name: (form.name || '').trim(),
    phone: (form.phone || '').trim(),
    role: form.role || 'STAFF',
    status: Number(form.status ?? 1)
  }
  if (isEdit) {
    payload.id = String(form.id)
  } else {
    payload.username = (form.username || '').trim()
    payload.password = form.password
  }
  return payload
}

export default {
  /** 分页查询，统一成 { list, total } 给 ProTable 用 */
  async page(params = {}) {
    const d = await request({ url: adminUrl('/employee/page'), method: 'get', params })
    const records = d?.records ?? d?.list ?? d?.rows ?? []
    const total = Number(d?.total ?? records.length)
    return { list: records.map(toModel), total }
  },

  async create(form) {
    return toModel(await request({ url: adminUrl('/employee'), method: 'post', data: fromForm(form, false) }))
  },

  async update(form) {
    return toModel(await request({ url: adminUrl('/employee'), method: 'put', data: fromForm(form, true) }))
  },

  async remove(id) {
    return request({ url: adminUrl(`/employee/${id}`), method: 'delete' })
  },

  /** 启用/停用：后端可能是 PUT /employee/{id}/status?status=0|1 */
  async changeStatus(id, status) {
    return request({ url: adminUrl(`/employee/${id}/status`), method: 'put', params: { status } })
  },

  toModel,
  fromForm
}
