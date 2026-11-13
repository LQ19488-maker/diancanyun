/**
 * 接口路径前缀 —— 与后端框架保持一致：
 *   认证 /auth/**（三类使用者共用）
 *   商家端 /admin/**（商家后台）
 *   顾客端 /user/**（顾客 H5）
 *   骑手端 /rider/**（骑手工作台）
 * 换后端只改这里，adapter 与页面都不用动。
 */
export const AUTH_PREFIX = '/auth'
export const ADMIN_PREFIX = '/admin'
export const USER_PREFIX = '/user'
export const RIDER_PREFIX = '/rider'

const join = (prefix, path) => prefix + (path.startsWith('/') ? path : `/${path}`)

export function authUrl(path = '') {
  return join(AUTH_PREFIX, path)
}

export function adminUrl(path = '') {
  return join(ADMIN_PREFIX, path)
}

export function userUrl(path = '') {
  return join(USER_PREFIX, path)
}

export function riderUrl(path = '') {
  return join(RIDER_PREFIX, path)
}
