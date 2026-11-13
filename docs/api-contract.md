# 点单云 · 前端接口契约（v1.0）

> 用途：前端按这份契约实现了适配层（`frontend/src/api/adapters/`）。
> 后端只要返回形状一致，前端**一行都不用改**；形状不同也能接，但需要改 adapter 并登记到文末「已知差异」。
>
> 维护人：LTQ（前端）　｜　更新时间：2026-11

---

## 〇之一、三角色改造（2026-11，外卖平台）

系统定位从「点餐 + 管理员/员工」改为**外卖平台的三大类使用者**：

| 角色 | key | 入口 | 用的是哪套前缀 |
|---|---|---|---|
| 商家 | `MERCHANT` | `/#/login` → `/#/dashboard`（PC 后台） | `/admin/**` |
| 骑手 | `RIDER` | `/#/rider/workbench`（手机尺寸） | `/rider/**` |
| 顾客 | `CUSTOMER` | `/#/h5/*`（手机尺寸） | `/user/**` |
| — | — | 三类共用 | `/auth/**`（登录、当前用户） |

### 路径前缀（前端 `src/api/urls.js` 一处定义）

```js
AUTH_PREFIX  = '/auth'    // POST /auth/login、GET /auth/me
ADMIN_PREFIX = '/admin'   // 商家端
RIDER_PREFIX = '/rider'   // 骑手端
USER_PREFIX  = '/user'    // 顾客端
```

### 订单状态机（外卖四段式，商家与骑手分工）

```
顾客下单 → PENDING(待商家接单) → ACCEPTED(待骑手接单) → DELIVERING(配送中) → DONE(已送达)
                                    ↘ CANCELED(已取消)
```

| 动作 | 谁做 | 从 → 到 |
|---|---|---|
| 接单 | 商家 | `PENDING` → `ACCEPTED` |
| 抢单配送 | 骑手 | `ACCEPTED` → `DELIVERING` |
| 确认送达 | 骑手 | `DELIVERING` → `DONE` |
| 取消 | 商家 | `PENDING`/`ACCEPTED` → `CANCELED` |

