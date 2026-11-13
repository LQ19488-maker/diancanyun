/** 骑手表单校验 */
export const riderRules = {
  username: [
    { required: true, message: '请输入骑手登录账号', trigger: 'blur' },
    { pattern: /^[a-zA-Z][a-zA-Z0-9_]{2,15}$/, message: '字母开头，3–16 位字母/数字/下划线', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入骑手姓名', trigger: 'blur' },
    { max: 20, message: '姓名不超过 20 个字', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  area: [{ required: true, message: '请选择所属站点', trigger: 'change' }],
  vehicle: [{ required: true, message: '请选择车型', trigger: 'change' }]
}

/** 编辑时不需要账号字段 */
export function rulesForEdit() {
  const { username, ...rest } = riderRules
  return rest
}
