import axios from 'axios'
import { mockRequest } from './mock'

export const IS_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
export const API_BASE = import.meta.env.VITE_API_BASE || '/api'
export const UPLOAD_BASE = import.meta.env.VITE_UPLOAD_BASE || ''

/** 业务异常：页面 catch 到它，直接用 message 提示即可 */
export class BizError extends Error {
  constructor(code, message) {
    super(message || '操作失败')
    this.name = 'BizError'
    this.code = code
  }
}

/** 401 的处理交给外部注入，避免 http 层反向依赖 router / store */
let unauthorizedHandler = () => {}
export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn
}

const SUCCESS_CODES = [0, 200]

/**
 * 统一解包。要兼容两种后端习惯：
 *   1) 包了 Result：{ code, msg, data }
 *   2) 没包的接口（文件流、纯数组）
 * 并且要接受「业务错误也返回 HTTP 200」这种 Spring 常见做法。
 */
export function unwrap(body) {
  if (body && typeof body === 'object' && 'code' in body) {
    if (SUCCESS_CODES.includes(Number(body.code))) return body.data
    const code = Number(body.code)
    if (code === 401 || code === 2002) {
      unauthorizedHandler()
      throw new BizError(code, body.msg || '登录已过期，请重新登录')
    }
    throw new BizError(code, body.msg || body.message || '操作失败')
  }
  return body
}

const service = axios.create({ baseURL: API_BASE, timeout: 15000 })

service.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('dcy_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

service.interceptors.response.use(
  (res) => unwrap(res.data),
  (err) => {
    const status = err.response?.status
    if (status === 401) {
      unauthorizedHandler()
      return Promise.reject(new BizError(401, '登录已过期，请重新登录'))
    }
    const body = err.response?.data
    const msg = body?.msg || body?.message || err.message || '网络异常，请稍后重试'
    return Promise.reject(new BizError(body?.code ?? status ?? -1, msg))
  }
)

/**
 * 唯一的请求入口。页面/适配层只调它，不直接碰 axios，也不判断 mock。
 */
export function request(config) {
  if (IS_MOCK) {
    return mockRequest(config).then(unwrap)
  }
  return service.request(config)
}

/** 相对路径补全为可直接用于 img src 的地址 */
export function resolveFileUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  return `${UPLOAD_BASE}${path.startsWith('/') ? '' : '/'}${path}`
}
