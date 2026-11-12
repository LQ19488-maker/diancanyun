/** 分类表单校验 */
export const categoryRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 1, max: 12, message: '分类名称 1–12 个字', trigger: 'blur' }
  ],
  sort: [
    { required: true, message: '请输入排序号', trigger: 'blur' },
    { type: 'number', min: 1, max: 999, message: '排序号 1–999', trigger: 'blur' }
  ]
}
