# elysia-template

基于 [ElysiaJS](https://elysiajs.com/) 的后端服务，运行在 Bun 上。

## 技术栈

- **运行时**: Bun
- **框架**: ElysiaJS
- **ORM**: Drizzle ORM (SQLite / bun:sqlite)
- **中间件**: CORS、OpenAPI (Swagger)、logixlysia (请求日志)
- **类型安全客户端**: @elysia/eden (Eden Treaty)
- **测试**: bun:test + Eden Treaty

## 快速开始

```bash
bun install
bun run dev
```

访问 http://localhost:3000 查看服务，访问 http://localhost:3000/openapi 查看 API 文档。

## 项目结构

```
src/
├── index.ts              # 服务入口，注册中间件和路由
├── db/
│   ├── index.ts          # 数据库连接（bun:sqlite + Drizzle）
│   ├── schema.ts         # 表结构定义
│   └── migrate.ts        # 迁移脚本
├── modules/
│   ├── index.ts          # 模块统一导出
│   └── movie/
│       ├── index.ts      # 路由控制器（Elysia 实例）
│       ├── model.ts      # TypeBox 校验模型 + TypeScript 类型
│       └── service.ts    # 业务逻辑层（通过构造函数注入数据库）
test/
├── index.test.ts         # 根路由测试
└── movie.test.ts         # 电影 CRUD 集成测试（Eden Treaty + 内存 SQLite）
```

### 架构说明

每个模块遵循 MVC 分层：

- **model.ts** — 定义 TypeBox 校验模型，同时导出对应的 TypeScript 类型
- **service.ts** — 纯业务逻辑，通过构造函数接收数据库实例（便于测试替换）
- **index.ts** — Elysia 路由控制器，通过 `createMovieRouter(db)` 工厂函数创建，支持依赖注入

所有业务接口统一挂在 `/api` 前缀下。

## 数据库

使用 Drizzle ORM + SQLite，表结构定义在 `src/db/schema.ts`。

```bash
# 运行迁移
bun run src/db/migrate.ts
```

### 当前表结构

**movies** — 电影表

| 字段 | 数据库列名 | 类型 | 说明 |
|------|-----------|------|------|
| id | id | INTEGER | 主键，自增 |
| title | name | TEXT | 电影名称，非空 |
| releaseYear | release_year | INTEGER | 上映年份，非空 |

> 注意：TypeScript 字段名与数据库列名不同（如 `title` → `name`），由 Drizzle 自动映射。

## API 接口

所有接口前缀为 `/api`。

| 方法 | 路径 | 说明 | 请求体 | 响应 |
|------|------|------|--------|------|
| GET | `/api/movies` | 获取所有电影 | — | `200 Movie[]` |
| GET | `/api/movies/:id` | 获取单个电影 | — | `200 Movie` / `404` |
| POST | `/api/movies` | 创建电影 | `CreateMovie` | `201 Movie` |
| PUT | `/api/movies/:id` | 更新电影 | `UpdateMovie` | `200 Movie` / `404` |
| DELETE | `/api/movies/:id` | 删除电影 | — | `200 Movie` / `404` |

### 请求体校验

```typescript
// CreateMovie — 创建电影
{ title: string (至少1字符), releaseYear: number (最小1888) }

// UpdateMovie — 更新电影（所有字段可选）
{ title?: string, releaseYear?: number }
```

### 错误响应

```json
{ "message": "Movie not found" }
```

校验失败返回 `422`，资源不存在返回 `404`。

## 测试

```bash
bun test
```

测试使用 Eden Treaty 作为 HTTP 客户端，每个测试创建独立的内存 SQLite 数据库，互不影响。

## 脚本

| 命令 | 说明 |
|------|------|
| `bun run dev` | 启动开发服务器 (--watch) |
| `bun test` | 运行测试 |
| `bun run lint` | 代码检查 |
| `bun run lint:fix` | 自动修复 |

## 日志

使用 [logixlysia](https://github.com/PigeonTheBug/logixlysia) 中间件记录请求日志：

- 慢请求阈值：500ms
- 极慢请求阈值：1000ms
- 日志文件：`./logs/app.log`
- 包含客户端 IP、时间戳等信息
