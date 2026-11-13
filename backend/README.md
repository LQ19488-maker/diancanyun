# 点单云 · Spring Boot 后端

《点单云》外卖平台后端，按前端仓库当前三角色和外卖流程契约实现。

## 技术基线

| 项 | 版本 |
|---|---|
| JDK | 25 |
| Spring Boot | 4.0.8 |
| Maven | 3.9+ |
| MySQL | 26.7 |
| MyBatis | 4.0.1 |
| 服务端口 | 8080 |

## 角色与入口

| 角色 | key | 前端入口 | 后端前缀 |
|---|---|---|---|
| 商家 | `MERCHANT` | 商家后台 | `/admin/**` |
| 骑手 | `RIDER` | 骑手工作台 | `/rider/**` |
| 顾客 | `CUSTOMER` | 外卖 H5 | `/user/**` |
| 三类共用 | — | 登录与当前用户 | `/auth/**` |

登录接口：

```text
POST /auth/login
{ "username": "merchant", "password": "merchant1234" }
```

## 已实现模块

| 模块 | 能力 |
|---|---|
| 认证 | `/auth/login`、`/auth/me`、JWT 三角色鉴权 |
| 商家 | 分类、口味、菜品、套餐、订单、统计、图片上传 |
| 骑手管理 | 骑手分页、新增、编辑、删除、启停、上线/休息 |
| 骑手工作台 | 当前资料、统计、可抢订单、抢单配送、我的配送、确认送达 |
| 店铺 | 店铺列表、店铺详情、营业状态、起送价和配送费 |
| 顾客 | 店铺点餐、菜单、收货地址、下单、订单详情、我的订单 |
| 订单 | 商家接单、骑手抢单、配送、送达、取消状态机 |

## 订单流程

```text
PENDING
  商家接单
    ↓
ACCEPTED
  骑手抢单
    ↓
DELIVERING
  骑手确认送达
    ↓
DONE
```

商家可在 `PENDING` 或 `ACCEPTED` 状态取消订单。

## 演示账号

| 用户名 | 密码 | 角色 |
|---|---|---|
| `merchant` | `merchant1234` | 商家 |
| `rider` | `rider1234` | 骑手 |
| `rider2` | `rider21234` | 骑手 |
| `customer` | `customer1234` | 顾客 |

## 数据库初始化

```sql
CREATE DATABASE dandanyun
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;
```

PowerShell：

```powershell
$env:DB_URL = "jdbc:mysql://127.0.0.1:3306/dandanyun?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true&useSSL=false"
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = "你的数据库密码"
$env:DB_INIT_MODE = "always"
$env:DANDANYUN_JWT_SECRET = "至少32字节、部署时必须替换的随机密钥"
```

首次启动执行建表和初始化数据，之后把 `DB_INIT_MODE` 改成 `never`。

## 构建与启动

```powershell
.\build.bat
.\start.bat
```

也可以：

```powershell
mvn clean package
java -jar target\dandanyun-server-0.0.1-SNAPSHOT.jar
```

## 环境变量

| 变量 | 默认值 | 说明 |
|---|---|---|
| `DB_URL` | 本地 `dandanyun` | JDBC 地址 |
| `DB_USERNAME` | `root` | 数据库用户 |
| `DB_PASSWORD` | 空 | 数据库密码 |
| `DB_POOL_SIZE` | `10` | HikariCP 连接数 |
| `DB_INIT_MODE` | `never` | 是否初始化数据库 |
| `DANDANYUN_JWT_SECRET` | 开发默认值 | JWT 密钥，至少 32 字节 |
| `DANDANYUN_JWT_EXPIRATION_SECONDS` | `7200` | Token 有效期 |
| `DANDANYUN_PASSWORD_ITERATIONS` | `120000` | PBKDF2 迭代次数 |
| `UPLOAD_DIR` | `./uploads` | 图片目录 |
| `MERCHANT_SHOP_ID` | `10001` | 商家菜品所属店铺 ID |

## 返回约定

```json
{ "code": 200, "message": "ok", "data": {} }
```

所有 Long 主键序列化为字符串，避免 JavaScript 精度丢失。

## 测试

```powershell
mvn test
```

测试覆盖应用启动、三角色鉴权、JWT、密码、公开路径、Long 序列化和前端路由契约。
