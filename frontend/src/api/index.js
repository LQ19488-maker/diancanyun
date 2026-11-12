/**
 * 前端 API 的唯一出口 —— 页面只 import 这个文件。
 *
 * 分层：
 *   views  →  api/index.js（本文件）  →  api/adapters/*（字段翻译）  →  api/http.js（请求/解包/mock 切换）
 * 页面里不允许出现 axios、接口 URL、字段名转换。
 */
import auth from './adapters/auth'
import employee from './adapters/employee'
import category from './adapters/category'
import statistics from './adapters/statistics'

const api = { auth, employee, category, statistics }

export default api
export { IS_MOCK, resolveFileUrl } from './http'
