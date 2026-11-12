/** 套餐表单校验 */
export const comboRules = {
  name: [
    { required: true, message: '请输入套餐名称', trigger: 'blur' },
    { min: 1, max: 20, message: '名称 1–20 个字', trigger: 'blur' }
  ],
  categoryId: [{ required: true, message: '请选择套餐分类', trigger: 'change' }],
  price: [
    { required: true, message: '请输入套餐价', trigger: 'blur' },
    {
      validator(_rule, value, callback) {
        const n = Number(value)
        if (!Number.isFinite(n) || n <= 0) return callback(new Error('套餐价必须大于 0'))
        if (n > 9999) return callback(new Error('套餐价不能超过 9999 元'))
        if (/\.\d{3,}$/.test(String(value))) return callback(new Error('最多两位小数'))
        callback()
      },
      trigger: 'blur'
    }
  ]
}
