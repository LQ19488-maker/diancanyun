/**
 * 演示账号（前端显示与 mock 校验共用这一份，避免两处不同步）。
 *
 * 外卖平台的三大类使用者：
 *   merchant  商家 —— 点单云·中关村店（8001），进 PC 后台
 *   merchant2 商家 —— 外婆家·五道口店（8002），进 PC 后台，只看得到自己店的数据
 *   rider     骑手（王小明）、rider2 骑手（桂誉），进接单工作台（手机尺寸）
 *   customer  顾客（胡粤毫），进外卖点餐（手机尺寸）
 *
 * 真实后端接入后，这个文件只用于登录页的提示展示；
 * 密码校验、以及「这个账号属于哪家店」都由后端负责。
 */
export const DEMO_ACCOUNTS = [
  { role: '商家', username: 'merchant', password: 'merchant1234', name: '刘添祺', home: '/dashboard' },
  {
    role: '商家',
    username: 'merchant2',
    password: 'merchant21234',
    name: '外婆家·五道口店',
    home: '/dashboard'
  },
  { role: '骑手', username: 'rider', password: 'rider1234', name: '王小明', home: '/rider/workbench' },
  { role: '骑手', username: 'rider2', password: 'rider21234', name: '桂誉', home: '/rider/workbench' },
  { role: '顾客', username: 'customer', password: 'customer1234', name: '胡粤毫', home: '/h5/shop' }
]

/** 用户名 → 角色 key（mock 与前端共用） */
export const ACCOUNT_ROLE = {
  merchant: 'MERCHANT',
  merchant2: 'MERCHANT',
  rider: 'RIDER',
  rider2: 'RIDER',
  customer: 'CUSTOMER'
}

/**
 * 商家账号 → 所属店铺。
 * 演示环境用它模拟后端的「数据权限」：商家登录后，后台各列表只返回这家店的数据。
 * 真实环境应由后端从 token 里取 shopId（或查用户-店铺关联表），前端不用传这个参数。
 */
export const ACCOUNT_SHOP = {
  merchant: { id: '8001', name: '点单云·中关村店' },
  merchant2: { id: '8002', name: '外婆家·五道口店' }
}

/** 按用户名查演示账号 */
export function findDemoAccount(username = '') {
  return DEMO_ACCOUNTS.find((a) => a.username === String(username).trim()) || null
}

/** 按用户名查所属店铺（没绑定店铺的返回 null） */
export function shopOfAccount(username = '') {
  return ACCOUNT_SHOP[String(username).trim()] || null
}

export default DEMO_ACCOUNTS
