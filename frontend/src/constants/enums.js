/**
 * 全站枚举与状态机常量。
 *
 * 原则：状态相关的文案、颜色、可执行动作只在这里定义一份，
 * 页面里禁止写 if (status === 2) 这种魔法值。
 * 后端若用数字或中文，在 api/adapters 里翻译成这里的 key 即可。
 */

/** 角色 */
export const ROLE = {
  ADMIN: 'ADMIN',
  STAFF: 'STAFF'
}

export const ROLE_LABEL = {
  [ROLE.ADMIN]: '管理员',
  [ROLE.STAFF]: '员工'
}

/** 通用启用/停用（分类、账号等共用） */
export const ENABLE_STATUS_MAP = {
  1: { text: '启用', type: 'success' },
  0: { text: '停用', type: 'info' }
}

/** 账号状态 */
export const EMPLOYEE_STATUS = {
  ENABLED: 1,
  DISABLED: 0
}

export const EMPLOYEE_STATUS_MAP = {
  [EMPLOYEE_STATUS.ENABLED]: { text: '启用', type: 'success' },
  [EMPLOYEE_STATUS.DISABLED]: { text: '停用', type: 'info' }
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
 * 订单状态机 —— 与后端「订单状态流转」接口保持一致。
 * next 表示当前状态下允许流转到哪些状态，页面按钮完全由它推导。
 */
export const ORDER_STATUS = {
  PENDING: { text: '待接单', type: 'warning', next: ['ACCEPTED', 'CANCELED'], action: '接单' },
  ACCEPTED: { text: '已接单', type: 'primary', next: ['DELIVERING', 'CANCELED'], action: '派送' },
  DELIVERING: { text: '派送中', type: 'primary', next: ['DONE'], action: '完成' },
  DONE: { text: '已完成', type: 'success', next: [], action: '' },
  CANCELED: { text: '已取消', type: 'info', next: [], action: '' }
}

/** 订单状态 → 目标状态的中文动作名 */
export const ORDER_ACTION_LABEL = {
  ACCEPTED: '接单',
  DELIVERING: '开始派送',
  DONE: '完成订单',
  CANCELED: '取消订单'
}

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
