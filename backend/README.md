# 点单云 · Spring Boot 后端

《点单云》餐饮点餐系统的后端服务，已按团队前端仓库
[LQ19488-maker/diancanyun](https://github.com/LQ19488-maker/diancanyun)
的接口契约完成适配。

本项目为纯 Java 后端，包含管理端、H5 点餐、JWT 鉴权、MySQL 持久化和统计接口。

## 技术基线

| 项 | 版本 |
|---|---|
| JDK | 25 |
| Spring Boot | 4.0.8 |
| Maven | 3.9+ |
| MySQL | 26.7 |
| MyBatis | 4.0.1 |
| Web 服务端口 | 8080 |

## 已实现

| 模块 | 能力 |
|---|---|
| 登录鉴权 | `/admin/login`、JWT、`ADMIN` / `STAFF` 角色 |
| 员工 | 当前用户、分页、新增、编辑、删除、启停 |
| 分类 | 分页、新增、编辑、删除、引用检查 |
| 口味 | 分类口味读取与整体覆盖保存 |
| 菜品 | 分页、新增、编辑、删除、上下架、口味 JSON |
| 套餐 | 分页、详情、新增、编辑、删除、上下架、菜品关联 |
| 订单 | H5 下单、分页、详情、状态数量、状态机流转 |
| H5 用户端 | 菜单、提交订单、订单详情、我的订单 |
| 统计 | 营业额、订单量、客单价、完成率、趋势、状态分布、热销菜品 |
| 上传 | `/admin/upload`，图片存储到可配置目录 |
| 公共能力 | 统一返回、异常处理、请求 ID、Long 字符串序列化、CORS |

完整接口与前端字段对应关系见 [docs/api-compatibility.md](docs/api-compatibility.md)。

## 前端对接

前端仓库：<https://github.com/LQ19488-maker/diancanyun>

在 `frontend/.env.local` 中设置：

```dotenv
VITE_USE_MOCK=false
VITE_PROXY_TARGET=http://127.0.0.1:8080
VITE_API_BASE=
VITE_UPLOAD_BASE=
```

管理端登录：

```text
POST /admin/login
{ "username": "admin", "password": "admin1234" }
```

H5 用户端无需登录，直接访问：

```text
GET /user/menu
POST /user/order
GET /user/order/{id}
GET /user/orders
```

## 数据库初始化

### 1. 创建数据库

```sql
CREATE DATABASE dandanyun
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;
```

### 2. 配置环境变量

PowerShell 示例：

```powershell
$env:DB_URL = "jdbc:mysql://127.0.0.1:3306/dandanyun?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true&useSSL=false"
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = "你的数据库密码"
$env:DB_INIT_MODE = "always"
$env:DANDANYUN_JWT_SECRET = "至少32字节、部署时必须替换的随机密钥"
```

首次启动使用 `DB_INIT_MODE=always` 执行 `schema.sql` 和 `data.sql`，之后改为 `never`。

### 3. 构建并启动

```powershell
.\build.bat
.\start.bat
```

也可以：

```powershell
mvn clean package
java -jar target\dandanyun-server-0.0.1-SNAPSHOT.jar
```

## 演示账号

| 用户名 | 密码 | 角色 |
|---|---|---|
| `admin` | `admin1234` | ADMIN |
| `hyh` | `hyh1234` | ADMIN |
| `gy` | `gy1234` | ADMIN |
| `staff` | `staff1234` | STAFF |

演示密码仅用于本地和课程演示，正式部署前需要替换。

## 环境变量

| 变量 | 默认值 | 说明 |
|---|---|---|
| `DB_URL` | 本地 `dandanyun` 数据库 | JDBC 地址 |
| `DB_USERNAME` | `root` | 数据库用户 |
| `DB_PASSWORD` | 空 | 数据库密码 |
| `DB_POOL_SIZE` | `10` | HikariCP 最大连接数 |
| `DB_INIT_MODE` | `never` | 是否执行初始化脚本 |
| `DANDANYUN_JWT_SECRET` | 开发默认值 | JWT 密钥，至少 32 字节 |
| `DANDANYUN_JWT_EXPIRATION_SECONDS` | `7200` | Token 有效期 |
| `DANDANYUN_PASSWORD_ITERATIONS` | `120000` | PBKDF2 迭代次数 |
| `UPLOAD_DIR` | `./uploads` | 图片存储目录 |

## 接口返回

成功：

```json
{ "code": 200, "message": "ok", "data": {} }
```

分页：

```json
{ "total": 1, "records": [], "page": 1, "pageSize": 10 }
```

所有 Long 主键均序列化为字符串，避免 JavaScript 大整数精度丢失。

## 测试

```powershell
mvn test
```

当前测试覆盖：

- 应用启动、健康检查和数据库就绪检查
- `/admin/login` 和 H5 菜单公开路径
- JWT 签发、签名篡改和过期校验
- PBKDF2 密码摘要
- `ADMIN` / `STAFF` 管理端访问
- Long 主键字符串序列化

数据库业务接口的端到端测试需要提供可用的 MySQL 凭据。
