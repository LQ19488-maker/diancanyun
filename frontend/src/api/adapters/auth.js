import { request } from '../http'
import { adminUrl } from '../urls'

const ROLE_SET = ['ADMIN', 'STAFF']
const ROLE_FROM_TEXT = { 管理员: 'ADMIN', 员工: 'STAFF', ADMIN: 'ADMIN', STAFF: 'STAFF' }

/** 后端 DTO → 前端 model：字段翻译只在这里做 */
export function toProfile(d = {}) {
  return {
    id: String(d.id ?? d.employeeId ?? ''),
    username: d.username ?? '',
    name: d.name ?? d.realName ?? '',
    role: ROLE_SET.includes(d.role) ? d.role : ROLE_FROM_TEXT[d.roleName] || 'STAFF'
  }
}

export default {
  /** 登录：兼容 { token, user } 与 { token, id, username, name, role } 两种返回 */
  async login(payload) {
    const d = await request({ url: adminUrl('/login'), method: 'post', data: payload })
    return {
      token: d?.token ?? d?.jwt ?? '',
      user: d?.user ? toProfile(d.user) : toProfile(d)
    }
  },

  /** 当前登录人信息 */
  async me() {
    return toProfile(await request({ url: adminUrl('/employee/me'), method: 'get' }))
  }
}
