/**
 * 演示账号（前端显示与 mock 校验共用这一份，避免两处不同步）。
 *
 * 外卖平台的三类使用者各给一个账号：
 *   merchant 商家（进 PC 后台）
 *   rider    骑手（进接单工作台，手机尺寸）
 *   customer 顾客（进外卖点餐，手机尺寸）
 *
 * 真实后端接入后，这个文件只用于登录页的提示展示；密码校验交给后端。
 */
export const DEMO_ACCOUNTS = [
  { role: '商家', username: 'merchant', password: 'merchant1234', name: '刘添祺', home: '/dashboard' },
  { role: '骑手', username: 'rider', password: 'rider1234', name: '胡粤毫', home: '/rider/workbench' },
  { role: '骑手', username: 'rider2', password: 'rider21234', name: '桂誉', home: '/rider/workbench' },
  { role: '顾客', username: 'customer', password: 'customer1234', name: '顾客小王', home: '/h5/shop' }
]

/** 用户名 → 角色 key（mock 与前端共用） */
export const ACCOUNT_ROLE = {
  merchant: 'MERCHANT',
  rider: 'RIDER',
  rider2: 'RIDER',
  customer: 'CUSTOMER'
}

/** 按用户名查演示账号 */
export function findDemoAccount(username = '') {
  return DEMO_ACCOUNTS.find((a) => a.username === String(username).trim()) || null
}

export default DEMO_ACCOUNTS
