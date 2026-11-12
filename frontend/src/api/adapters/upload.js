import { request } from '../http'
import { adminUrl } from '../urls'

/**
 * 图片上传。
 * 真实后端：POST /admin/upload（multipart，字段名 file）→ { url }
 * 演示环境不走这里（ImageUpload 组件本地转 base64）。
 */
export default {
  async image(file) {
    const fd = new FormData()
    fd.append('file', file)
    const d = await request({
      url: adminUrl('/upload'),
      method: 'post',
      data: fd,
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return d?.url || ''
  }
}
