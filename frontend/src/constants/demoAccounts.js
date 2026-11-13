/**
 * 演示账号（前端显示与 mock 校验共用这一份，避免两处不同步）。
 *
 * 真实后端接入后，这个文件只用于登录页的提示展示；密码校验交给后端。
 * 账号对应的员工记录在 mock 的 seed 里同步存在，所以「员工管理」里也能看到 HYH / GY。
 */
export const DEMO_ACCOUNTS = [
  { role: '管理员', username: 'admin', password: 'admin1234', name: '刘添祺' },
  { role: '管理员', username: 'hyh', password: 'hyh1234', name: '胡粤毫' },
  { role: '管理员', username: 'gy', password: 'gy1234', name: '桂誉' },
  { role: '员工', username: 'staff', password: 'staff1234', name: '员工账号' }
]

/** 按用户名查演示账号 */
export function findDemoAccount(username = '') {
  return DEMO_ACCOUNTS.find((a) => a.username === String(username).trim()) || null
}

export default DEMO_ACCOUNTS
