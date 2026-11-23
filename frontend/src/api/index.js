/**
 * 前端 API 的唯一出口 —— 页面只 import 这个文件。
 *
 * 分层：
 *   views  →  api/index.js（本文件）  →  api/adapters/*（字段翻译）  →  api/http.js（请求/解包/mock 切换）
 * 路径前缀统一由 api/urls.js 提供（/admin 管理端、/user 用户端），换后端只改那一个文件。
 */
import auth from './adapters/auth'
import rider from './adapters/rider'
import category from './adapters/category'
import dish from './adapters/dish'
import combo from './adapters/combo'
import order from './adapters/order'
import h5 from './adapters/h5'
import shop from './adapters/shop'
import coupon from './adapters/coupon'
import upload from './adapters/upload'
import statistics from './adapters/statistics'

const api = { auth, rider, category, dish, combo, order, h5, shop, coupon, upload, statistics }

export default api
export { IS_MOCK, resolveFileUrl } from './http'
export { adminUrl, userUrl, riderUrl, authUrl } from './urls'
