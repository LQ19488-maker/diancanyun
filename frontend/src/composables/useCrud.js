import { ref, reactive, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

/**
 * 弹窗表单通用逻辑：新增/编辑/校验/提交/删除确认。
 * 所有页面共用同一套流程，避免“每个页面各写一遍、各错一遍”。
 *
 * @param {object} cfg
 * @param {(form:any)=>Promise<any>} cfg.create
 * @param {(form:any)=>Promise<any>} cfg.update
 * @param {(id:string|number)=>Promise<any>} cfg.remove
 * @param {object} cfg.rules         el-form 校验规则
 * @param {(m:any)=>object} [cfg.toForm]  后端 model → 表单（默认浅拷贝）
 * @param {string} [cfg.label]       实体名，用于提示文案
 */
export function useCrud(cfg) {
  const { create, update, remove, rules = {}, toForm = (m) => ({ ...m }), label = '记录' } = cfg

  const visible = ref(false)
  const submitting = ref(false)
  const isEdit = ref(false)
  const formRef = ref(null)
  const form = reactive({})

  function fill(obj) {
    Object.keys(form).forEach((k) => delete form[k])
    Object.assign(form, obj || {})
  }

  function openCreate(defaults = {}) {
    fill(defaults)
    isEdit.value = false
    visible.value = true
    nextTick(() => formRef.value?.clearValidate())
  }

  function openEdit(model, extra = {}) {
    fill({ ...toForm(model), ...extra })
    isEdit.value = true
    visible.value = true
    nextTick(() => formRef.value?.clearValidate())
  }

  async function submit() {
    const valid = await formRef.value
      ?.validate()
      .then(() => true)
      .catch(() => false)
    if (!valid) return false

    submitting.value = true
    try {
      if (isEdit.value) await update(form)
      else await create(form)
      ElMessage.success(isEdit.value ? '修改成功' : '新增成功')
      visible.value = false
      return true
    } catch (e) {
      ElMessage.error(e?.message || '提交失败，请稍后重试')
      return false
    } finally {
      submitting.value = false
    }
  }

  /** 删除前一定二次确认；后端拒绝（比如被引用）时原样提示 */
  async function confirmRemove(model, text, idKey = 'id') {
    const tip = text || `确定删除这条${label}吗？删除后不可恢复。`
    try {
      await ElMessageBox.confirm(tip, '删除确认', {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消'
      })
    } catch {
      return false
    }
    try {
      await remove(model[idKey])
      ElMessage.success('删除成功')
      return true
    } catch (e) {
      ElMessage.error(e?.message || '删除失败')
      return false
    }
  }

  return { visible, form, rules, isEdit, formRef, submitting, openCreate, openEdit, submit, confirmRemove }
}
