# 点单云 · 前端接口契约（v1.0）

> 用途：前端按这份契约实现了适配层（`frontend/src/api/adapters/`）。
> 后端只要返回形状一致，前端**一行都不用改**；形状不同也能接，但需要改 adapter 并登记到文末「已知差异」。
>
> 维护人：LTQ（前端）　｜　更新时间：2026-11

---

## 〇、与 dandanyun 后端框架的对接现状（2026-11）

后端代码已放在本仓库 `backend/`：Java 25 + Spring Boot 4 + MySQL + JWT。

### 已经对齐的三条

| 项 | 后端实现 | 前端实现 | 状态 |
|---|---|---|---|
| 响应体 | `{ code: 200, message: "ok", data: {} }` | `http.js` 的 `unwrap()`：code 为 0 或 200 视为成功，取 data；失败用 message（兼容旧字段 msg） | ✅ 已对齐 |
| 路径前缀 | 管理端 `/admin/**`、用户端 `/user/**` | `src/api/urls.js` 里的 `adminUrl()` / `userUrl()`，所有 adapter 都走它 | ✅ 已对齐 |
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

### 已解决的后端细节

1. **主键 Long 已全局序列化为字符串**，避免 JavaScript 精度丢失。
2. **错误码已统一**：401 表示未登录或过期，业务冲突使用 4001，资源不存在使用 4004，参数错误使用 1001。

### 联调顺序

1. 先打 GET /health，确认 8080 可访问（前端可用 Invoke-WebRequest／浏览器直接开）
2. 再做 POST /admin/login + GET /admin/employee/me，前端把 `VITE_USE_MOCK` 改成 `false` 就能登录
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
| POST | `/admin/login` | `{ username, password }` | `{ token, user: { id, username, name, role } }` |
| GET | `/admin/employee/me` | — | `{ id, username, name, role }` |

`role` 取值：`ADMIN`（管理员）、`STAFF`（员工）。若后端用数字，请告知，前端在 adapter 里映射。

### 2.2 员工管理

| 方法 | 路径 | 入参 | 出参 `data` |
|---|---|---|---|
| GET | `/admin/employee/page` | `page, pageSize, name?, username?, role?, status?` | `{ total, records: [Employee] }` |
| POST | `/admin/employee` | `{ username, password, name, phone, role, status }` | `Employee` |
| PUT | `/admin/employee` | `{ id, name, phone, role, status }` | `Employee` |
| DELETE | `/admin/employee/{id}` | — | `true` |
| PUT | `/admin/employee/{id}/status` | `status=0\|1`（query） | `Employee` |

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
| GET | `/admin/statistics/overview` | — | 见下 |

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
| GET | `/admin/category/page` | 分页；入参 `type`（1 菜品 / 2 套餐）、`name` |
| POST / PUT | `/admin/category` | 新增 / 修改；字段 `id?, name, type, sort, status` |
| DELETE | `/admin/category/{id}` | 被菜品引用时返回 `4001` + `message="该分类下还有 N 个菜品，无法删除"` |
| GET | `/admin/flavor/{categoryId}` | 某分类下的口味（含口味值列表） |
| PUT | `/admin/flavor/{categoryId}` | **整体覆盖**：`{ flavors: [{ name, values: [{ name }] }] }` |

### 3.2 菜品

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/admin/dish/page` | 入参 `page,pageSize,name?,categoryId?,status?` |
| POST / PUT | `/admin/dish` | 字段 `id?, name, categoryId, price, image, description, status, flavors[]` |
| DELETE | `/admin/dish/{id}` | 套餐引用时 `4001` |
| PUT | `/admin/dish/{id}/status` | `status=0\|1` 起售 / 停售 |
| POST | `/admin/upload` | `multipart/form-data`，字段名 `file`，返回 `{ url: "/upload/xxx.jpg" }` |

### 3.3 套餐

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/admin/combo/page` | 入参 `page,pageSize,name?,categoryId?,status?` |
| POST / PUT | `/admin/combo` | 字段 `id?, name, categoryId, price, image, description, status, dishIds[]` |
| GET | `/admin/combo/{id}` | 详情含菜品明细（用于编辑回显） |

### 3.4 订单

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/admin/order/page` | 入参 `page,pageSize,orderNo?,status?,startTime?,endTime?,phone?` |
| GET | `/admin/order/{id}` | 详情：菜品明细 + 状态时间轴 + 金额三段 |
| PUT | `/admin/order/{id}/status` | `{ status: 'ACCEPTED' \| 'DELIVERING' \| 'DONE' \| 'CANCELED' }` |

**订单状态枚举**（前端 `constants/enums.js` 已按此实现状态机，请保持一致）：

| 状态 | 含义 | 允许流转到 |
|---|---|---|
| `PENDING` | 待接单 | ACCEPTED、CANCELED |
| `ACCEPTED` | 已接单 | DELIVERING、CANCELED |
| `DELIVERING` | 派送中 | DONE |
| `DONE` | 已完成 | — |
| `CANCELED` | 已取消 | — |

### 3.5 用户端（H5，可选）

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/user/menu?tableNo=` | 分类 + 在售菜品（含口味） |
| POST | `/user/order` | `{ tableNo, items:[{ dishId, flavors:[{name,value}], quantity }], remark }` |
| GET | `/user/order/{id}` | 订单详情与状态 |
| GET | `/user/orders` | 我的订单分页 |

---

## 四、已知差异（联调时逐条登记）

| 日期 | 接口 | 后端实际 | 前端处理 | 谁改 |
|---|---|---|---|---|
| — | — | — | — | — |

> 规则：**优先后端改**（他只有一个消费者）；后端确实不改的，前端在 adapter 里折中，并在此登记一行。
