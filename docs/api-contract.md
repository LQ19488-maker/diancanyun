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
| GET | `/rider/stats` | `{online,todayDone,onTheWay,rating,totalDone,income,baseIncome,todaySubsidy,subsidyPer,balance,availableTasks}` |
| PUT | `/rider/online` | 骑手自己上线/休息，入参 `online=0\|1` |
| GET | `/rider/weather` | 天气与补贴：`{city,condition,icon,temperature,feelsLike,wind,humidity,tomorrow,subsidy{active,amount,reason},updateTime}` |
| GET | `/rider/wallet` | 钱包：`{balance,totalIncome,baseIncome,todayIncome,todaySubsidy,subsidyPer,withdrawn,basePrice,records[]}` |
| POST | `/rider/withdraw` | 提现 `{amount,channel}`；校验：`1 ≤ amount ≤ balance`，成功后余额扣减并生成一条记录 |
| GET/POST/PUT/DELETE | `/admin/rider/**` | 商家侧的骑手管理（列表、新增、编辑、删除、`/{id}/status`、`/{id}/online`） |

> 订单 DTO 新增两个字段：`riderId`（未接单为空串）、`riderName`。
>
> **收入口径必须只有一个公式**（前端演示版写在 `mock/index.js` 的 `riderIncome()` 里）：
> `收入 = 完成单数 × 基础配送费(5 元) + 当日完成单数 × 天气补贴`，
> `可提现余额 = 累计收入 − 已提现`。工作台卡片、钱包页、提现校验都读同一个公式，
> 不要在两处各算一遍——否则骑手会发现「卡片显示 12 元，提现说只有 10 元」。
>
> 天气补贴建议由后端按「天气 + 时段」配置（演示版按时段给：雨天 +2、夜间 +2、早高峰 +1.5），
> 前端只负责展示，不要在页面里写死金额。

## 〇、后端对接现状（2026-11）

后端代码已放在本仓库 `backend/`：Java 25 + Spring Boot 4 + MySQL + JWT。

### 已经对齐的三条

| 项 | 后端实现 | 前端实现 | 状态 |
|---|---|---|---|
| 响应体 | `{ code: 200, message: "ok", data: {} }` | `http.js` 的 `unwrap()`：code 为 0 或 200 视为成功，取 data；失败用 message（兼容旧字段 msg） | ✅ 已对齐 |
| 路径前缀 | `/auth/**`、`/admin/**`、`/rider/**`、`/user/**` | `src/api/urls.js` 统一生成四类前缀 | ✅ 已对齐 |
| 同源部署 | 端口 8080，自带 CORS | `VITE_API_BASE` 留空；Vite 代理四类前缀到 8080 | ✅ 已对齐 |

> 换后端只改一个文件：路径前缀在 src/api/urls.js，响应体解包在 src/api/http.js。页面与 adapter 的字段映射不用动。

### 已实现接口

| 优先级 | 接口 | 用途 | 备注 |
|---|---|---|---|
| P0 | POST /auth/login、GET /auth/me | 三角色登录与当前用户 | MERCHANT / RIDER / CUSTOMER |
| P0 | `/admin/rider/**` | 商家侧骑手管理 | 分页、新增、编辑、删除、启停、上线 |
| P0 | `/rider/**` | 骑手接单工作台 | 任务、抢单、配送、送达、统计 |
| P0 | `/user/shops`、`/user/shop/{id}` | 外卖店铺首页与详情 | 起送价、配送费、营业状态 |
| P0 | `/user/addresses`、`/user/address/**` | 顾客收货地址 | 默认地址唯一 |
| P0 | `POST /user/order`、`GET /user/order/{id}`、`GET /user/orders` | 顾客下单与我的订单 | 金额口径含满减；`payStatus` 默认 `PAID`（模拟支付） |
| P1 | `/admin/dish/**`、`/admin/combo/**` | 菜品与套餐管理 | 按 `app.merchant-shop-id` 固定店铺过滤 |
| P1 | `/admin/order/page`、`GET /admin/order/{id}`、`PUT /admin/order/{id}/status` | 商家订单管理 | 状态机 PENDING→ACCEPTED→DELIVERING→DONE / CANCELED |
| P2 | `GET /admin/shop`、`PUT /admin/shop` | 商家端店铺设置与满减配置 | 见 3.7 节 |
| P1 | GET /admin/category/page、POST/PUT /admin/category、DELETE /admin/category/{id} | 分类管理 | 被引用时返回业务错误码 + 中文 message |
| P1 | GET/PUT /admin/flavor/{categoryId} | 口味配置（整体覆盖） | PUT 入参 { flavors:[{name, values:[{name}]}] } |
| P2 | GET /admin/statistics/overview | 工作台指标卡与图表 | 见 2.3 节出参 |
| P2 | POST /admin/upload | 菜品图片上传 | 返回 { url } |

