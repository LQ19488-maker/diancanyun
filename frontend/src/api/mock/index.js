/**
 * 内置演示数据（仅在 VITE_USE_MOCK=true 时生效）。
 *
 * 关键约定：这里返回的是**后端风格的原始报文**（{ code, msg, data }），
 * 和真实接口走同一个 unwrap + 同一个 adapter。
 * 绝不在这里直接返回“前端想要的形状”，否则切真接口那天要改 8 个页面。
 */

import { DEMO_ACCOUNTS, ACCOUNT_ROLE, ACCOUNT_SHOP } from '../../constants/demoAccounts.js'

const DELAY = [120, 360]

const ok = (data) => ({ code: 200, message: 'ok', data })
const fail = (code, message) => ({ code, message, data: null })

/** 数据结构变化时改版本号，旧的 localStorage 数据自动作废 */
const STORE_KEY = 'dcy_mock_db_v10'

function seed() {
  const now = Date.now()
  const ago = (h) => new Date(now - h * 36e5).toISOString()

  /* ---------------- 骑手 ---------------- */
  const rawRiders = [
    ['rider', '王小明', '13800001001', '中关村站', '电动车', 1, 1, 26, 2, 4.9],
    ['rider2', '桂誉', '13800001002', '中关村站', '电动车', 1, 1, 21, 1, 4.8],
    ['zhangwei', '张伟', '13800001003', '五道口站', '电动车', 1, 1, 18, 0, 4.7],
    ['lina', '李娜', '13800001004', '五道口站', '摩托车', 1, 0, 12, 0, 4.6],
    ['wangqiang', '王强', '13800001005', '望京站', '电动车', 1, 1, 30, 3, 5.0],
    ['zhaomin', '赵敏', '13800001006', '望京站', '自行车', 1, 0, 9, 0, 4.4],
    ['chenjie', '陈杰', '13800001007', '国贸站', '电动车', 1, 1, 24, 1, 4.8],
    ['sunli', '孙丽', '13800001008', '国贸站', '电动车', 0, 0, 6, 0, 4.2],
    ['zhouyang', '周洋', '13800001009', '西二旗站', '摩托车', 1, 1, 15, 2, 4.5],
    ['wuting', '吴婷', '13800001010', '西二旗站', '电动车', 1, 0, 11, 0, 4.3]
  ]
  const riders = rawRiders.map(
    ([username, name, phone, area, vehicle, status, online, todayDone, onTheWay, rating], i) => ({
      id: String(1001 + i),
      username,
      code: 'R' + String(1001 + i),
      name,
      phone,
      area,
      vehicle,
      status,
      online,
      todayDone,
      onTheWay,
      rating,
      updateTime: ago(i * 3 + 1)
    })
  )

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
    shopId: '8001',
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
    shopId: '8001',
    name,
    categoryId: String(categoryId),
    price,
    image: thumb(name.slice(0, 1), palette[i % palette.length]),
    description: `${name}，现点现做`,
    status: i % 7 === 5 ? 0 : 1,
    flavors,
    updateTime: ago(i * 4 + 1)
  }))

  /* ---------------- 第二家店：外婆家·五道口店（8002），有自己的分类和菜品 ---------------- */
  const rawCats2 = [
    ['招牌菜', 1, 1, 1],
    ['家常小炒', 1, 2, 1],
    ['汤羹', 1, 3, 1],
    ['主食', 1, 4, 1],
    ['单人套餐', 2, 1, 1],
    ['双人套餐', 2, 2, 1]
  ]
  const categories2 = rawCats2.map(([name, type, sort, status], i) => ({
    id: String(2101 + i),
    shopId: '8002',
    name,
    type,
    sort,
    status,
    dishCount: 0,
    updateTime: ago(i * 5 + 3)
  }))

  const rawDishes2 = [
    ['外婆红烧肉', 2101, 62.0, [{ name: '份量', values: ['小份', '大份'] }], '招牌，慢炖两小时'],
    ['龙井虾仁', 2101, 88.0, [], '现剥河虾仁，配新茶'],
    ['西湖醋鱼', 2101, 78.0, [], '草鱼现杀，酸甜适口'],
    ['东坡肉', 2101, 58.0, [{ name: '份量', values: ['一块', '两块'] }], '肥而不腻'],
    ['手撕包菜', 2102, 26.0, [{ name: '辣度', values: ['不辣', '微辣', '中辣'] }], '锅气足，很下饭'],
    ['干煸四季豆', 2102, 32.0, [{ name: '辣度', values: ['微辣', '中辣'] }], '干香不油'],
    ['蒜蓉粉丝娃娃菜', 2102, 36.0, [], '蒜香浓郁'],
    ['老鸭汤', 2103, 48.0, [], '砂锅慢煨，汤清味厚'],
    ['西湖牛肉羹', 2103, 28.0, [], '勾芡顺滑，胡椒微辣'],
    ['葱油拌面', 2104, 18.0, [{ name: '份量', values: ['小碗', '大碗'] }], '葱油现熬'],
    ['片儿川', 2104, 26.0, [{ name: '份量', values: ['小碗', '大碗'] }], '雪菜笋片肉丝面']
  ]
  const dishes2 = rawDishes2.map(([name, categoryId, price, flavors, desc], i) => ({
    id: String(3101 + i),
    shopId: '8002',
    name,
    categoryId: String(categoryId),
    price,
    image: thumb(name.slice(0, 1), palette[(i + 2) % palette.length]),
    description: desc,
    status: 1,
    flavors,
    updateTime: ago(i * 3 + 2)
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
    shopId: '8001',
    name,
    categoryId: String(categoryId),
    price,
    dishIds,
    image: thumb(name.slice(0, 1), palette[(i + 3) % palette.length]),
    description: `${name}，含 ${dishIds.length} 道菜`,
    status,
    updateTime: ago(i * 6 + 2)
  }))

  /* ---------------- 订单 ---------------- */
  const ORDER_FLOW = ['PENDING', 'ACCEPTED', 'DELIVERING', 'DONE']
  const CUSTOMERS = [
    ['胡粤毫', '13800001111', '北京市海淀区中关村大街 1 号 A 座 1201'],
    ['李静', '13900002222', '北京市海淀区知春路 6 号院 3 号楼 502'],
    ['张伟', '13700003333', '北京市海淀区五道口华清嘉园 12 楼 3 单元 502'],
    ['刘敏', '13600004444', '北京市海淀区科学院南路 8 号 2 号楼 1806'],
    ['陈晨', '13500005555', '北京市海淀区苏州街 20 号 B 座 907'],
    ['赵磊', '13400006666', '北京市海淀区丹棱街 3 号 1 号楼 601'],
    ['孙悦', '13300007777', '北京市海淀区上地十街 1 号院 5 号楼 1102'],
    ['周涛', '13200008888', '北京市海淀区西二旗大街 10 号院 6 号楼 803']
  ]
  const pickDishes = (seed, pool = dishes) => {
    const n = 1 + (seed % 3)
    const picked = []
    for (let k = 0; k < n; k++) {
      const d = pool[(seed * 3 + k * 7) % pool.length]
      const qty = 1 + ((seed + k) % 2)
      picked.push({
        dishId: String(d.id),
        dishName: d.name,
        quantity: qty,
        unitPrice: Number(d.price),
        amount: Number((d.price * qty).toFixed(2)),
        flavors: (d.flavors || []).map((f) => `${f.name}:${(f.values || []).join('/')}`).filter(Boolean)
      })
    }
    return picked
  }
  const orders = []
  for (let i = 0; i < 28; i++) {
    const [userName, phone, addrDetail] = CUSTOMERS[i % CUSTOMERS.length]
    // 每三单里有一单属于外婆家·五道口店（8002），菜品从它自己的菜单里挑
    const isShop2 = i % 3 === 2
    const items = pickDishes(i + 1, isShop2 ? dishes2 : dishes)
    const amount = Number(items.reduce((t, x) => t + x.amount, 0).toFixed(2))
    const deliveryFee = isShop2 ? 4 : i % 2 === 0 ? 3 : 2
    // 前 20 条铺满各状态，后面几条集中在待接单，方便演示
    // 加一个 floor(i/8) 偏移，让同一个顾客的连续几单落在不同状态上
    const status = i < 20 ? ORDER_FLOW[(i + Math.floor(i / 8)) % 4] : i % 5 === 0 ? 'CANCELED' : 'PENDING'
    // 摊到近 30 天，趋势图才有内容
    const createdAt = new Date(now - (i * 0.85 * 86400 + 1800) * 1000).toISOString()
    const idx = ORDER_FLOW.indexOf(status)
    const timeline = [{ status: 'PENDING', time: createdAt }]
    for (let k = 1; k <= (idx === -1 ? 0 : idx); k++) {
      timeline.push({
        status: ORDER_FLOW[k],
        time: new Date(new Date(createdAt).getTime() + k * 9 * 3600000).toISOString()
      })
    }
    if (status === 'CANCELED') {
      timeline.push({ status: 'CANCELED', time: new Date(new Date(createdAt).getTime() + 4 * 3600000).toISOString() })
    }
    const needRider = status === 'DELIVERING' || status === 'DONE'
    // 演示账号 rider / rider2 就是前两位骑手：在途单派给别人，
    // 这样刚登录时「我的配送」是干净的（不会一进来就顶个红点），已完成的历史单照样留着
    const riderRow = !needRider
      ? null
      : riders[status === 'DELIVERING' ? 2 + (i % Math.max(1, riders.length - 2)) : i % riders.length]
    orders.push({
      id: String(5001 + i),
      orderNo: 'DC' + String(now).slice(-6) + String(1001 + i),
      riderId: riderRow ? String(riderRow.id) : '',
      riderName: riderRow ? riderRow.name : '',
      riderPhone: riderRow ? riderRow.phone : '',
      shopId: isShop2 ? '8002' : '8001',
      shopName: isShop2 ? '外婆家·五道口店' : '点单云·中关村店',
      userName,
      phone,
      tableNo: '外卖配送',
      address: addrDetail,
      addressInfo: { name: userName, phone, detail: addrDetail, tag: i % 2 === 0 ? '公司' : '家' },
      items,
      amount,
      packFee: 0,
      deliveryFee,
      totalAmount: Number((amount + deliveryFee).toFixed(2)),
      remark: i % 5 === 0 ? '不要香菜，少放辣' : '',
      payStatus: i % 4 === 3 ? 'UNPAID' : 'PAID',
      status,
      createdAt,
      timeline
    })
  }

  // 再补 4 单「最近一天内已完成」的订单：两家店在近 7 天看板上都有数据，不会是 0
  ;[
    ['8001', '点单云·中关村店', 3, dishes, 0.15, 0],
    ['8001', '点单云·中关村店', 2, dishes, 0.6, 1],
    ['8002', '外婆家·五道口店', 4, dishes2, 0.3, 2],
    ['8002', '外婆家·五道口店', 4, dishes2, 0.9, 3]
  ].forEach(([shopId, shopName, deliveryFee, pool, daysAgo], k) => {
    const base = now - daysAgo * 86400000
    const at = (min) => new Date(base + min * 60000).toISOString()
    const items = pickDishes(40 + k, pool)
    const amount = Number(items.reduce((t, x) => t + x.amount, 0).toFixed(2))
    const [userName, phone, addrDetail] = CUSTOMERS[(k + 2) % CUSTOMERS.length]
    const riderRow = riders[(k + 1) % riders.length]
    orders.unshift({
      id: String(5101 + k),
      orderNo: 'DC' + String(now).slice(-6) + String(2001 + k),
      riderId: String(riderRow.id),
      riderName: riderRow.name,
      riderPhone: riderRow.phone,
      shopId,
      shopName,
      userName,
      phone,
      tableNo: '外卖配送',
      address: addrDetail,
      addressInfo: { name: userName, phone, detail: addrDetail, tag: k % 2 === 0 ? '公司' : '家' },
      items,
      amount,
      packFee: 0,
      deliveryFee,
      totalAmount: Number((amount + deliveryFee).toFixed(2)),
      remark: '',
      payStatus: 'PAID',
      status: 'DONE',
      createdAt: at(0),
      timeline: [
        { status: 'PENDING', time: at(0) },
        { status: 'ACCEPTED', time: at(20) },
        { status: 'DELIVERING', time: at(45) },
        { status: 'DONE', time: at(70) }
      ]
    })
  })

  /* ---------------- 店铺（平台视角；当前只有第一家接入了完整菜单）---------------- */
  const rawShops = [
    ['点单云·中关村店', 4.9, 1286, 20, 3, 32, '1.2km', '新店开业，满 30 减 5', 1, true, ['川菜', '家常菜']],
    ['外婆家·五道口店', 4.7, 2431, 25, 4, 38, '2.4km', '招牌红烧肉第二份半价', 1, true, ['家常菜', '江浙菜']],
    ['蜀香源·望京店', 4.6, 892, 20, 3, 41, '3.8km', '', 1, false, ['川菜', '火锅']],
    ['轻食沙拉·国贸店', 4.8, 1560, 30, 5, 28, '0.9km', '低卡轻食，配送快', 1, false, ['轻食', '健康餐']],
    ['老北京炸酱面·西二旗店', 4.4, 703, 15, 2, 45, '5.1km', '', 1, false, ['面食', '京菜']],
    ['深夜食堂·中关村店', 4.9, 3210, 25, 4, 35, '1.6km', '夜宵满 50 减 10', 0, false, ['夜宵', '烧烤']]
  ]
  const shops = rawShops.map(([name, rating, monthlySales, minPrice, deliveryFee, deliveryTime, distance, notice, status, openMenu, tags], i) => ({
    id: String(8001 + i),
    name,
    image: thumb('店', palette[i % palette.length]),
    rating,
    monthlySales,
    minPrice,
    deliveryFee,
    deliveryTime,
    distance,
    notice,
    status,
    openMenu: Boolean(openMenu),
    tags
  }))

  /* ---------------- 收货地址（演示固定属于顾客 customer）---------------- */
  const addresses = [
    { id: '9001', userId: '9002', tag: '公司', name: '胡粤毫', phone: '13800001111', detail: '北京市海淀区中关村大街 1 号 A 座 1201', isDefault: 1 },
    { id: '9002', userId: '9002', tag: '家', name: '胡粤毫', phone: '13800001111', detail: '北京市海淀区五道口华清嘉园 12 楼 3 单元 502', isDefault: 0 }
  ]

  const rawCombos2 = [
    ['外婆家单人餐', 2105, 78.0, ['3101', '3110'], 1],
    ['外婆家双人餐', 2106, 168.0, ['3101', '3102', '3105', '3111'], 1]
  ]
  const combos2 = rawCombos2.map(([name, categoryId, price, dishIds, status], i) => ({
    id: String(4101 + i),
    shopId: '8002',
    name,
    categoryId: String(categoryId),
    price,
    dishIds,
    image: thumb(name.slice(0, 1), palette[(i + 5) % palette.length]),
    description: `${name}，含 ${dishIds.length} 道菜`,
    status,
    updateTime: ago(i * 7 + 4)
  }))
  // 分类上的「关联数量」按真实数据算一遍，商家后台显示才对
  categories2.forEach((c) => {
    const pool = Number(c.type) === 2 ? combos2 : dishes2
    c.dishCount = pool.filter((x) => String(x.categoryId) === String(c.id)).length
  })

  return {
    riders,
    categories: [...categories, ...categories2],
    flavors,
    dishes: [...dishes, ...dishes2],
    combos: [...combos, ...combos2],
    orders,
    shops,
    addresses,
    seqAddress: 9003,
    seqShop: 8007,
    seqRider: 1001 + riders.length,
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

/**
 * 当前登录的商家管哪家店（模拟后端的「数据权限」）。
 * 取不到（比如顾客/骑手/未登录）就退回第一家店，保证公开页面和有历史数据的场景不炸。
 */
function currentShop() {
  try {
    const token = localStorage.getItem('dcy_token') || ''
    const username = token.replace('mock-token-', '')
    return ACCOUNT_SHOP[username] || ACCOUNT_SHOP.merchant
  } catch {
    return ACCOUNT_SHOP.merchant
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
    url: /^\/auth\/login$/,
    handler: ({ data }) => {
      const db = load()
      const username = String((data && data.username) || '').trim()
      const password = String((data && data.password) || '')
      const account = DEMO_ACCOUNTS.find((a) => a.username === username)
      if (!account || account.password !== password) {
        const hints = DEMO_ACCOUNTS.map((a) => `${a.username}/${a.password}`).join('、')
        return fail(2001, `账号或密码错误（演示账号：${hints}）`)
      }
      const role = ACCOUNT_ROLE[username] || 'CUSTOMER'
      const rider = (db.riders || []).find((r) => r.username === username)
      const shop = ACCOUNT_SHOP[username] || null
      return ok({
        token: 'mock-token-' + username,
        user: {
          id: rider ? String(rider.id) : role === 'MERCHANT' ? '9001' : '9002',
          username,
          name: rider ? rider.name : account.name,
          role,
          shopId: shop ? shop.id : '',
          shopName: shop ? shop.name : ''
        }
      })
    }
  },
  {
    method: 'get',
    url: /^\/auth\/me$/,
    handler: () => {
      const token = localStorage.getItem('dcy_token') || ''
      if (!token.startsWith('mock-token-')) return fail(401, '登录已过期，请重新登录')
      const username = token.slice('mock-token-'.length)
      const account = DEMO_ACCOUNTS.find((a) => a.username === username)
      if (!account) return fail(401, '登录已过期，请重新登录')
      const db = load()
      const role = ACCOUNT_ROLE[username] || 'CUSTOMER'
      const rider = (db.riders || []).find((r) => r.username === username)
      const shop = ACCOUNT_SHOP[username] || null
      return ok({
        id: rider ? String(rider.id) : role === 'MERCHANT' ? '9001' : '9002',
        username,
        name: rider ? rider.name : account.name,
        role,
        shopId: shop ? shop.id : '',
        shopName: shop ? shop.name : ''
      })
    }
  },

  /* ---------------- 骑手 ---------------- */
  {
    method: 'get',
    url: /^\/admin\/rider\/page$/,
    handler: ({ params }) => {
      const db = load()
      let rows = (db.riders || []).slice()
      const { name, code, area, online, status } = params || {}
      if (name) rows = rows.filter((r) => (r.name || '').includes(name))
      if (code) rows = rows.filter((r) => (r.code || '').includes(code))
      if (area) rows = rows.filter((r) => (r.area || '').includes(area))
      if (notEmpty(online)) rows = rows.filter((r) => Number(r.online) === Number(online))
      if (notEmpty(status)) rows = rows.filter((r) => Number(r.status) === Number(status))
      rows.sort((a, b) => (a.updateTime < b.updateTime ? 1 : -1))
      // 「完成 / 在途」也从订单里数，和骑手端看到的一致，不再是写死的演示数字
      const orders = db.orders || []
      rows = rows.map((r) => {
        const mine = orders.filter((o) => String(o.riderId) === String(r.id))
        return {
          ...r,
          doneCount: mine.filter((o) => o.status === 'DONE').length,
          onTheWay: mine.filter((o) => o.status === 'DELIVERING').length
        }
      })
      return ok(paginate(rows, params))
    }
  },
  {
    method: 'post',
    url: /^\/admin\/rider$/,
    handler: ({ data }) => {
      const db = load()
      if (db.riders.some((r) => r.phone === data.phone)) return fail(4001, '该手机号已注册骑手')
      const row = {
        id: String(db.seqRider++),
        username: (data.username || '').trim() || 'rider' + db.seqRider,
        code: 'R' + String(db.seqRider - 1),
        name: (data.name || '').trim(),
        phone: String(data.phone || ''),
        area: data.area || '',
        vehicle: data.vehicle || '电动车',
        status: Number(data.status) === 0 ? 0 : 1,
        online: Number(data.online) === 1 ? 1 : 0,
        todayDone: 0,
        onTheWay: 0,
        rating: 5.0,
        updateTime: new Date().toISOString()
      }
      db.riders.unshift(row)
      save(db)
      return ok(row)
    }
  },
  {
    method: 'put',
    url: /^\/admin\/rider$/,
    handler: ({ data }) => {
      const db = load()
      const row = db.riders.find((r) => String(r.id) === String(data.id))
      if (!row) return fail(4004, '骑手不存在或已被删除')
      Object.assign(row, {
        name: data.name ?? row.name,
        phone: data.phone ?? row.phone,
        area: data.area ?? row.area,
        vehicle: data.vehicle ?? row.vehicle,
        status: data.status === undefined ? row.status : Number(data.status),
        online: data.online === undefined ? row.online : Number(data.online),
        updateTime: new Date().toISOString()
      })
      save(db)
      return ok(row)
    }
  },
  {
    method: 'delete',
    url: /^\/admin\/rider\/(\w+)$/,
    handler: ({ match }) => {
      const db = load()
      const row = db.riders.find((r) => String(r.id) === String(match[1]))
      if (!row) return fail(4004, '骑手不存在')
      // 在途单数从订单里数，有在途单就不许删（和列表上显示的「在途」是同一个口径）
      const onTheWay = (db.orders || []).filter(
        (o) => String(o.riderId) === String(row.id) && o.status === 'DELIVERING'
      ).length
      if (onTheWay > 0) return fail(4001, `该骑手还有 ${onTheWay} 单在途，无法删除`)
      db.riders = db.riders.filter((r) => String(r.id) !== String(match[1]))
      save(db)
      return ok(true)
    }
  },
  {
    method: 'put',
    url: /^\/admin\/rider\/(\w+)\/status$/,
    handler: ({ match, params }) => {
      const db = load()
      const row = db.riders.find((r) => String(r.id) === String(match[1]))
      if (!row) return fail(4004, '骑手不存在')
      row.status = Number(params?.status) === 0 ? 0 : 1
      if (row.status === 0) row.online = 0
      row.updateTime = new Date().toISOString()
      save(db)
      return ok(row)
    }
  },
  {
    method: 'put',
    url: /^\/admin\/rider\/(\w+)\/online$/,
    handler: ({ match, params }) => {
      const db = load()
      const row = db.riders.find((r) => String(r.id) === String(match[1]))
      if (!row) return fail(4004, '骑手不存在')
      if (Number(row.status) === 0) return fail(4001, '该骑手账号已停用，不能上线')
      row.online = Number(params?.online) === 0 ? 0 : 1
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
      // 商家后台只看自己那家店：店铺由登录账号决定（模拟后端数据权限）
      const shopId = String(currentShop().id)
      let rows = db.categories.filter((r) => String(r.shopId || '8001') === shopId)
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
      const shopId = String(currentShop().id)
      const sameShop = (r) => String(r.shopId || '8001') === shopId
      if (db.categories.some((r) => sameShop(r) && r.type === type && r.name === data.name)) {
        return fail(4001, '同类下已存在同名分类')
      }
      const row = {
        id: String(db.seqCat++),
        shopId,
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
      // 商家后台只看自己那家店：店铺由登录账号决定（模拟后端数据权限）
      const shopId = String(currentShop().id)
      let rows = (db.dishes || [])
        .filter((d) => String(d.shopId || '8001') === shopId)
        .map((d) => ({ ...d, categoryName: catName(d.categoryId) }))
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
      const shopId = String(currentShop().id)
      if (db.dishes.some((d) => String(d.shopId || '8001') === shopId && d.name === data.name)) {
        return fail(4001, '已存在同名菜品')
      }
      const row = {
        id: String(db.seqDish++),
        shopId,
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
      // 商家后台只看自己那家店：店铺由登录账号决定（模拟后端数据权限）
      const shopId = String(currentShop().id)
      let rows = (db.combos || [])
        .filter((c) => String(c.shopId || '8001') === shopId)
        .map((c) => {
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
      const shopId = String(currentShop().id)
      if (db.combos.some((c) => String(c.shopId || '8001') === shopId && c.name === data.name)) {
        return fail(4001, '已存在同名套餐')
      }
      const row = {
        id: String(db.seqCombo++),
        shopId,
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

  /* ---------------- 骑手端（前缀 /rider）---------------- */
  {
    method: 'get',
    url: /^\/rider\/me$/,
    handler: () => {
      const token = localStorage.getItem('dcy_token') || ''
      if (!token.startsWith('mock-token-')) return fail(401, '登录已过期，请重新登录')
      const username = token.slice('mock-token-'.length)
      const db = load()
      const row = (db.riders || []).find((r) => r.username === username)
      return row ? ok(row) : fail(4004, '骑手不存在')
    }
  },
  {
    method: 'get',
    url: /^\/rider\/tasks$/,
    handler: ({ params }) => {
      const db = load()
      // 接单大厅：商家已接单、还没骑手接的
      const rows = (db.orders || [])
        .filter((o) => o.status === 'ACCEPTED' && !o.riderId)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      return ok(paginate(rows, params))
    }
  },
  {
    method: 'post',
    url: /^\/rider\/tasks\/(\w+)\/grab$/,
    handler: ({ match }) => {
      const db = load()
      const token = localStorage.getItem('dcy_token') || ''
      const username = token.replace('mock-token-', '')
      const me = (db.riders || []).find((r) => r.username === username)
      if (!me) return fail(4004, '骑手不存在')
      if (Number(me.online) !== 1) return fail(4001, '请先上线接单')
      if (Number(me.status) !== 1) return fail(4001, '账号已停用，不能接单')
      const row = (db.orders || []).find((o) => String(o.id) === String(match[1]))
      if (!row) return fail(4004, '订单不存在')
      if (row.riderId) return fail(4001, '手慢了，这单已被其他骑手接走')
      if (row.status !== 'ACCEPTED') return fail(4001, '该订单当前不可接单')
      row.riderId = String(me.id)
      row.riderName = me.name
      row.riderPhone = me.phone || ''
      row.status = 'DELIVERING'
      row.timeline = [...(row.timeline || []), { status: 'DELIVERING', time: new Date().toISOString() }]
      save(db)
      return ok(row)
    }
  },
  {
    method: 'get',
    url: /^\/rider\/orders$/,
    handler: ({ params }) => {
      const db = load()
      const token = localStorage.getItem('dcy_token') || ''
      const username = token.replace('mock-token-', '')
      const me = (db.riders || []).find((r) => r.username === username)
      if (!me) return fail(4004, '骑手不存在')
      const status = (params || {}).status
      let rows = (db.orders || []).filter((o) => String(o.riderId) === String(me.id))
      if (status) rows = rows.filter((o) => o.status === status)
      rows = rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      return ok(paginate(rows, params))
    }
  },
  {
    method: 'post',
    url: /^\/rider\/orders\/(\w+)\/finish$/,
    handler: ({ match }) => {
      const db = load()
      const token = localStorage.getItem('dcy_token') || ''
      const username = token.replace('mock-token-', '')
      const me = (db.riders || []).find((r) => r.username === username)
      if (!me) return fail(4004, '骑手不存在')
      const row = (db.orders || []).find((o) => String(o.id) === String(match[1]))
      if (!row) return fail(4004, '订单不存在')
      if (String(row.riderId) !== String(me.id)) return fail(4003, '这不是你的配送单')
      if (row.status !== 'DELIVERING') return fail(4001, '该订单当前不是配送中')
      row.status = 'DONE'
      row.timeline = [...(row.timeline || []), { status: 'DONE', time: new Date().toISOString() }]
      save(db)
      return ok(row)
    }
  },
  {
    method: 'get',
    url: /^\/rider\/stats$/,
    handler: () => {
      const db = load()
      const token = localStorage.getItem('dcy_token') || ''
      const username = token.replace('mock-token-', '')
      const me = (db.riders || []).find((r) => r.username === username)
      if (!me) return fail(4004, '骑手不存在')
      const mine = (db.orders || []).filter((o) => String(o.riderId) === String(me.id))
      const done = mine.filter((o) => o.status === 'DONE')
      // 在途单 / 今日完成都从订单里数，不读骑手表上的缓存值，
      // 否则没接过单也会显示数字（底部「我的配送」的红点就是这么来的）
      const onTheWay = mine.filter((o) => o.status === 'DELIVERING').length
      const todayKey = new Date().toISOString().slice(0, 10)
      // 「今日完成」按送达时间算：订单可能是前几天下的，今天刚送完也算今天的活儿
      const doneTimeOf = (o) => {
        const hit = (o.timeline || []).filter((x) => x.status === 'DONE').pop()
        return String(hit?.time || o.createdAt || '').slice(0, 10)
      }
      const todayDone = done.filter((o) => doneTimeOf(o) === todayKey).length
      const income = Number((done.length * 5).toFixed(2))
      return ok({
        online: Number(me.online),
        todayDone,
        onTheWay,
        rating: Number(me.rating || 5),
        totalDone: done.length,
        income,
        availableTasks: (db.orders || []).filter((o) => o.status === 'ACCEPTED' && !o.riderId).length
      })
    }
  },
  {
    method: 'put',
    url: /^\/rider\/online$/,
    handler: ({ params }) => {
      const db = load()
      const token = localStorage.getItem('dcy_token') || ''
      const username = token.replace('mock-token-', '')
      const me = (db.riders || []).find((r) => r.username === username)
      if (!me) return fail(4004, '骑手不存在')
      if (Number(me.status) !== 1) return fail(4001, '账号已停用，不能上线')
      me.online = Number(params?.online) === 0 ? 0 : 1
      save(db)
      return ok(me)
    }
  },

  /* ---------------- 用户端（H5，前缀 /user）---------------- */
  {
    method: 'get',
    url: /^\/user\/shops$/,
    handler: ({ params }) => {
      const db = load()
      let rows = (db.shops || []).slice()
      const kw = (params || {}).keyword
      if (kw) {
        rows = rows.filter(
          (r) => r.name.includes(kw) || (r.tags || []).some((t) => t.includes(kw))
        )
      }
      rows.sort((a, b) => Number(b.status) - Number(a.status) || b.rating - a.rating)
      return ok(paginate(rows, params))
    }
  },
  {
    method: 'get',
    url: /^\/user\/shop\/(\w+)$/,
    handler: ({ match }) => {
      const db = load()
      const row = (db.shops || []).find((x) => String(x.id) === String(match[1]))
      return row ? ok(row) : fail(4004, '店铺不存在')
    }
  },
  {
    method: 'get',
    url: /^\/user\/addresses$/,
    handler: () => {
      const db = load()
      const rows = (db.addresses || [])
        .slice()
        .sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || (a.id < b.id ? 1 : -1))
      return ok({ total: rows.length, records: rows })
    }
  },
  {
    method: 'post',
    url: /^\/user\/address$/,
    handler: ({ data }) => {
      const db = load()
      if (!data || !data.detail) return fail(1001, '请填写详细地址')
      const row = {
        id: String(db.seqAddress++),
        userId: '9002',
        tag: data.tag || '其他',
        name: data.name || '',
        phone: data.phone || '',
        detail: data.detail,
        isDefault: Number(data.isDefault) === 1 ? 1 : 0
      }
      if (row.isDefault) (db.addresses || []).forEach((a) => (a.isDefault = 0))
      db.addresses = [...(db.addresses || []), row]
      save(db)
      return ok(row)
    }
  },
  {
    method: 'put',
    url: /^\/user\/address$/,
    handler: ({ data }) => {
      const db = load()
      const row = (db.addresses || []).find((a) => String(a.id) === String(data.id))
      if (!row) return fail(4004, '地址不存在')
      Object.assign(row, {
        tag: data.tag ?? row.tag,
        name: data.name ?? row.name,
        phone: data.phone ?? row.phone,
        detail: data.detail ?? row.detail
      })
      save(db)
      return ok(row)
    }
  },
  {
    method: 'put',
    url: /^\/user\/address\/(\w+)\/default$/,
    handler: ({ match }) => {
      const db = load()
      const row = (db.addresses || []).find((a) => String(a.id) === String(match[1]))
      if (!row) return fail(4004, '地址不存在')
      ;(db.addresses || []).forEach((a) => (a.isDefault = String(a.id) === String(match[1]) ? 1 : 0))
      save(db)
      return ok(row)
    }
  },
  {
    method: 'delete',
    url: /^\/user\/address\/(\w+)$/,
    handler: ({ match }) => {
      const db = load()
      const before = (db.addresses || []).length
      db.addresses = (db.addresses || []).filter((a) => String(a.id) !== String(match[1]))
      save(db)
      return before === db.addresses.length ? fail(4004, '地址不存在') : ok(true)
    }
  },

  /* ---------------- 用户端：菜单与订单 ---------------- */
  {
    method: 'get',
    url: /^\/user\/menu$/,
    handler: ({ params }) => {
      const db = load()
      // 每道菜、每个分类都带 shopId：不传店铺时退回第一家店，保证老链接仍能用
      const shopId = String((params || {}).shopId || (db.shops?.[0]?.id ?? '8001'))
      const cats = (db.categories || []).filter(
        (c) => Number(c.type) === 1 && Number(c.status) === 1 && String(c.shopId || '8001') === shopId
      )
      const catIds = new Set(cats.map((c) => String(c.id)))
      const dishes = (db.dishes || [])
        .filter((d) => Number(d.status) === 1 && catIds.has(String(d.categoryId)))
        .map((d) => ({
          id: String(d.id),
          name: d.name,
          categoryId: String(d.categoryId),
          price: d.price,
          image: d.image,
          description: d.description,
          flavors: (d.flavors || []).map((f) => ({
            name: f.name,
            values: (f.values || []).map((v) => (typeof v === 'string' ? v : v.name))
          }))
        }))
      return ok({
        categories: cats.map((c) => ({ id: String(c.id), name: c.name })).sort((a, b) => Number(a.id) - Number(b.id)),
        dishes
      })
    }
  },
  {
    method: 'post',
    url: /^\/user\/order$/,
    handler: ({ data }) => {
      const db = load()
      const body = data || {}
      const items = (body.items || [])
        .map((it) => {
          const dish = (db.dishes || []).find((d) => String(d.id) === String(it.dishId))
          if (!dish) return null
          const qty = Number(it.quantity) || 1
          return {
            dishId: String(dish.id),
            dishName: dish.name,
            quantity: qty,
            unitPrice: Number(dish.price),
            amount: Number((dish.price * qty).toFixed(2)),
            flavors: (it.flavors || []).map((f) => (f && f.name ? `${f.name}:${f.value}` : '')).filter(Boolean)
          }
        })
        .filter(Boolean)

      if (!items.length) return fail(1001, '订单里没有有效菜品')

      const addr = (db.addresses || []).find((a) => String(a.id) === String(body.addressId))
      if (!addr) return fail(1001, '请先选择收货地址')

      const shop = (db.shops || []).find((x) => String(x.id) === String(body.shopId)) || {}
      const amount = Number(items.reduce((t, x) => t + x.amount, 0).toFixed(2))
      const deliveryFee = Number(shop.deliveryFee || 0)
      if (shop.minPrice && amount < Number(shop.minPrice)) {
        return fail(4001, `未达起送价 ¥${shop.minPrice}，还差 ¥${(Number(shop.minPrice) - amount).toFixed(2)}`)
      }

      const nowIso = new Date().toISOString()
      const row = {
        id: String(db.seqOrder || 5001 + (db.orders || []).length),
        orderNo: 'DC' + String(Date.now()).slice(-6) + String((db.orders || []).length + 1001),
        riderId: '',
        riderName: '',
        riderPhone: '',
        shopId: String(shop.id || ''),
        shopName: shop.name || '',
        userName: addr.name,
        phone: addr.phone,
        tableNo: '外卖配送',
        address: addr.detail,
        addressInfo: { name: addr.name, phone: addr.phone, detail: addr.detail, tag: addr.tag },
        items,
        amount,
        packFee: 0,
        deliveryFee,
        totalAmount: Number((amount + deliveryFee).toFixed(2)),
        remark: body.remark || '',
        payStatus: 'UNPAID',
        status: 'PENDING',
        createdAt: nowIso,
        timeline: [{ status: 'PENDING', time: nowIso }]
      }
      db.seqOrder = Number(row.id) + 1
      db.orders = [row, ...(db.orders || [])]
      save(db)
      return ok(row)
    }
  },
  {
    method: 'get',
    url: /^\/user\/order\/(\w+)$/,
    handler: ({ match }) => {
      const db = load()
      const row = (db.orders || []).find((o) => String(o.id) === String(match[1]))
      return row ? ok(row) : fail(4004, '订单不存在')
    }
  },
  {
    method: 'get',
    url: /^\/user\/orders$/,
    handler: ({ params }) => {
      const db = load()
      /* 演示环境只有一个顾客账号（胡粤毫），这里按收件人过滤，保证「我的订单」只出现自己的单 */
      const mine = (db.orders || []).filter(
        (o) => o.userName === '胡粤毫' || o.phone === '13800001111' || o.addressInfo?.name === '胡粤毫'
      )
      const rows = mine.slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      return ok(paginate(rows, params))
    }
  },

  /* ---------------- 订单 ---------------- */
  {
    method: 'get',
    url: /^\/admin\/order\/status-count$/,
    handler: () => {
      const db = load()
      const shopId = String(currentShop().id)
      const rows = (db.orders || []).filter((o) => String(o.shopId || '8001') === shopId)
      const out = { ALL: rows.length, PENDING: 0, ACCEPTED: 0, DELIVERING: 0, DONE: 0, CANCELED: 0 }
      rows.forEach((r) => {
        out[r.status] = (out[r.status] || 0) + 1
      })
      return ok(out)
    }
  },
  {
    method: 'get',
    url: /^\/admin\/order\/page$/,
    handler: ({ params }) => {
      const db = load()
      const shopId = String(currentShop().id)
      let rows = (db.orders || []).filter((o) => String(o.shopId || '8001') === shopId)
      const { orderNo, phone, status, startTime, endTime } = params || {}
      if (orderNo) rows = rows.filter((r) => (r.orderNo || '').includes(orderNo))
      if (phone) rows = rows.filter((r) => (r.phone || '').includes(phone))
      if (notEmpty(status)) rows = rows.filter((r) => r.status === status)
      if (startTime) rows = rows.filter((r) => r.createdAt >= startTime)
      // 前端会传 23:59:59，这里按字符串比较即可（ISO 与 yyyy-MM-dd HH:mm:ss 统一转一下）
      if (endTime) {
        const endMs = new Date(String(endTime).replace(' ', 'T')).getTime()
        rows = rows.filter((r) => new Date(r.createdAt).getTime() <= endMs)
      }
      rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      return ok(paginate(rows, params))
    }
  },
  {
    method: 'get',
    url: /^\/admin\/order\/(\w+)$/,
    handler: ({ match }) => {
      const db = load()
      const row = (db.orders || []).find((o) => String(o.id) === String(match[1]))
      return row ? ok(row) : fail(4004, '订单不存在')
    }
  },
  {
    method: 'put',
    url: /^\/admin\/order\/(\w+)\/status$/,
    handler: ({ match, data }) => {
      const db = load()
      const row = (db.orders || []).find((o) => String(o.id) === String(match[1]))
      if (!row) return fail(4004, '订单不存在')
      const TRANSITIONS = {
        PENDING: ['ACCEPTED', 'CANCELED'],
        ACCEPTED: ['DELIVERING', 'CANCELED'],
        DELIVERING: ['DONE'],
        DONE: [],
        CANCELED: []
      }
      const next = (data && data.status) || ''
      if (!(TRANSITIONS[row.status] || []).includes(next)) {
        return fail(4001, `订单当前状态（${row.status}）不允许流转到 ${next || '空'}`)
      }
      row.status = next
      row.timeline = [...(row.timeline || []), { status: next, time: new Date().toISOString() }]
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
    handler: () => {
      const db = load()
      const shopId = String(currentShop().id)
      const orders = (db.orders || []).filter((o) => String(o.shopId || '8001') === shopId)
      const nowMs = Date.now()

      // 近 30 天趋势：营业额只算已完成，订单量算未取消
      const trendMap = new Map()
      for (let i = 29; i >= 0; i--) {
        const key = new Date(nowMs - i * 86400000).toISOString().slice(0, 10)
        trendMap.set(key, { date: key, turnover: 0, orderCount: 0 })
      }
      orders.forEach((o) => {
        const row = trendMap.get(String(o.createdAt).slice(0, 10))
        if (!row || o.status === 'CANCELED') return
        row.orderCount += 1
        if (o.status === 'DONE') {
          row.turnover = Number((row.turnover + Number(o.totalAmount || 0)).toFixed(2))
        }
      })
      const trend = [...trendMap.values()]

      // 状态分布
      const dist = new Map()
      orders.forEach((o) => dist.set(o.status, (dist.get(o.status) || 0) + 1))
      const statusDist = ['PENDING', 'ACCEPTED', 'DELIVERING', 'DONE', 'CANCELED']
        .map((st) => ({ status: st, count: dist.get(st) || 0 }))
        .filter((x) => x.count > 0)

      // 热销菜品：按份数汇总
      const hot = new Map()
      orders
        .filter((o) => o.status !== 'CANCELED')
        .forEach((o) => {
          ;(o.items || []).forEach((it) => {
            const cur = hot.get(it.dishName) || { name: it.dishName, count: 0, amount: 0 }
            cur.count += Number(it.quantity || 0)
            cur.amount = Number((cur.amount + Number(it.amount || 0)).toFixed(2))
            hot.set(it.dishName, cur)
          })
        })
      const hotDishes = [...hot.values()].sort((a, b) => b.count - a.count).slice(0, 10)

      const doneList = orders.filter((o) => o.status === 'DONE')
      const turnover = Number(doneList.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0).toFixed(2))

      return ok({
        turnover,
        orderCount: orders.length,
        avgPrice: doneList.length ? Number((turnover / doneList.length).toFixed(2)) : 0,
        finishRate: orders.length ? Number((doneList.length / orders.length).toFixed(4)) : 0,
        trend,
        statusDist,
        hotDishes
      })
    }
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
