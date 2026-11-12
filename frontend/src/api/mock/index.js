/**
 * 内置演示数据（仅在 VITE_USE_MOCK=true 时生效）。
 *
 * 关键约定：这里返回的是**后端风格的原始报文**（{ code, msg, data }），
 * 和真实接口走同一个 unwrap + 同一个 adapter。
 * 绝不在这里直接返回“前端想要的形状”，否则切真接口那天要改 8 个页面。
 */

const DELAY = [120, 360]

const ok = (data) => ({ code: 0, msg: 'ok', data })
const fail = (code, msg) => ({ code, msg, data: null })

const STORE_KEY = 'dcy_mock_db'

const ROLE_TEXT = { ADMIN: 'ADMIN', STAFF: 'STAFF' }

function seed() {
  const now = Date.now()
  const names = [
    ['admin', '刘添祺', 'ADMIN', 1],
    ['zhangsan', '张三', 'STAFF', 1],
    ['lisi', '李四', 'STAFF', 1],
    ['wangwu', '王五', 'STAFF', 1],
    ['zhaoliu', '赵六', 'STAFF', 0],
    ['sunqi', '孙七', 'STAFF', 1],
    ['zhouba', '周八', 'STAFF', 1],
    ['wujiu', '吴九', 'STAFF', 0],
    ['zhengshi', '郑十', 'STAFF', 1],
    ['chenyi', '陈一', 'STAFF', 1]
  ]
  const rows = names.map(([username, name, role, status], i) => ({
    id: String(1001 + i),
    username,
    name,
    phone: `1380000${String(1000 + i)}`,
    role,
    status,
    lastLoginTime: new Date(now - i * 36e5 * 7).toISOString(),
    updateTime: new Date(now - i * 36e5 * 3).toISOString()
  }))
  for (let i = 10; i < 24; i++) {
    rows.push({
      id: String(1001 + i),
      username: `staff${i}`,
      name: `员工${i}`,
      phone: `1390000${String(2000 + i)}`,
      role: 'STAFF',
      status: i % 3 === 0 ? 0 : 1,
      lastLoginTime: new Date(now - i * 36e5 * 11).toISOString(),
      updateTime: new Date(now - i * 36e5 * 5).toISOString()
    })
  }
  return { employees: rows, seq: 1001 + rows.length }
}

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    /* 忽略损坏的本地数据 */
  }
  const db = seed()
  save(db)
  return db
}

function save(db) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(db))
  } catch (e) {
    /* 隐私模式下可能不可写，忽略 */
  }
}

function paginate(rows, { page = 1, pageSize = 10 } = {}) {
  const p = Number(page) || 1
  const s = Number(pageSize) || 10
  const start = (p - 1) * s
  return { total: rows.length, records: rows.slice(start, start + s), page: p, pageSize: s }
}

/* ------------------------------------------------------------------ 路由 */