### 已解决的后端细节

1. **主键 Long 已全局序列化为字符串**，避免 JavaScript 精度丢失。
2. **错误码已统一**：401 表示未登录或过期，业务冲突使用 4001，资源不存在使用 4004，参数错误使用 1001。
3. **时间统一为 `yyyy-MM-dd HH:mm:ss`**（`JacksonConfig` 里的三个序列化器，日期/时间各自格式）。
4. **计数与分页是 JSON 数字**：`total`、`page`、`pageSize`、`dishCount`、`status-count` 各计数都按 int 输出，不再是字符串。
5. **满减与金额口径已落地**：`totalAmount = amount - discount + packFee + deliveryFee`，减免额不会超过菜品小计。
6. **测试**：`mvn test` 含 10 个真连 MySQL 的集成用例（登录/越权/分页/时间格式/满减/店铺设置/订单全流程），
   本机没有 MySQL 时这 10 个自动跳过，不会把构建搞红；另有契约路由表校验与不依赖数据库的冒烟测试。

### 联调顺序

1. 先打 GET /health，确认 8080 可访问
2. 再做 POST /auth/login + GET /auth/me
3. 验证商家骑手管理、顾客店铺和骑手任务列表
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
| 金额 | 后端用「元」的两位小数 `DECIMAL`，序列化成 JSON 数字（如 `38.00`） | 前端只做展示与比较，不做浮点加减 |

> 主键成字符串这一条请务必在 `WebMvcConfiguration` 里配 Jackson：
> `SimpleModule` + `Long.class → ToStringSerializer`（全局生效，最省事）。

---

## 二、已接入的接口（前端已实现）

### 2.1 认证

| 方法 | 路径 | 入参 | 出参 `data` |
|---|---|---|---|
| POST | `/auth/login` | `{ username, password }` | `{ token, user: { id, username, name, role } }` |
| GET | `/auth/me` | — | `{ id, username, name, role }` |

`role` 取值：`MERCHANT`、`RIDER`、`CUSTOMER`。

### 2.2 骑手管理

| 方法 | 路径 | 入参 | 出参 `data` |
|---|---|---|---|
| GET | `/admin/rider/page` | `page,pageSize,name?,code?,area?,online?,status?` | `{ total, records:[Rider] }` |
| POST | `/admin/rider` | 骑手账号、姓名、手机号、站点、车型 | `Rider` |
| PUT | `/admin/rider` | 修改骑手资料和在线状态 | `Rider` |
| DELETE | `/admin/rider/{id}` | 有在途单时禁止删除 | `true` |
| PUT | `/admin/rider/{id}/status` | 启停账号 | `true` |
| PUT | `/admin/rider/{id}/online` | 上线或休息 | `true` |

