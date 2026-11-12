/**
 * 内置演示数据（仅在 VITE_USE_MOCK=true 时生效）。
 *
 * 关键约定：这里返回的是**后端风格的原始报文**（{ code, msg, data }），
 * 和真实接口走同一个 unwrap + 同一个 adapter。
 * 绝不在这里直接返回“前端想要的形状”，否则切真接口那天要改 8 个页面。
 */

const DELAY = [120, 360]

const ok = (data) => ({ code: 200, message: 'ok', data })
const fail = (code, message) => ({ code, message, data: null })

/** 数据结构变化时改版本号，旧的 localStorage 数据自动作废 */
const STORE_KEY = 'dcy_mock_db_v2'

function seed() {
  const now = Date.now()
  const ago = (h) => new Date(now - h * 36e5).toISOString()

  /* ---------------- 员工 ---------------- */
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
  const employees = names.map(([username, name, role, status], i) => ({
    id: String(1001 + i),
    username,
    name,
    phone: `1380000${String(1000 + i)}`,
    role,
    status,
    lastLoginTime: ago(i * 7),
    updateTime: ago(i * 3)
  }))
  for (let i = 10; i < 24; i++) {
    employees.push({
      id: String(1001 + i),
      username: `staff${i}`,
      name: `员工${i}`,
      phone: `1390000${String(2000 + i)}`,
      role: 'STAFF',
      status: i % 3 === 0 ? 0 : 1,
      lastLoginTime: ago(i * 11),
      updateTime: ago(i * 5)
    })
  }

  /* ---------------- 分类（type 1=菜品 2=套餐）---------------- */
  const rawCats = [
    ['热菜', 1, 1, 1, 24],
    ['凉菜', 1, 2, 1, 11],
    ['主食', 1, 3, 1, 9],
    ['汤品', 1, 4, 1, 6],
    ['饮品', 1, 5, 1, 12],
    ['甜点', 1, 6, 1, 5],
    ['小吃', 1, 7, 0, 0],
    ['单人套餐', 2, 1, 1, 4],
    ['双人套餐', 2, 2, 1, 3],
    ['家庭套餐', 2, 3, 1, 2],
    ['节日套餐', 2, 4, 0, 0]
  ]
  const categories = rawCats.map(([name, type, sort, status, dishCount], i) => ({
    id: String(2001 + i),
    name,
    type,
    sort,
    status,
    dishCount,
    updateTime: ago(i * 9)
  }))

  /* ---------------- 口味（按分类挂）---------------- */
  const flavors = {
    2001: [
      { name: '辣度', values: [{ name: '不辣' }, { name: '微辣' }, { name: '中辣' }, { name: '特辣' }] },
      { name: '份量', values: [{ name: '小份' }, { name: '大份' }] }
    ],
    2002: [{ name: '口味', values: [{ name: '清淡' }, { name: '重口' }] }],
    2005: [
      { name: '温度', values: [{ name: '常温' }, { name: '加冰' }, { name: '加热' }] },
      { name: '甜度', values: [{ name: '无糖' }, { name: '半糖' }, { name: '全糖' }] }
    ],
    2003: [{ name: '份量', values: [{ name: '小碗' }, { name: '大碗' }] }]
  }

  /* ---------------- 菜品（图片用内联 SVG，离线也能显示）---------------- */
  const thumb = (text, bg) => {
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96">` +
      `<rect width="96" height="96" rx="10" fill="${bg}"/>` +
      `<text x="48" y="60" font-size="40" text-anchor="middle" fill="#ffffff" ` +
      `font-family="Microsoft YaHei,sans-serif">${text}</text></svg>`
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
  }
  const palette = ['#e8833a', '#c0392b', '#2e7d5b', '#3a6ea5', '#8e5aa8', '#b8860b', '#4a7c59']
  const rawDishes = [
    ['宫保鸡丁', 2001, 38.0, [{ name: '辣度', values: ['微辣', '中辣'] }]],
    ['鱼香肉丝', 2001, 32.0, [{ name: '辣度', values: ['微辣'] }]],
    ['麻婆豆腐', 2001, 26.0, [{ name: '辣度', values: ['中辣', '特辣'] }]],
    ['红烧肉', 2001, 48.0, [{ name: '份量', values: ['小份', '大份'] }]],
    ['酸辣土豆丝', 2001, 18.0, [{ name: '辣度', values: ['微辣', '中辣'] }]],
    ['清蒸鲈鱼', 2001, 68.0, []],
    ['凉拌黄瓜', 2002, 14.0, [{ name: '口味', values: ['清淡'] }]],
    ['口水鸡', 2002, 36.0, [{ name: '口味', values: ['重口'] }]],
    ['凉拌木耳', 2002, 16.0, []],
    ['米饭', 2003, 2.0, [{ name: '份量', values: ['小碗', '大碗'] }]],
    ['蛋炒饭', 2003, 22.0, [{ name: '份量', values: ['小碗', '大碗'] }]],
    ['牛肉面', 2003, 28.0, [{ name: '份量', values: ['小碗', '大碗'] }]],
    ['番茄蛋汤', 2004, 12.0, []],
    ['酸辣汤', 2004, 16.0, [{ name: '辣度', values: ['微辣'] }]],
    ['排骨汤', 2004, 32.0, []],
    ['柠檬水', 2005, 10.0, [{ name: '温度', values: ['常温', '加冰'] }, { name: '甜度', values: ['无糖', '半糖'] }]],
    ['可口可乐', 2005, 6.0, [{ name: '温度', values: ['常温', '加冰'] }]],
    ['鲜榨橙汁', 2005, 18.0, [{ name: '温度', values: ['常温', '加冰'] }, { name: '甜度', values: ['全糖'] }]],
    ['酸梅汤', 2005, 12.0, [{ name: '温度', values: ['加冰'] }]],
    ['红豆双皮奶', 2006, 16.0, []],
    ['杨枝甘露', 2006, 22.0, []],
    ['炸鸡块', 2007, 24.0, [{ name: '辣度', values: ['不辣', '微辣'] }]],
    ['薯条', 2007, 15.0, []],
    ['烤鸡翅', 2007, 28.0, [{ name: '辣度', values: ['微辣', '中辣'] }]]
  ]
  const dishes = rawDishes.map(([name, categoryId, price, flavors], i) => ({
    id: String(3001 + i),
    name,
    categoryId: String(categoryId),
    price,
    image: thumb(name.slice(0, 1), palette[i % palette.length]),
    description: `${name}，现点现做`,
    status: i % 7 === 5 ? 0 : 1,
    flavors,
    updateTime: ago(i * 4 + 1)
  }))

  /* ---------------- 套餐（引用菜品 id）---------------- */
  const rawCombos = [
    ['单人A餐', 2008, 38.0, ['3001', '3010', '3016'], 1],
    ['单人B餐', 2008, 42.0, ['3003', '3010', '3019'], 1],
    ['双人超值餐', 2009, 88.0, ['3001', '3004', '3011', '3010', '3017'], 1],
    ['双人轻食餐', 2009, 76.0, ['3007', '3009', '3018', '3010'], 1],
    ['家庭欢聚餐', 2010, 168.0, ['3006', '3005', '3011', '3010', '3019', '3020'], 1],
    ['节日限定餐', 2011, 128.0, ['3002', '3004', '3021', '3022'], 0]
  ]
  const combos = rawCombos.map(([name, categoryId, price, dishIds, status], i) => ({
    id: String(4001 + i),
    name,
    categoryId: String(categoryId),
    price,
    dishIds,
    image: thumb(name.slice(0, 1), palette[(i + 3) % palette.length]),
    description: `${name}，含 ${dishIds.length} 道菜`,
    status,
    updateTime: ago(i * 6 + 2)
  }))

  return {
    employees, categories, flavors, dishes, combos,
    seqEmp: 1001 + employees.length,
    seqCat: 2001 + categories.length,
    seqDish: 3001 + dishes.length,
    seqCombo: 4001 + combos.length
  }
}

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (raw) {
      const db = JSON.parse(raw)
      if (db && Array.isArray(db.categories)) return db
    }
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

