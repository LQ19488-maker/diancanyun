# backend/ —— 后端代码放这里

> 本目录由后端同学负责，前端（`frontend/`）不依赖这里的具体实现，只依赖 `docs/api-contract.md`。

## 目录约定

把 Spring Boot 工程直接放在 `backend/` 下，即：

```
backend/
├── pom.xml
└── src/main/java/com/diancanyun/...
```

## 要求（与前端约定一致的三条）

1. **端口 8080**，全局路径前缀 `/api`（前端 `vite.config.js` 的代理和 `VITE_API_BASE` 都按这个配）。
2. **统一响应体** `{ code, msg, data }`，成功 `code = 0`；错误码与前端 `src/api/http.js` 的映射对齐（见契约 1.2）。
3. **Long 主键序列化成字符串**（Jackson 全局配置），否则前端 JS 会因精度丢失而查不到数据。

## 本地怎么和前端联调

```bash
# 1) 起后端（8080）
mvn spring-boot:run

# 2) 起前端（在 frontend/ 下）
copy .env.example .env.local
# 把 .env.local 里的 VITE_USE_MOCK 改成 false，然后
npm run dev
```

前端开发服务器会把 `/api` 与 `/upload` 代理到 `127.0.0.1:8080`，无需处理跨域。

## 尚未创建

本目录当前为空（只有本说明）。请后端同学建好工程后，把第一版接口按契约实现，
联调时在 `docs/api-contract.md` 的「已知差异」表里登记任何字段/形状不一致。
