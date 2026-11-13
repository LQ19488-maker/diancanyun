import { request } from '../http'
import { authUrl } from '../urls'

const ROLE_SET = ['MERCHANT', 'RIDER', 'CUSTOMER']
const ROLE_FROM_TEXT = {
  商家: 'MERCHANT',
  管理员: 'MERCHANT',
  ADMIN: 'MERCHANT',
  骑手: 'RIDER',
  员工: 'RIDER',
  STAFF: 'RIDER',
  顾客: 'CUSTOMER',
  用户: 'CUSTOMER',
  CUSTOMER: 'CUSTOMER'
}

/** 后端 DTO → 前端 model：字段翻译只在这里做 */
export function toProfile(d = {}) {
  return {
    id: String(d.id ?? d.employeeId ?? ''),
    username: d.username ?? '',
    name: d.name ?? d.realName ?? '',
    role: ROLE_SET.includes(d.role) ? d.role : ROLE_FROM_TEXT[d.roleName] || 'CUSTOMER',
    /* 商家账号绑定哪家店：后台所有列表都由后端按这个范围过滤 */
    shopId: d.shopId ? String(d.shopId) : '',
    shopName: d.shopName ?? ''
  }
}

export default {
  /** 登录：兼容 { token, user } 与 { token, id, username, name, role } 两种返回 */
  async login(payload) {
    const d = await request({ url: authUrl('/login'), method: 'post', data: payload })
    return {
      token: d?.token ?? d?.jwt ?? '',
      user: d?.user ? toProfile(d.user) : toProfile(d)
    }
  },

  /** 当前登录人信息 */
  async me() {
    return toProfile(await request({ url: authUrl('/me'), method: 'get' }))
  }
}
