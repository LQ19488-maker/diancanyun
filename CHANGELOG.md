# 后端改动说明（CHANGELOG）

> 分支：`backend/platform-compat`　｜　维护：桂誉（计算机1247 10210423816）
> 说明范围：后端（Spring Boot + MySQL）。前端改动请看 `frontend/` 的提交。

## 2026-11-13　第二批：补齐前端新增的券、套餐与钱包接口（`0c07ace`）

main 分支前端这段时间加了领券中心、团购套餐、骑手天气补贴、钱包与提现，契约里写了但后端没有，
接真后端会 404。这一批按 `main` 的 `docs/api-contract.md` 原文补齐，前端可以接真接口了。

**新增接口**

| 模块 | 接口 | 说明 |
|---|---|---|
| 优惠券 | `GET /user/coupon/templates` | 领券中心，`claimed` 只表示手上有未用的一张 |
| 优惠券 | `POST /user/coupon/{id}/claim` | 领取；重复领取 → 400 + `code 4001` |
| 优惠券 | `GET /user/coupons?status=&orderAmount=&shopId=` | 我的券；传金额与店铺时额外回 `usable` |
| 骑手 | `GET /rider/weather` | 天气 + 时段补贴 `subsidy{active,amount,reason}` |
| 骑手 | `GET /rider/wallet` | 收入、补贴、余额、提现记录 |
| 骑手 | `POST /rider/withdraw` | 入参 `{amount,channel}`，`1 ≤ amount ≤ balance` |

**增强**

- `GET /user/menu?shopId=` 出参新增 `combos`（在售套餐 + `originPrice/dishCount/dishNames`）
- `POST /user/order` 支持 `couponId`；订单回填 `couponId / couponTitle / couponAmount`

**金额与收入口径（唯一版本，前端别另算）**

- 订单：`totalAmount = amount − discount − couponAmount + packFee + deliveryFee`
- 券门槛按**菜品金额**算，不含配送费；券抵扣不超过菜品小计，总额不会为负
- 骑手收入：`完成单数 × 5 + 当日完成单数 × 天气补贴`；`可提现余额 = 累计收入 − 已提现`
  `/rider/stats` 与 `/rider/wallet` 读同一份计算

**数据库升级（老库必须执行，否则启动报未知列）**

```sql
ALTER TABLE orders ADD COLUMN coupon_id BIGINT NULL,
                   ADD COLUMN coupon_title VARCHAR(64) NOT NULL DEFAULT '',
                   ADD COLUMN coupon_amount DECIMAL(10,2) NOT NULL DEFAULT 0;
-- coupon_template / user_coupon / wallet_record 由 schema.sql 新建
```

## 2026-11-13　第一批：对齐契约 + 满减 + 店铺设置（`21adbd2`）

- 时间统一 `yyyy-MM-dd HH:mm:ss`；主键字符串、计数与分页保持数字（`JacksonConfig` 只对装箱 Long 生效）
- 店铺级单档满减：`shop.full_amount / reduce_amount`，订单落 `discount`；口径 `amount − discount + packFee + deliveryFee`
- 新增商家端店铺设置：`GET /admin/shop`、`PUT /admin/shop`（单店模型，字段全可选，含 5 条校验）
- 测试改造：真连 MySQL 集成用例替代“数据库连不上也算通过”的假绿；`mvn test` 当时 23 个用例

```sql
ALTER TABLE shop ADD COLUMN full_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
                 ADD COLUMN reduce_amount DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN discount DECIMAL(10,2) NOT NULL DEFAULT 0;
```

## 当前测试与状态

- `mvn test`：**27 个用例全部通过**，其中 14 个真连 MySQL（无数据库时自动跳过，不拖垮构建）
- 演示账号：`merchant/merchant1234`（商家）、`rider/rider1234`（骑手）、`customer/customer1234`（顾客）
- 种子：4 家店、川味小馆 4 个菜 + 2 个套餐、4 张券模板、6 笔订单（含 1 笔今日完成单）

## 已知未完成（按优先级）

1. **套餐下单**：`items` 传 `comboId` 还没支持，要改 `order_item` 结构并拆金额，套餐目前只在菜单展示
2. **多店铺归属**：`/auth/login`、`/auth/me` 仍未返回 `shopId/shopName`，后台仍按配置项固定一家店
3. 天气是演示固定值（无外部天气源），只有补贴金额按时段真算
4. `backend/platform-compat` 尚未合并进 `main`（`main` 目前不含后端目录，合并顺序需与前端负责人确认）