const routes = [
  // 认证
  {
    method: 'post',
    url: /^\/login$/,
    handler: ({ data }) => {
      const { username, password } = data || {}
      if (username === 'admin' && password === 'admin1234') {
        return ok({
          token: 'mock-token-admin',
          user: { id: '1001', username: 'admin', name: '刘添祺', role: 'ADMIN' }
        })
      }
      if (username === 'staff' && password === 'staff1234') {
        return ok({
          token: 'mock-token-staff',
          user: { id: '1002', username: 'staff', name: '员工账号', role: 'STAFF' }
        })
      }
      return fail(2001, '账号或密码错误（演示账号：admin / admin1234）')
    }
  },
  {
    method: 'get',
    url: /^\/employee\/me$/,
    handler: () => {
      const token = localStorage.getItem('dcy_token') || ''
      if (token.includes('staff')) {
        return ok({ id: '1002', username: 'staff', name: '员工账号', role: 'STAFF' })
      }
      if (token.startsWith('mock-token')) {
        return ok({ id: '1001', username: 'admin', name: '刘添祺', role: 'ADMIN' })
      }
      return fail(401, '登录已过期，请重新登录')
    }
  },

  // 员工分页
  {
    method: 'get',
    url: /^\/employee\/page$/,
    handler: ({ params }) => {
      const db = load()
      let rows = db.employees.slice()
      const { name, username, role, status } = params || {}
      if (name) rows = rows.filter((r) => (r.name || '').includes(name))
      if (username) rows = rows.filter((r) => (r.username || '').includes(username))
      if (role) rows = rows.filter((r) => r.role === role)
      if (status !== undefined && status !== null && status !== '') {
        rows = rows.filter((r) => Number(r.status) === Number(status))
      }
      rows.sort((a, b) => (a.updateTime < b.updateTime ? 1 : -1))
      return ok(paginate(rows, params))
    }
  },

  // 新增员工
  {
    method: 'post',
    url: /^\/employee$/,
    handler: ({ data }) => {
      const db = load()
      if (db.employees.some((r) => r.username === data.username)) {
        return fail(4001, '账号已存在，请换一个')
      }
      const row = {
        id: String(db.seq++),
        username: data.username,
        name: data.name,
        phone: data.phone || '',
        role: ROLE_TEXT[data.role] ? data.role : 'STAFF',
        status: data.status === 0 ? 0 : 1,
        lastLoginTime: null,
        updateTime: new Date().toISOString()
      }
      db.employees.unshift(row)
      save(db)
      return ok(row)
    }
  },

  // 修改员工
  {
    method: 'put',
    url: /^\/employee$/,
    handler: ({ data }) => {
      const db = load()
      const row = db.employees.find((r) => String(r.id) === String(data.id))
      if (!row) return fail(4004, '员工不存在或已被删除')
      Object.assign(row, {
        name: data.name ?? row.name,
        phone: data.phone ?? row.phone,
        role: data.role ?? row.role,
        status: data.status === undefined ? row.status : Number(data.status),
        updateTime: new Date().toISOString()
      })
      save(db)
      return ok(row)
    }
  },

  // 删除员工
  {
    method: 'delete',
    url: /^\/employee\/(\w+)$/,
    handler: ({ match }) => {
      const db = load()
      const id = match[1]
      if (id === '1001') return fail(4002, '超级管理员不允许删除')
      const before = db.employees.length
      db.employees = db.employees.filter((r) => String(r.id) !== String(id))
      save(db)
      return before === db.employees.length ? fail(4004, '员工不存在') : ok(true)
    }
  },

  // 启用/停用
  {
    method: 'put',
    url: /^\/employee\/(\w+)\/status$/,
    handler: ({ match, params }) => {
      const db = load()
      const row = db.employees.find((r) => String(r.id) === String(match[1]))
      if (!row) return fail(4004, '员工不存在')
      row.status = Number(params?.status) === 0 ? 0 : 1
      row.updateTime = new Date().toISOString()
      save(db)
      return ok(row)
    }
  },

  // 统计看板（占位数据，等后端接口好了替换）
  {
    method: 'get',
    url: /^\/statistics\/overview$/,
    handler: () =>
      ok({
        turnover: 4820.5,
        orderCount: 128,
        avgPrice: 37.66,
        finishRate: 0.94,
        trend: [],
        statusDist: [],
        hotDishes: []
      })
  }
]

/* ------------------------------------------------------------------ 入口 */

export function mockRequest({ url, method = 'get', params, data }) {
  const path = String(url || '').replace(/^\/api/, '').split('?')[0]
  const m = String(method).toLowerCase()
  const route = routes.find((r) => r.method === m && r.url.test(path))
  const delay = DELAY[0] + Math.random() * (DELAY[1] - DELAY[0])

  return new Promise((resolve) => {
    setTimeout(() => {
      if (!route) {
        resolve(fail(404, `演示数据未覆盖该接口：${m.toUpperCase()} ${path}`))
        return
      }
      const match = path.match(route.url)
      try {
        resolve(route.handler({ params, data, match }))
      } catch (e) {
        resolve(fail(5000, e?.message || '演示数据内部错误'))
      }
    }, delay)
  })
}