### 骑手端新增接口（后端要补）

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/rider/me` | 当前骑手资料 `{id,code,name,phone,area,vehicle,status,online,todayDone,onTheWay,rating}` |
| GET | `/rider/tasks` | 接单大厅：`status=ACCEPTED` 且未分配骑手的订单，分页 |
| POST | `/rider/tasks/{orderId}/grab` | 抢单：分配骑手并把订单置为 `DELIVERING`；已被抢返回业务错误 |
| GET | `/rider/orders` | 我的配送单（`riderId=当前骑手`），可按 `status` 过滤 |
| POST | `/rider/orders/{orderId}/finish` | 确认送达 → `DONE`，并累加骑手今日完成数 |
| GET | `/rider/stats` | `{online,todayDone,onTheWay,rating,totalDone,income,availableTasks}` |
| PUT | `/rider/online` | 骑手自己上线/休息，入参 `online=0\|1` |
| GET/POST/PUT/DELETE | `/admin/rider/**` | 商家侧的骑手管理（列表、新增、编辑、删除、`/{id}/status`、`/{id}/online`） |

> 订单 DTO 新增两个字段：`riderId`（未接单为空串）、`riderName`。

## 〇、与 dandanyun 后端框架的对接现状（2026-11）

后端仓库：<https://github.com/TianCha101/dandanyun>（最小运行框架：统一返回 + 全局异常 + 跨域 + 两套路径前缀，暂无数据库 / Redis / 登录）

### 已经对齐的三条

| 项 | 后端框架 | 前端实现 | 状态 |
|---|---|---|---|
| 响应体 | { code: 200, message: ok, data: {} } | http.js 的 unwrap()：code 为 0 或 200 视为成功，取 data；失败用 message（兼容旧字段 msg） | ✅ 已对齐 |
| 路径前缀 | 管理端 /admin/**、用户端 /user/** | src/api/urls.js 里的 dminUrl() / userUrl()，所有 adapter 都走它 | ✅ 已对齐 |
| 同源部署 | 端口 8080，自带 CORS | VITE_API_BASE 留空（同源相对路径）；开发时 vite 代理 /admin、/user → 127.0.0.1:8080 | ✅ 已对齐 |

> 换后端只改一个文件：路径前缀在 src/api/urls.js，响应体解包在 src/api/http.js。页面与 adapter 的字段映射不用动。

### 前端需要的接口（按优先级）

| 优先级 | 接口 | 用途 | 备注 |
|---|---|---|---|
| P0 | POST /admin/login | 登录，返回 { token, user:{id,username,name,role} } | 没有它前端只能继续用 mock |
| P0 | GET /admin/employee/me | 当前登录人（角色决定菜单与路由权限） | 角色取值 ADMIN / STAFF |
| P0 | GET /admin/employee/page、POST/PUT /admin/employee、DELETE /admin/employee/{id}、PUT /admin/employee/{id}/status | 员工管理 | 分页出参请用 { total, records } |
| P1 | GET /admin/category/page、POST/PUT /admin/category、DELETE /admin/category/{id} | 分类管理 | 被引用时返回业务错误码 + 中文 message |
| P1 | GET/PUT /admin/flavor/{categoryId} | 口味配置（整体覆盖） | PUT 入参 { flavors:[{name, values:[{name}]}] } |
| P2 | GET /admin/statistics/overview | 工作台指标卡与图表 | 见 2.3 节出参 |
| P2 | POST /admin/upload | 菜品图片上传 | 返回 { url } |

### 两条必须提前确认的后端细节

1. **主键 Long 必须序列化成字符串**（雪花 ID 19 位，JS Number 只有 2^53 精度，否则查详情查不到）。
2. **错误码表**：成功用 200 已知；未登录 / token 过期用哪个 code（401？2002？）、业务冲突用哪个（4001？），需要后端给一份，前端按它决定“跳登录”还是“只弹提示”。

### 联调顺序建议（后端骨架已跑起来之后）

1. 先打 GET /health，确认 8080 可访问（前端可用 Invoke-WebRequest／浏览器直接开）
2. 再做 POST /admin/login + GET /admin/employee/me，前端把 VITE_USE_MOCK 改成 alse 就能登录
3. 然后一个列表接口（/admin/employee/page），验证分页字段与 Long 精度
4. 逐个模块补齐，每补一个就在本文档「已知差异」表里登记一次

---

## 一、四条通用约定

### 1.1 统一响应体

```json
{ "code": 0, "msg": "ok", "data": { } }
```

| 字段 | 说明 |
|---|---|
| `code` | `0` 或 `200` 视为成功，其余为失败。**业务失败也返回 HTTP 200** 也可以，前端两种都兼容 |
| `msg` | 成功时为 `ok`，失败时是给用户看的中文提示（前端直接 toast） |
| `data` | 业务数据；列表接口放 `{ total, records }` |

前端解包逻辑只在 `frontend/src/api/http.js` 一处，页面拿到的是 `data`。

### 1.2 错误码（前端已内置文案映射，可扩展）

| code | 含义 | 前端行为 |
|---|---|---|
| 0 / 200 | 成功 | 正常返回 |
| 401 | 未登录 / token 过期 | 清会话 + 跳登录页（带 `redirect`） |
| 1001 | 参数不合法 | toast `msg` |
| 1003 | 分页越界 | toast `msg` |
| 2001 | 账号或密码错误 | 登录页 toast |
| 2002 | 未登录（业务码形式） | 同 401 |
| 2004 | 账号被锁定 | 登录页 toast |
| 4001 | 业务冲突（如账号已存在、分类被引用） | toast `msg` |
| 4004 | 资源不存在 | toast `msg` |
| 5000 | 服务端异常 | toast `msg`（不要把堆栈返回给前端） |

### 1.3 分页

**请求参数**：`page`（从 1 开始）、`pageSize`（默认 10，上限 100）

**响应**：

```json
{ "code": 0, "msg": "ok", "data": { "total": 128, "records": [ ] } }
```

> 若后端用 MyBatis-Plus 的 `Page`，`records` + `total` 正好同名，无需转换。

### 1.4 鉴权

- 登录成功后前端把 `token` 存 localStorage，后续请求头带 `Authorization: Bearer <token>`
- 后端拦截器解析失败 → 返回 `401` 或 `code=2002`，前端统一跳登录
- **不要把 token 放 Cookie**：前端与后端可能不同域，Cookie 跨域成本高

### 1.5 字段与类型（**最容易踩的三条**）

| 项 | 约定 | 原因 |
|---|---|---|
| 主键 `id` | **一律序列化成字符串** | MySQL 雪花 ID 是 19 位 Long，JS `Number` 只有 2^53 精度，直接返回数字会失真，查详情查不到 |
| 时间 | `yyyy-MM-dd HH:mm:ss` 字符串 | 前端用 dayjs 解析；返回时间戳也能吃，但不要混用 |
| 金额 | 建议以**分**为整数传输；若用元，请给 `DECIMAL` 的字符串或最多两位小数的数字 | 前端不做浮点加减 |

> 主键成字符串这一条请务必在 `WebMvcConfiguration` 里配 Jackson：
> `SimpleModule` + `Long.class → ToStringSerializer`（全局生效，最省事）。

---

## 二、已接入的接口（前端已实现）

### 2.1 认证

| 方法 | 路径 | 入参 | 出参 `data` |
|---|---|---|---|
| POST | `/api/login` | `{ username, password }` | `{ token, user: { id, username, name, role } }` |
| GET | `/api/employee/me` | — | `{ id, username, name, role }` |

`role` 取值：`ADMIN`（管理员）、`STAFF`（员工）。若后端用数字，请告知，前端在 adapter 里映射。

### 2.2 员工管理

| 方法 | 路径 | 入参 | 出参 `data` |
|---|---|---|---|
| GET | `/api/employee/page` | `page, pageSize, name?, username?, role?, status?` | `{ total, records: [Employee] }` |
| POST | `/api/employee` | `{ username, password, name, phone, role, status }` | `Employee` |
| PUT | `/api/employee` | `{ id, name, phone, role, status }` | `Employee` |
| DELETE | `/api/employee/{id}` | — | `true` |
| PUT | `/api/employee/{id}/status` | `status=0\|1`（query） | `Employee` |

```ts
interface Employee {
  id: string
  username: string
  name: string
  phone: string
  role: 'ADMIN' | 'STAFF'
  status: 0 | 1          // 1 启用 / 0 停用
  lastLoginTime?: string
  updateTime?: string
}
```

### 2.3 统计看板

| 方法 | 路径 | 入参 | 出参 `data` |
|---|---|---|---|
| GET | `/api/statistics/overview` | `startTime?, endTime?` | 见下 |

```json
{
  "turnover": 4820.5, "orderCount": 128, "avgPrice": 37.66, "finishRate": 0.94,
  "trend":        [{ "date": "2026-11-01", "turnover": 620.5, "orderCount": 18 }],
  "statusDist":   [{ "status": "PENDING", "count": 6 }],
  "hotDishes":    [{ "name": "宫保鸡丁", "count": 32, "amount": 896.0 }]
}
```

---

## 三、待实现的接口（前端页面已在路上，按此实现即可对接）

### 3.1 分类与口味

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/category/page` | 分页；入参 `type`（1 菜品 / 2 套餐）、`name` |
| POST / PUT | `/api/category` | 新增 / 修改；字段 `id?, name, type, sort, status` |
| DELETE | `/api/category/{id}` | 被菜品引用时返回 `4001` + `msg="该分类下还有 N 个菜品，无法删除"` |
| GET | `/api/flavor/list?categoryId=` | 某分类下的口味（含口味值列表） |
| PUT | `/api/flavor/{categoryId}` | **整体覆盖**：`{ flavors: [{ name, values: [{ name }] }] }` |

### 3.2 菜品

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/dish/page` | 入参 `page,pageSize,name?,categoryId?,status?` |
| POST / PUT | `/api/dish` | 字段 `id?, name, categoryId, price, image, description, status, flavorIds[]` |
| DELETE | `/api/dish/{id}` | 套餐引用时 `4001` |
| PUT | `/api/dish/{id}/status` | `status=0\|1` 起售 / 停售 |
| POST | `/api/upload` | `multipart/form-data`，字段名 `file`，返回 `{ url: "/upload/xxx.jpg" }` |

### 3.3 套餐

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/combo/page` | 入参 `page,pageSize,name?,categoryId?,status?` |
| POST / PUT | `/api/combo` | 字段 `id?, name, categoryId, price, image, description, status, dishIds[]` |
| GET | `/api/combo/{id}` | 详情含菜品明细（用于编辑回显） |

### 3.4 订单

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/order/page` | 入参 `page,pageSize,orderNo?,status?,startTime?,endTime?,phone?` |
| GET | `/api/order/{id}` | 详情：菜品明细 + 状态时间轴 + 金额三段 |
| PUT | `/api/order/{id}/status` | `{ status: 'ACCEPTED' \| 'DELIVERING' \| 'DONE' \| 'CANCELED' }` |

**订单状态枚举**（前端 `constants/enums.js` 已按此实现状态机，请保持一致）：

| 状态 | 含义 | 允许流转到 |
|---|---|---|
| `PENDING` | 待接单 | ACCEPTED、CANCELED |
| `ACCEPTED` | 已接单 | DELIVERING、CANCELED |
| `DELIVERING` | 派送中 | DONE |
| `DONE` | 已完成 | — |
| `CANCELED` | 已取消 | — |

### 3.5 顾客端（外卖 H5）

前端路径前缀 `/user`（`src/api/urls.js` 的 `userUrl()`），下表按「路径后半段」列出。

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/user/shops` | 店铺列表，入参 `keyword?,page,pageSize`；返回 `{total,records}`，每条含 `rating,monthlySales,minPrice,deliveryFee,deliveryTime,distance,status,openMenu,tags` |
| GET | `/user/shop/{id}` | 店铺详情（菜单页头部用） |
| GET | `/user/menu?shopId=` | 分类 + 在售菜品（含口味），**按店铺返回**；不传 shopId 时退回第一家店 |
| GET | `/user/addresses` | 收货地址列表，按默认地址优先排序 |
| POST | `/user/address` | 新增：`{ tag,name,phone,detail,isDefault }` |
| PUT | `/user/address` | 编辑：`{ id, tag?,name?,phone?,detail? }` |
| PUT | `/user/address/{id}/default` | 设为默认地址 |
| DELETE | `/user/address/{id}` | 删除地址 |
| POST | `/user/order` | 下单：`{ shopId,addressId,remark,items:[{dishId,quantity,flavors:[{name,value}]}] }` |
| GET | `/user/order/{id}` | 订单详情：状态时间轴 + 骑手信息 + 收货信息 |
| GET | `/user/orders` | 我的订单（只返回当前登录顾客自己的单） |

**下单时后端要回填的字段**（顾客端结果页直接展示，缺了会显示成空）：

| 字段 | 说明 |
|---|---|
| `shopName` / `deliveryFee` | 店铺名与配送费，金额口径：`totalAmount = amount + deliveryFee` |
| `addressInfo` | `{ name, phone, detail, tag }` 下单时的地址快照，地址被改/删后历史订单不受影响 |
| `riderName` / `riderPhone` | 骑手接单后回填，顾客端据此显示「骑手正在配送」与联系电话 |

> 未达起送价由后端再校验一次（返回 4001 + 提示文案），前端按钮也已提前置灰。

### 3.6 多店铺：`shopId` 要挂在哪

现在前端已经按「菜品属于某一家店」来写，演示数据里有两家店各有自己的菜单
（中关村店 `8001`、外婆家·五道口店 `8002`）。后端接进来时只需补同样的维度：

| 表 / 字段 | 要求 |
|---|---|
| `shop` 表 | 店名、评分、月售、起送价、配送费、配送时长、距离、营业状态；`id` 用字符串下发 |
| `dish.shop_id`、`category.shop_id`、`combo.shop_id` | 必填外键，删除店铺时按业务决定禁止还是级联 |
| `order.shop_id` | 下单落库时写入，顾客端与骑手端都靠它显示「店铺」 |
| `/user/shops` | 列表带 `openMenu`（菜单是否已接入）；未接入的店前端显示「菜单接入中」 |
| `/user/menu?shopId=` | 按店铺返回分类 + 在售菜品 |
| `/auth/login`、`/auth/me` | 返回 `shopId` / `shopName`，标明这个账号管哪家店（骑手、顾客为空） |
| `/admin/dish/page`、`/admin/category/page`、`/admin/combo/page`、`/admin/order/page`、`/admin/order/status-count`、`/admin/statistics/overview` | **店铺范围由后端从登录态里取，不用前端传 shopId**：商家只返回自己店的数据；新增分类/菜品/套餐时也由后端自动写入所属店铺 |

> 演示版就是这么做的：mock 里 `currentShop()` 从 token 反查账号所属店铺（见 `constants/demoAccounts.js` 的 `ACCOUNT_SHOP`），
> 再拿它过滤列表。后端接进来时按同样思路处理即可——**不要把店铺范围做成前端参数，否则改一个请求就能看到别人的数据**。

---

## 四、已知差异（联调时逐条登记）

| 日期 | 接口 | 后端实际 | 前端处理 | 谁改 |
|---|---|---|---|---|
| — | — | — | — | — |

> 规则：**优先后端改**（他只有一个消费者）；后端确实不改的，前端在 adapter 里折中，并在此登记一行。
