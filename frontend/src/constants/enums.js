/**
 * 全站枚举与状态机常量。
 *
 * 三大类使用者（外卖平台）：
 *   MERCHANT 商家 · RIDER 骑手 · CUSTOMER 个人用户（顾客）
 *
 * 原则：状态相关的文案、颜色、可执行动作只在这里定义一份，
 * 页面里禁止写 if (status === 2) 这种魔法值。
 * 后端若用数字或中文，在 api/adapters 里翻译成这里的 key 即可。
 */

/** 角色（三大类使用者） */
export const ROLE = {
  MERCHANT: 'MERCHANT',
  RIDER: 'RIDER',
  CUSTOMER: 'CUSTOMER'
}

export const ROLE_LABEL = {
  [ROLE.MERCHANT]: '商家',
  [ROLE.RIDER]: '骑手',
  [ROLE.CUSTOMER]: '顾客'
}

/** 登录后各自进入的首页 */
export const ROLE_HOME = {
  [ROLE.MERCHANT]: '/dashboard',
  [ROLE.RIDER]: '/rider/workbench',
  [ROLE.CUSTOMER]: '/h5/menu'
}

/** 通用启用/停用（分类、账号等共用） */
export const ENABLE_STATUS_MAP = {
  1: { text: '启用', type: 'success' },
  0: { text: '停用', type: 'info' }
}

/** 骑手接单状态：在线接单 / 休息中 */
export const RIDER_ONLINE_MAP = {
  1: { text: '在线接单', type: 'success' },
  0: { text: '休息中', type: 'info' }
}

/** 骑手车型 */
export const VEHICLES = ['电动车', '摩托车', '自行车', '步行']

/** 店铺营业状态 */
export const SHOP_STATUS_MAP = {
  1: { text: '营业中', type: 'success' },
  0: { text: '休息中', type: 'info' }
}

/** 菜品/套餐售卖状态 */
export const SHELF_STATUS = {
  ON: 1,
  OFF: 0
}

export const SHELF_STATUS_MAP = {
  [SHELF_STATUS.ON]: { text: '起售', type: 'success' },
  [SHELF_STATUS.OFF]: { text: '停售', type: 'info' }
}

/**
 * 订单状态机 —— 外卖四段式：
 *   顾客下单 → 商家接单 → 骑手接单（配送中）→ 送达
 * next 表示当前状态下允许流转到哪些状态，页面按钮完全由它推导。
 */
export const ORDER_STATUS = {
  PENDING: { text: '待商家接单', type: 'warning', next: ['ACCEPTED', 'CANCELED'] },
  ACCEPTED: { text: '待骑手接单', type: 'primary', next: ['DELIVERING', 'CANCELED'] },
  DELIVERING: { text: '配送中', type: 'primary', next: ['DONE'] },
  DONE: { text: '已送达', type: 'success', next: [] },
  CANCELED: { text: '已取消', type: 'info', next: [] }
}

/** 状态 → 动作文案（商家端与骑手端共用，避免文案不一致） */
export const ORDER_ACTION_LABEL = {
  ACCEPTED: '接单',
  DELIVERING: '抢单配送',
  DONE: '确认送达',
  CANCELED: '取消订单'
}

/** 商家端能做的流转（商家不做配送，配送交给骑手） */
export const MERCHANT_ACTIONS = ['ACCEPTED', 'CANCELED']
/** 骑手端能做的流转 */
export const RIDER_ACTIONS = ['DELIVERING', 'DONE']

/** 支付状态 */
export const PAY_STATUS = {
  UNPAID: { text: '未支付', type: 'info' },
  PAID: { text: '已支付', type: 'success' },
  REFUND: { text: '已退款', type: 'warning' }
}

/** 菜品分类类型 */
export const CATEGORY_TYPE = {
  DISH: 1,
  COMBO: 2
}

export const CATEGORY_TYPE_LABEL = {
  [CATEGORY_TYPE.DISH]: '菜品分类',
  [CATEGORY_TYPE.COMBO]: '套餐分类'
}

/** 状态通用取值器：找不到就给一个安全默认值，避免页面白屏 */
export function statusOf(map, key) {
  return map[key] || { text: String(key ?? '—'), type: 'info' }
}
