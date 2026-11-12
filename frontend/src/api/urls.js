/**
 * 接口路径前缀 —— 与后端框架保持一致：
 *   管理端 /admin/**（商家后台）   用户端 /user/**（H5 顾客）
 * 换后端只改这里，adapter 与页面都不用动。
 */
export const ADMIN_PREFIX = '/admin'
export const USER_PREFIX = '/user'

export function adminUrl(path = '') {
  return ADMIN_PREFIX + (path.startsWith('/') ? path : `/${path}`)
}

export function userUrl(path = '') {
  return USER_PREFIX + (path.startsWith('/') ? path : `/${path}`)
}
