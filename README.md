# 点单云 · 餐饮点餐管理系统

> 课程项目（团队协作）· 本仓库为单库结构：`frontend/`（前端，LTQ）+ `backend/`（后端，Spring Boot）+ `docs/`

在线演示（前端演示版，内置演示数据、无需后端）：
`https://lq19488-maker.github.io/diancanyun/`
演示账号：`admin / admin1234`（管理员）、`staff / staff1234`（员工）

---

## 一、目录约定（**动代码前先看这三条**）

```
diancanyun/
├── frontend/     前端（Vue3 + Vite + Element Plus + Axios）—— LTQ 负责
├── backend/      后端（Spring Boot 3 + MySQL + Redis）—— 后端同学负责
├── docs/         接口契约、页面清单、图表（团队共用，谁都能改）
└── .github/      Pages 自动发布（只构建 frontend/）
```

1. 前端代码**只能**放在 `frontend/`，后端代码**只能**放在 `backend/`，根目录只放 README / docs / 配置。
2. `node_modules/`、`dist/`、`target/` **一律不入库**（已在 `.gitignore` 里）。
3. 改前端的人不碰 `backend/`，改后端的人不碰 `frontend/`。

---

## 二、前端怎么跑

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173  （演示数据模式，无需后端）
```

想连真实后端时，复制 `.env.example` 为 `.env.local`，把 `VITE_USE_MOCK` 改成 `false`，
`npm run dev` 会通过 `vite.config.js` 里的代理把 `/api` 转发到 `http://127.0.0.1:8080`。

打包：

```bash
npm run build                      # 连真实后端用（base 取 .env.local 的 VITE_BASE）
VITE_USE_MOCK=true VITE_BASE=/diancanyun/ npm run build    # 演示版（CI 里用的就是这条）
```

## 三、前端工程约定（新人接手必读）

| 约定 | 说明 |
|---|---|
| 路由 | **hash 模式**（`/#/dashboard`）。GitHub Pages 是纯静态托管，history 模式刷新会 404 |
| 请求 | 只用 `src/api/index.js` → `adapters/*` → `http.js` 三层。页面里禁止出现 axios、接口 URL、字段名转换 |
| 双数据源 | `VITE_USE_MOCK=true` 时走 `src/api/mock/`，它返回**后端风格报文**，与真实接口共用同一套 adapter |
| 列表页 | 用 `useTable` + `ProTable`，自带分页、加载骨架、空状态、错误重试 |
| 弹窗表单 | 用 `useCrud`，统一处理新增/编辑/校验/提交/删除二次确认 |
| 状态 | 所有枚举与订单状态机在 `src/constants/enums.js`，页面禁止写魔法数字 |
| 三态 | 每个页面必须有：加载中（骨架屏）、空数据（一句人话 + 操作入口）、出错（错误码 + 重试） |
| 体积 | Element Plus 必须按需引入，构建产物控制在 2 MB 以内 |

## 四、当前进度

| 模块 | 状态 |
|---|---|
| 工程脚手架、路由、权限守卫、Axios 封装、双数据源 | ✅ 已完成 |
| 登录页（含 token 持久化、401 回跳） | ✅ 已完成 |
| 员工管理（搜索 / 分页 / 新增 / 编辑 / 启停 / 删除） | ✅ 已完成（演示数据可跑通） |
| 工作台指标卡 | ✅ 已完成（接口就绪后自动切真实数据） |
| 分类管理 + 口味配置（标签页、CRUD、口味值标签编辑、整体覆盖保存） | ✅ 已完成 |
| 菜品 / 套餐 / 订单管理 | ⏳ 页面占位，按 `docs/pages.md` 排期实现 |
| H5 用户端点餐 | ⏳ 待排期 |
| 订单统计图表（ECharts） | ⏳ 待统计接口 |

## 五、演示与部署

- 演示版（GitHub Pages）：push 到 `main` 且改动包含 `frontend/**` 时自动构建发布，**固定走演示数据**。
  演示版不连真实后端——HTTPS 页面请求 HTTP 接口会被浏览器拦截，这是刻意设计。
- 真机版：后端跑在 `127.0.0.1:8080`，前端 `npm run dev` 通过代理访问；最终由 Nginx 同域反代 `/api`。

## 六、给后端同学的对接说明

请先读 `docs/api-contract.md`：里面写明了统一响应体、分页参数、鉴权方式和已实现的接口清单。
前端已经按这份契约做好了适配层，**只要接口形状一致，前端一行都不用改**；如果必须不一样，
改 `src/api/adapters/*.js` 一处即可，并把差异记到 `docs/api-contract.md` 的“已知差异”小节。