```ts
interface Rider {
  id: string
  code: string
  username: string
  name: string
  phone: string
  area: string
  vehicle: string
  status: 0 | 1
  online: 0 | 1
  todayDone: number
  onTheWay: number
  rating: number
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
| GET | `/admin/order/{id}` | 详情：菜品明细 + 状态时间轴 + 金额五项 `amount / discount / packFee / deliveryFee / totalAmount` |
| PUT | `/admin/order/{id}/status` | `{ status: 'ACCEPTED' \| 'DELIVERING' \| 'DONE' \| 'CANCELED' }` |

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
| GET | `/user/shops` | 店铺列表，入参 `keyword?,page,pageSize`；返回 `{total,records}`，每条含 `rating,monthlySales,minPrice,deliveryFee,fullAmount,reduceAmount,deliveryTime,distance,status,openMenu,tags` |
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
| `shopName` / `deliveryFee` / `packFee` / `discount` | 店铺名、配送费、打包费、满减金额。金额口径固定为：`totalAmount = amount - discount + packFee + deliveryFee`（先算菜品小计，再减满减，最后加打包费与配送费） |
| `addressInfo` | `{ name, phone, detail, tag }` 下单时的地址快照，地址被改/删后历史订单不受影响 |
| `riderName` / `riderPhone` | 骑手接单后回填，顾客端据此显示「骑手正在配送」与联系电话 |

> 未达起送价由后端再校验一次（返回 4001 + 提示文案），前端按钮也已提前置灰。

### 3.5.1 优惠券与团购套餐

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/user/coupon/templates` | 领券中心：`{title,threshold,amount,shopId,desc,left,claimed}`；用掉/过期的券可以再领，`claimed` 只表示「手上还有未用的一张」 |
| POST | `/user/coupon/{id}/claim` | 领取，重复领取返回 4001 |
| GET | `/user/coupons?status=&orderAmount=&shopId=` | 我的券；传 `orderAmount` + `shopId` 时额外返回 `usable`（金额够、店铺适用、状态未用），下单页据此过滤 |
| GET | `/user/menu?shopId=` | 返回值里多一个 `combos`：该店在售套餐 `{id,name,price,originPrice,dishCount,dishNames}` |

**下单请求体新增两个字段**：

```json
{
  "shopId": "8001",
  "addressId": "9001",
  "couponId": "7101",
  "remark": "",
  "items": [
    { "dishId": "3001", "quantity": 1, "flavors": [{ "name": "辣度", "value": "微辣" }] },
    { "comboId": "4001", "quantity": 1 }
  ]
}
```

后端要做的校验（缺一条就会出现「券用不了」这类客诉）：

1. `couponId` 必须属于当前用户、状态 `UNUSED`、未过期；
2. 券绑了店铺（`shopId` 非空）时，只能用在对应店铺；
3. 菜品金额达到券门槛（门槛按**菜品金额**算，不含配送费）；
4. 抵扣金额不超过菜品金额，**配送费不参与抵扣**；
5. 下单成功后把券置为 `USED` 并记录使用时间（并发下要保证一张券只能用一次）。

订单里建议回填 `couponId`、`couponTitle`、`couponAmount`，顾客端订单详情会显示「优惠券 -¥x」。

### 3.6 多店铺：`shopId` 要挂在哪

现在前端已经按「菜品属于某一家店」来写，演示数据里有两家店各有自己的菜单
（中关村店 `8001`、外婆家·五道口店 `8002`）。后端接进来时只需补同样的维度：

| 表 / 字段 | 要求 |
|---|---|
| `shop` 表 | 店名、评分、月售、起送价、配送费、配送时长、距离、营业状态；`full_amount` / `reduce_amount` 存满减门槛与减免额（`0` 表示不做满减）；`id` 用字符串下发 |
| `dish.shop_id`、`category.shop_id`、`combo.shop_id` | 必填外键，删除店铺时按业务决定禁止还是级联 |
| `order.shop_id` | 下单落库时写入，顾客端与骑手端都靠它显示「店铺」 |
| `/user/shops` | 列表带 `openMenu`（菜单是否已接入）；未接入的店前端显示「菜单接入中」 |
| `/user/menu?shopId=` | 按店铺返回分类 + 在售菜品 |
| `/auth/login`、`/auth/me` | 返回 `shopId` / `shopName`，标明这个账号管哪家店（骑手、顾客为空） |
| `/admin/dish/page`、`/admin/category/page`、`/admin/combo/page`、`/admin/order/page`、`/admin/order/status-count`、`/admin/statistics/overview` | **店铺范围由后端从登录态里取，不用前端传 shopId**：商家只返回自己店的数据；新增分类/菜品/套餐时也由后端自动写入所属店铺 |

