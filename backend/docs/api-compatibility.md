# 点单云前后端接口适配

对应前端 `frontend/src/api/adapters/*` 和 `docs/api-contract.md`。

## 通用约定

| 项 | 后端实现 |
|---|---|
| 成功码 | `200` |
| 响应体 | `{ code, message, data }` |
| 鉴权 | `Authorization: Bearer <token>` |
| Long 主键 | Jackson 全局序列化为字符串 |
| 分页 | `{ total, records, page, pageSize }` |
| 角色 | `MERCHANT` / `RIDER` / `CUSTOMER` |

## 认证

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/auth/login` | 三角色统一登录 |
| GET | `/auth/me` | 当前用户资料 |

## 商家端

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/admin/rider/page` | 骑手分页 |
| POST/PUT | `/admin/rider` | 新增 / 修改骑手 |
| DELETE | `/admin/rider/{id}` | 删除骑手 |
| PUT | `/admin/rider/{id}/status` | 启停账号 |
| PUT | `/admin/rider/{id}/online` | 上线 / 休息 |
| GET | `/admin/category/page` | 分类分页 |
| POST/PUT | `/admin/category` | 新增 / 修改分类 |
| DELETE | `/admin/category/{id}` | 删除分类 |
| GET/PUT | `/admin/flavor/{categoryId}` | 读取 / 覆盖口味 |
| GET | `/admin/dish/page` | 菜品分页 |
| POST/PUT | `/admin/dish` | 新增 / 修改菜品 |
| DELETE | `/admin/dish/{id}` | 删除菜品 |
| PUT | `/admin/dish/{id}/status` | 上下架 |
| GET | `/admin/combo/page` | 套餐分页 |
| GET | `/admin/combo/{id}` | 套餐详情 |
| POST/PUT | `/admin/combo` | 新增 / 修改套餐 |
| DELETE | `/admin/combo/{id}` | 删除套餐 |
| PUT | `/admin/combo/{id}/status` | 上下架 |
| GET | `/admin/order/page` | 订单分页 |
| GET | `/admin/order/status-count` | 状态数量 |
| GET | `/admin/order/{id}` | 订单详情 |
| PUT | `/admin/order/{id}/status` | 商家接单 / 取消 |
| GET | `/admin/statistics/overview` | 经营统计 |
| POST | `/admin/upload` | 图片上传 |

## 骑手端

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/rider/me` | 当前骑手资料 |
| GET | `/rider/stats` | 在线、完成、在途、收入、评分 |
| PUT | `/rider/online` | 自己上线 / 休息 |
| GET | `/rider/tasks` | 可抢订单 |
| POST | `/rider/tasks/{orderId}/grab` | 抢单，状态变配送中 |
| GET | `/rider/orders` | 我的配送单 |
| POST | `/rider/orders/{orderId}/finish` | 确认送达 |

## 顾客端

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/user/shops` | 店铺列表 |
| GET | `/user/shop/{id}` | 店铺详情 |
| GET | `/user/menu?shopId=` | 店铺菜单 |
| GET | `/user/addresses` | 收货地址 |
| POST/PUT | `/user/address` | 新增 / 修改地址 |
| PUT | `/user/address/{id}/default` | 设为默认 |
| DELETE | `/user/address/{id}` | 删除地址 |
| POST | `/user/order` | 店铺和地址快照下单 |
| GET | `/user/order/{id}` | 订单详情 |
| GET | `/user/orders` | 当前顾客订单 |

## 订单状态机

```text
PENDING -> ACCEPTED（商家接单）
ACCEPTED -> DELIVERING（骑手抢单）
DELIVERING -> DONE（骑手确认送达）
PENDING / ACCEPTED -> CANCELED（商家取消）
```
