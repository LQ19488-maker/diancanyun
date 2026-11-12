/** 菜品表单校验 */
export const dishRules = {
  name: [
    { required: true, message: '请输入菜品名称', trigger: 'blur' },
    { min: 1, max: 20, message: '名称 1–20 个字', trigger: 'blur' }
  ],
  categoryId: [{ required: true, message: '请选择所属分类', trigger: 'change' }],
  price: [
    { required: true, message: '请输入售价', trigger: 'blur' },
    {
      validator(_rule, value, callback) {
        const n = Number(value)
        if (!Number.isFinite(n) || n <= 0) return callback(new Error('售价必须大于 0'))
        if (n > 9999) return callback(new Error('售价不能超过 9999 元'))
        if (/\.\d{3,}$/.test(String(value))) return callback(new Error('最多两位小数'))
        callback()
      },
      trigger: 'blur'
    }
  ]
}