> 演示版就是这么做的：mock 里 `currentShop()` 从 token 反查账号所属店铺（见 `constants/demoAccounts.js` 的 `ACCOUNT_SHOP`），
> 再拿它过滤列表。后端接进来时按同样思路处理即可——**不要把店铺范围做成前端参数，否则改一个请求就能看到别人的数据**。

### 3.7 商家端店铺设置（后端已实现，前端待接入）

商家后台是「一家店」视角，店铺由后端配置项 `app.merchant-shop-id` 固定
（演示值是 `10001` 川味小馆，与 `/admin/dish`、`/admin/combo` 的过滤店铺一致），
所以接口不带店铺 id，改的就是自己那家店。

| 方法 | 路径 | 入参 | 出参 `data` |
|---|---|---|---|
| GET | `/admin/shop` | — | 店铺设置：`{ id, name, minPrice, deliveryFee, fullAmount, reduceAmount, status, openMenu, ... }` |
| PUT | `/admin/shop` | 下列字段**全部可选**，不传或传 `null` 表示保持不变：`{ name, minPrice, deliveryFee, fullAmount, reduceAmount, status, openMenu }` | 更新后的店铺设置，字段同上 |

**满减语义**：`fullAmount` 是门槛，`reduceAmount` 是减免额，`fullAmount = 0` 表示这家店不做满减。
下单时后端命中条件为 `菜品小计 >= fullAmount`，减免额不会超过菜品小计（防止总价为负）。

**校验失败（HTTP 400 + `code: 4001`）**：

- 满减金额不能大于满减门槛
- 门槛为 0 时不能设置优惠额
- 起送价 / 配送费 / 满减金额不能为负
- `status`、`openMenu` 只能是 `0` 或 `1`
- `id` 传了但不是自己那家店 → 拒绝

---

## 四、已知差异（联调时逐条登记）

| 日期 | 接口 | 后端实际 | 前端处理 | 谁改 |
|---|---|---|---|---|
| 2026-11-13 | 全部 | 失败字段名是 `message`，本节写作 `msg` | 前端 `http.js` 已兼容 `body.message \|\| body.msg`，无需改动 | — |
| 2026-11-13 | `/auth/login` | 密码错误返回 **HTTP 200 + `code: 2001`**（`AuthController` 内部 catch 掉异常）；而 `/admin/me` 缺 token 是真 401 | 前端已按 `code` 判成功，无影响；若要 HTTP 语义统一需后端改 | 后端待定 |
| 2026-11-13 | 金额字段 | 用「元」的两位小数（`38.00`），不是分 | 前端只展示与比较，不做浮点加减 | — |
| 2026-11-13 | 订单 / 店铺 DTO | 新增 `discount`、`fullAmount`、`reduceAmount`，`packFee` 存在但恒为 `0`（没有打包费规则） | 结算页显示「已减 ¥x」；`packFee = 0` 时可不展示 | 前端补 UI |
| 2026-11-13 | `/admin/shop` | 新增接口，原 49 条契约里没有 | 需要新增「店铺设置」页面 | 前端待做 |
| 2026-11-13 | `/auth/admin/login`、`/auth/user/login` | 旧的三入口仍在；其中 `/user/login` 错误密码返回 401 而不是 2001 | 前端只用单入口 `/auth/login`，不影响 | — |
| 2026-11-13 | 时间格式 | 已是 `yyyy-MM-dd HH:mm:ss`（`JacksonConfig` 统一序列化） | iOS Safari 用 `new Date('2026-11-13 19:41:22')` 会 Invalid Date，需先 `replace(' ', 'T')` 或用 dayjs | 前端注意 |

> 规则：**优先后端改**（他只有一个消费者）；后端确实不改的，前端在 adapter 里折中，并在此登记一行。
