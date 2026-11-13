# 点单云前后端接口适配

本文档对应前端仓库 `LQ19488-maker/diancanyun` 的 `frontend/src/api/adapters/*`。

## 通用约定

| 项 | 后端实现 |
|---|---|
| 成功码 | `200` |
| 响应体 | `{ code, message, data }` |
| 鉴权 | `Authorization: Bearer <token>` |
| Long 主键 | Jackson 全局序列化为字符串 |
| 日期时间 | `yyyy-MM-dd HH:mm:ss` / ISO 时间 |
| 分页 | `{ total, records, page, pageSize }` |
| 管理端前缀 | `/admin/**` |
| H5 前缀 | `/user/**` |

## 管理端

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/admin/login` | 登录，返回 token 和 user |
| GET | `/admin/employee/me` | 当前登录员工 |
| GET | `/admin/employee/page` | 员工分页 |
| POST | `/admin/employee` | 新增员工 |
| PUT | `/admin/employee` | 修改员工 |
| DELETE | `/admin/employee/{id}` | 删除员工 |
| PUT | `/admin/employee/{id}/status?status=0` | 启停员工 |
| GET | `/admin/category/page` | 分类分页 |
| POST | `/admin/category` | 新增分类 |
| PUT | `/admin/category` | 修改分类 |
| DELETE | `/admin/category/{id}` | 删除分类 |
| GET | `/admin/flavor/{categoryId}` | 读取口味配置 |
| PUT | `/admin/flavor/{categoryId}` | 整体覆盖口味配置 |
| GET | `/admin/dish/page` | 菜品分页 |
| POST | `/admin/dish` | 新增菜品 |
| PUT | `/admin/dish` | 修改菜品 |
| DELETE | `/admin/dish/{id}` | 删除菜品 |
| PUT | `/admin/dish/{id}/status?status=1` | 起售/停售 |
| GET | `/admin/combo/page` | 套餐分页 |
| GET | `/admin/combo/{id}` | 套餐详情 |
| POST | `/admin/combo` | 新增套餐 |
| PUT | `/admin/combo` | 修改套餐 |
| DELETE | `/admin/combo/{id}` | 删除套餐 |
| PUT | `/admin/combo/{id}/status?status=1` | 起售/停售 |
| GET | `/admin/order/status-count` | 各订单状态数量 |
| GET | `/admin/order/page` | 订单分页 |
| GET | `/admin/order/{id}` | 订单详情 |
| PUT | `/admin/order/{id}/status` | 订单状态流转 |
| GET | `/admin/statistics/overview` | 工作台统计 |
| POST | `/admin/upload` | 图片上传 |

## H5 用户端

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/user/menu` | 启用分类与在售菜品 |
| POST | `/user/order` | 提交订单 |
| GET | `/user/order/{id}` | 订单详情 |
| GET | `/user/orders` | 我的订单分页 |

## 订单状态机

```text
PENDING -> ACCEPTED, CANCELED
ACCEPTED -> DELIVERING, CANCELED
DELIVERING -> DONE
DONE -> 无
CANCELED -> 无
```

## 权限

| 角色 | 权限 |
|---|---|
| ADMIN | 全部管理端接口 |
| STAFF | 菜品、订单、统计；不能管理员工、分类、口味和套餐 |

H5 接口不需要管理端 token。
