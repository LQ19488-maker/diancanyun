import dayjs from 'dayjs'

/** 金额：后端若以「分」存储，用这个转成元；已是元的直接用 formatMoney */
export function fenToYuan(fen) {
  const n = Number(fen)
  return Number.isFinite(n) ? n / 100 : 0
}

/** 元 → 分（提交给后端时用，避免浮点误差） */
export function yuanToFen(yuan) {
  const n = Number(yuan)
  return Number.isFinite(n) ? Math.round(n * 100) : 0
}

/** 金额显示：12.5 → "12.50"，空值显示 "—" */
export function formatMoney(v, digits = 2) {
  const n = Number(v)
  if (!Number.isFinite(n)) return '—'
  return n.toFixed(digits)
}

/** 带 ¥ 的金额 */
export function formatPrice(v) {
  const s = formatMoney(v)
  return s === '—' ? s : `¥${s}`
}

/** 日期时间：兼容字符串、时间戳、Date，后端换格式也不怕 */
export function formatDateTime(v, fmt = 'YYYY-MM-DD HH:mm:ss') {
  if (v === null || v === undefined || v === '') return '—'
  const d = dayjs(v)
  return d.isValid() ? d.format(fmt) : String(v)
}

export function formatDate(v) {
  return formatDateTime(v, 'YYYY-MM-DD')
}

/** 日期范围 → 后端查询参数（结束时间补到当天 23:59:59） */
export function buildDateRange(range) {
  if (!Array.isArray(range) || range.length !== 2) return {}
  return {
    startTime: dayjs(range[0]).startOf('day').format('YYYY-MM-DD HH:mm:ss'),
    endTime: dayjs(range[1]).endOf('day').format('YYYY-MM-DD HH:mm:ss')
  }
}

/** 手机号脱敏：138****8888 */
export function maskPhone(phone) {
  const s = String(phone || '')
  return s.length === 11 ? `${s.slice(0, 3)}****${s.slice(7)}` : s
}