const notEmpty = (v) => v !== undefined && v !== null && v !== ''

/* ------------------------------------------------------------------ 路由 */

const routes = [
  /* ---------------- 认证 ---------------- */
  {
    method: 'post',
    url: /^\/admin\/login$/, 
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
    url: /^\/admin\/employee\/me$/, 
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

  /* ---------------- 员工 ---------------- */
  {
    method: 'get',
    url: /^\/admin\/employee\/page$/, 
    handler: ({ params }) => {
      const db = load()
      let rows = db.employees.slice()
      const { name, username, role, status } = params || {}
      if (name) rows = rows.filter((r) => (r.name || '').includes(name))
      if (username) rows = rows.filter((r) => (r.username || '').includes(username))
      if (role) rows = rows.filter((r) => r.role === role)
      if (notEmpty(status)) rows = rows.filter((r) => Number(r.status) === Number(status))
      rows.sort((a, b) => (a.updateTime < b.updateTime ? 1 : -1))
      return ok(paginate(rows, params))
    }
  },
  {
    method: 'post',
    url: /^\/admin\/employee$/, 
    handler: ({ data }) => {
      const db = load()
      if (db.employees.some((r) => r.username === data.username)) {
        return fail(4001, '账号已存在，请换一个')
      }
      const row = {
        id: String(db.seqEmp++),
        username: data.username,
        name: data.name,
        phone: data.phone || '',
        role: data.role === 'ADMIN' ? 'ADMIN' : 'STAFF',
        status: Number(data.status) === 0 ? 0 : 1,
        lastLoginTime: null,
        updateTime: new Date().toISOString()
      }
      db.employees.unshift(row)
      save(db)
      return ok(row)
    }
  },
  {
    method: 'put',
    url: /^\/admin\/employee$/, 
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
  {
    method: 'delete',
    url: /^\/admin\/employee\/(\w+)$/, 
    handler: ({ match }) => {
      const db = load()
      if (match[1] === '1001') return fail(4002, '超级管理员不允许删除')
      const before = db.employees.length
      db.employees = db.employees.filter((r) => String(r.id) !== String(match[1]))
      save(db)
      return before === db.employees.length ? fail(4004, '员工不存在') : ok(true)
    }
  },
  {
    method: 'put',
    url: /^\/admin\/employee\/(\w+)\/status$/, 
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

  /* ---------------- 分类 ---------------- */
  {
    method: 'get',
    url: /^\/admin\/category\/page$/, 
    handler: ({ params }) => {
      const db = load()
      let rows = db.categories.slice()
      const { type, name, status } = params || {}
      if (notEmpty(type)) rows = rows.filter((r) => Number(r.type) === Number(type))
      if (name) rows = rows.filter((r) => (r.name || '').includes(name))
      if (notEmpty(status)) rows = rows.filter((r) => Number(r.status) === Number(status))
      rows.sort((a, b) => Number(a.sort) - Number(b.sort) || (a.id < b.id ? 1 : -1))
      return ok(paginate(rows, params))
    }
  },
  {
    method: 'post',
    url: /^\/admin\/category$/, 
    handler: ({ data }) => {
      const db = load()
      const type = Number(data.type) === 2 ? 2 : 1
      if (db.categories.some((r) => r.type === type && r.name === data.name)) {
        return fail(4001, '同类下已存在同名分类')
      }
      const row = {
        id: String(db.seqCat++),
        name: (data.name || '').trim(),
        type,
        sort: Number(data.sort) || 1,
        status: Number(data.status) === 0 ? 0 : 1,
        dishCount: 0,
        updateTime: new Date().toISOString()
      }
      db.categories.push(row)
      save(db)
      return ok(row)
    }
  },
  {
    method: 'put',
    url: /^\/admin\/category$/, 
    handler: ({ data }) => {
      const db = load()
      const row = db.categories.find((r) => String(r.id) === String(data.id))
      if (!row) return fail(4004, '分类不存在或已被删除')
      Object.assign(row, {
        name: data.name ?? row.name,
        sort: data.sort === undefined ? row.sort : Number(data.sort),
        status: data.status === undefined ? row.status : Number(data.status),
        updateTime: new Date().toISOString()
      })
      save(db)
      return ok(row)
    }
  },
  {
    method: 'delete',
    url: /^\/admin\/category\/(\w+)$/, 
    handler: ({ match }) => {
      const db = load()
      const row = db.categories.find((r) => String(r.id) === String(match[1]))
      if (!row) return fail(4004, '分类不存在')
      if (Number(row.dishCount) > 0) {
        return fail(4001, `该分类下还有 ${row.dishCount} 个${row.type === 2 ? '套餐' : '菜品'}，无法删除`)
      }
      db.categories = db.categories.filter((r) => String(r.id) !== String(match[1]))
      delete db.flavors[match[1]]
      save(db)
      return ok(true)
    }
  },

  /* ---------------- 口味（按分类整体覆盖）---------------- */
  {
    method: 'get',
    url: /^\/admin\/flavor\/(\w+)$/, 
    handler: ({ match }) => {
      const db = load()
      const cat = db.categories.find((r) => String(r.id) === String(match[1]))
      if (!cat) return fail(4004, '分类不存在')
      return ok({ categoryId: String(match[1]), flavors: db.flavors[match[1]] || [] })
    }
  },
  {
    method: 'put',
    url: /^\/admin\/flavor\/(\w+)$/, 
    handler: ({ match, data }) => {
      const db = load()
      const cat = db.categories.find((r) => String(r.id) === String(match[1]))
      if (!cat) return fail(4004, '分类不存在')
      const flavors = (data?.flavors || [])
        .map((f) => ({
          name: (f.name || '').trim(),
          values: (f.values || []).map((v) => ({ name: (v.name || '').trim() })).filter((v) => v.name)
        }))
        .filter((f) => f.name)
      if (flavors.some((f) => f.values.length === 0)) {
        return fail(1001, '每个口味至少要有一个口味值')
      }
      db.flavors[match[1]] = flavors
      save(db)
      return ok({ categoryId: String(match[1]), flavors })
    }
  },

  /* ---------------- 菜品 ---------------- */
  {
    method: 'get',
    url: /^\/admin\/dish\/page$/,
    handler: ({ params }) => {
      const db = load()
      const catName = (id) => (db.categories.find((c) => String(c.id) === String(id)) || {}).name || ''
      let rows = (db.dishes || []).map((d) => ({ ...d, categoryName: catName(d.categoryId) }))
      const { name, categoryId, status } = params || {}
      if (name) rows = rows.filter((r) => (r.name || '').includes(name))
      if (notEmpty(categoryId)) rows = rows.filter((r) => String(r.categoryId) === String(categoryId))
      if (notEmpty(status)) rows = rows.filter((r) => Number(r.status) === Number(status))
      rows.sort((a, b) => (a.updateTime < b.updateTime ? 1 : -1))
      return ok(paginate(rows, params))
    }
  },
  {
    method: 'post',
    url: /^\/admin\/dish$/,
    handler: ({ data }) => {
      const db = load()
      const type = Number((db.categories.find((c) => String(c.id) === String(data.categoryId)) || {}).type)
      if (type !== 1) return fail(1001, '请选择菜品分类（套餐分类不能放菜品）')
      if (db.dishes.some((d) => d.name === data.name)) return fail(4001, '已存在同名菜品')
      const row = {
        id: String(db.seqDish++),
        name: (data.name || '').trim(),
        categoryId: String(data.categoryId),
        price: Number(data.price) || 0,
        image: data.image || '',
        description: data.description || '',
        status: Number(data.status) === 0 ? 0 : 1,
        flavors: data.flavors || [],
        updateTime: new Date().toISOString()
      }
      db.dishes.unshift(row)
      save(db)
      return ok(row)
    }
  },
  {
    method: 'put',
    url: /^\/admin\/dish$/,
    handler: ({ data }) => {
      const db = load()
      const row = db.dishes.find((d) => String(d.id) === String(data.id))
      if (!row) return fail(4004, '菜品不存在或已被删除')
      Object.assign(row, {
        name: data.name ?? row.name,
        categoryId: data.categoryId === undefined ? row.categoryId : String(data.categoryId),
        price: data.price === undefined ? row.price : Number(data.price),
        image: data.image === undefined ? row.image : data.image,
        description: data.description === undefined ? row.description : data.description,
        status: data.status === undefined ? row.status : Number(data.status),
        flavors: data.flavors === undefined ? row.flavors : data.flavors,
        updateTime: new Date().toISOString()
      })
      save(db)
      return ok(row)
    }
  },
  {
    method: 'delete',
    url: /^\/admin\/dish\/(\w+)$/,
    handler: ({ match }) => {
      const db = load()
      const before = db.dishes.length
      db.dishes = db.dishes.filter((d) => String(d.id) !== String(match[1]))
      save(db)
      return before === db.dishes.length ? fail(4004, '菜品不存在') : ok(true)
    }
  },
  {
    method: 'put',
    url: /^\/admin\/dish\/(\w+)\/status$/,
    handler: ({ match, params }) => {
      const db = load()
      const row = db.dishes.find((d) => String(d.id) === String(match[1]))
      if (!row) return fail(4004, '菜品不存在')
      row.status = Number(params?.status) === 0 ? 0 : 1
      row.updateTime = new Date().toISOString()
      save(db)
      return ok(row)
    }
  },

  /* ---------------- 套餐 ---------------- */
  {
    method: 'get',
    url: /^\/admin\/combo\/page$/,
    handler: ({ params }) => {
      const db = load()
      const catName = (id) => (db.categories.find((c) => String(c.id) === String(id)) || {}).name || ''
      const dishById = (id) => (db.dishes || []).find((d) => String(d.id) === String(id))
      let rows = (db.combos || []).map((c) => {
        const dishes = (c.dishIds || []).map(dishById).filter(Boolean)
        return {
          ...c,
          categoryName: catName(c.categoryId),
          dishCount: dishes.length,
          dishes: dishes.map((d) => ({ id: String(d.id), name: d.name, price: d.price })),
          originPrice: Number(dishes.reduce((s, d) => s + Number(d.price || 0), 0).toFixed(2))
        }
      })
      const { name, categoryId, status } = params || {}
      if (name) rows = rows.filter((r) => (r.name || '').includes(name))
      if (notEmpty(categoryId)) rows = rows.filter((r) => String(r.categoryId) === String(categoryId))
      if (notEmpty(status)) rows = rows.filter((r) => Number(r.status) === Number(status))
      rows.sort((a, b) => (a.updateTime < b.updateTime ? 1 : -1))
      return ok(paginate(rows, params))
    }
  },
  {
    method: 'get',
    url: /^\/admin\/combo\/(\w+)$/,
    handler: ({ match }) => {
      const db = load()
      const row = (db.combos || []).find((c) => String(c.id) === String(match[1]))
      if (!row) return fail(4004, '套餐不存在')
      const dishById = (id) => (db.dishes || []).find((d) => String(d.id) === String(id))
      return ok({
        ...row,
        dishes: (row.dishIds || []).map(dishById).filter(Boolean)
      })
    }
  },
  {
    method: 'post',
    url: /^\/admin\/combo$/,
    handler: ({ data }) => {
      const db = load()
      const cat = db.categories.find((c) => String(c.id) === String(data.categoryId))
      if (!cat || Number(cat.type) !== 2) return fail(1001, '请选择套餐分类（菜品分类不能放套餐）')
      if (!data.dishIds || !data.dishIds.length) return fail(1001, '套餐至少要选 1 个菜品')
      if (db.combos.some((c) => c.name === data.name)) return fail(4001, '已存在同名套餐')
      const row = {
        id: String(db.seqCombo++),
        name: (data.name || '').trim(),
        categoryId: String(data.categoryId),
        price: Number(data.price) || 0,
        dishIds: data.dishIds.map(String),
        image: data.image || '',
        description: data.description || '',
        status: Number(data.status) === 0 ? 0 : 1,
        updateTime: new Date().toISOString()
      }
      db.combos.unshift(row)
      save(db)
      return ok(row)
    }
  },
  {
    method: 'put',
    url: /^\/admin\/combo$/,
    handler: ({ data }) => {
      const db = load()
      const row = db.combos.find((c) => String(c.id) === String(data.id))
      if (!row) return fail(4004, '套餐不存在或已被删除')
      if (data.dishIds && !data.dishIds.length) return fail(1001, '套餐至少要选 1 个菜品')
      Object.assign(row, {
        name: data.name ?? row.name,
        categoryId: data.categoryId === undefined ? row.categoryId : String(data.categoryId),
        price: data.price === undefined ? row.price : Number(data.price),
        dishIds: data.dishIds === undefined ? row.dishIds : data.dishIds.map(String),
        image: data.image === undefined ? row.image : data.image,
        description: data.description === undefined ? row.description : data.description,
        status: data.status === undefined ? row.status : Number(data.status),
        updateTime: new Date().toISOString()
      })
      save(db)
      return ok(row)
    }
  },
  {
    method: 'delete',
    url: /^\/admin\/combo\/(\w+)$/,
    handler: ({ match }) => {
      const db = load()
      const before = (db.combos || []).length
      db.combos = (db.combos || []).filter((c) => String(c.id) !== String(match[1]))
      save(db)
      return before === db.combos.length ? fail(4004, '套餐不存在') : ok(true)
    }
  },
  {
    method: 'put',
    url: /^\/admin\/combo\/(\w+)\/status$/,
    handler: ({ match, params }) => {
      const db = load()
      const row = (db.combos || []).find((c) => String(c.id) === String(match[1]))
      if (!row) return fail(4004, '套餐不存在')
      row.status = Number(params?.status) === 0 ? 0 : 1
      row.updateTime = new Date().toISOString()
      save(db)
      return ok(row)
    }
  },

  /* ---------------- 图片上传（演示环境用内联 SVG 顶替）---------------- */
  {
    method: 'post',
    url: /^\/admin\/upload$/,
    handler: () =>
      ok({
        url:
          'data:image/svg+xml;charset=utf-8,' +
          encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96">' +
              '<rect width="96" height="96" rx="10" fill="#94a3b8"/>' +
              '<text x="48" y="60" font-size="34" text-anchor="middle" fill="#fff">图</text></svg>'
          )
      })
  },

  /* ---------------- 统计看板 ---------------- */
  {
    method: 'get',
    url: /^\/admin\/statistics\/overview$/, 
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
