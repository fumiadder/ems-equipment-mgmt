# 设备管理系统后端服务联调测试报告

## 基本信息

- **测试项目**: whybuddy_equipment_mgmt/server (Node.js 后端服务)
- **测试日期**: 2026-06-12
- **测试环境**: Linux / Node.js v22.22.2
- **测试范围**: 依赖完整性、数据库配置、API 路由、中间件、外部系统集成、配置文件

---

## 一、package.json 依赖完整性

### 1.1 依赖列表

| 依赖包 | 版本 | 用途 | 状态 |
|--------|------|------|------|
| express | ^4.18.2 | Web 框架 | 已安装 |
| sequelize | ^6.35.0 | ORM 框架 | 已安装 |
| sqlite3 | ^5.1.6 | SQLite 驱动 | 已安装 |
| bcryptjs | ^2.4.3 | 密码加密 | 已安装 |
| jsonwebtoken | ^9.0.2 | JWT 认证 | 已安装 |
| cors | ^2.8.5 | 跨域处理 | 已安装 |

### 1.2 测试结果

- **npm install**: 通过，228 个包已安装
- **npm rebuild sqlite3**: 通过，原生绑定编译成功
- **应用加载**: 通过，可正常 require 启动

### 1.3 发现的问题

| 问题 | 严重级别 | 说明 |
|------|---------|------|
| 安全漏洞 (9个) | 高 | `sqlite3@5.1.6` 依赖的 `tar`、`node-gyp`、`make-fetch-happen` 存在高危漏洞；`sequelize` 存在 moderate 级别漏洞 |
| 缺少开发依赖 | 中 | 无测试框架 (jest/mocha)、无代码检查工具 (eslint)、无进程管理器 (pm2/nodemon) |
| 缺少 scripts | 中 | 仅有 `start` 脚本，缺少 `test`、`dev`、`lint` 等常用脚本 |

### 1.4 修复建议

1. **升级 sqlite3 到 ^6.0.1** 或迁移到 `better-sqlite3` 以消除高危安全漏洞
2. **添加开发依赖**:
   ```json
   "devDependencies": {
     "jest": "^29.7.0",
     "supertest": "^6.3.3",
     "eslint": "^8.57.0",
     "nodemon": "^3.0.2"
   }
   ```
3. **补充 npm scripts**:
   ```json
   "scripts": {
     "start": "node src/seed/seed.js && node src/app.js",
     "dev": "nodemon src/app.js",
     "test": "jest --coverage",
     "lint": "eslint src/"
   }
   ```

---

## 二、数据库连接配置和模型定义

### 2.1 数据库配置

- **配置文件**: `/workspace/whybuddy_equipment_mgmt/server/src/config/database.js`
- **数据库类型**: SQLite
- **存储路径**: `./data/database.sqlite`
- **日志**: 已关闭 (logging: false)

### 2.2 模型定义检查

| 模型 | 表名 | 主键 | 时间戳 | 状态 |
|------|------|------|--------|------|
| Equipment | equipments | id (自增) | createdAt, updatedAt | 通过 |
| LifecycleEvent | lifecycle_events | id (自增) | createdAt | 通过 |
| WorkOrder | work_orders | id (自增) | createdAt, updatedAt | 通过 |
| MaintenancePlan | maintenance_plans | id (自增) | createdAt, updatedAt | 通过 |
| SparePart | spare_parts | id (自增) | createdAt, updatedAt | 通过 |
| InspectionPlan | inspection_plans | id (自增) | createdAt, updatedAt | 通过 |
| InspectionRecord | inspection_records | id (自增) | createdAt | 通过 |
| Organization | organizations | id (自增) | createdAt, updatedAt | 通过 |
| User | users | id (自增) | createdAt, updatedAt | 通过 |
| Role | roles | id (自增) | createdAt | 通过 |
| AuditLog | audit_logs | id (自增) | createdAt | 通过 |

### 2.3 模型关联检查

| 关联关系 | 类型 | 外键 | 状态 |
|----------|------|------|------|
| Equipment -> LifecycleEvent | hasMany | equipmentId | 通过 |
| Equipment -> WorkOrder | hasMany | equipmentId | 通过 |
| Equipment -> MaintenancePlan | hasMany | equipmentId | 通过 |
| Equipment -> InspectionRecord | hasMany | equipmentId | 通过 |
| InspectionPlan -> InspectionRecord | hasMany | planId | 通过 |
| Organization -> Organization (自关联) | hasMany | parentId | 通过 |
| Organization -> User | hasMany | organizationId | 通过 |
| User -> AuditLog | hasMany | userId | 通过 |
| WorkOrder -> User (assignedTo) | belongsTo | assignedTo | 通过 |
| WorkOrder -> User (createdBy) | belongsTo | createdBy | 通过 |

### 2.4 发现的问题

| 问题 | 严重级别 | 说明 |
|------|---------|------|
| 缺少唯一约束 | 中 | `Equipment.code`、`WorkOrder.orderNo`、`SparePart.code` 等业务关键字段未设置 `unique: true` |
| 缺少索引优化 | 低 | 高频查询字段 (status, type, organizationId 等) 未建立数据库索引 |
| 外键约束未启用 | 低 | SQLite 默认未启用外键约束，可能导致数据不一致 |
| User.status 默认值不一致 | 低 | 模型默认值为 '启用'，但控制器 toggleStatus 中对比的是 'active'/'disabled' |

### 2.5 修复建议

1. **添加唯一约束**:
   ```javascript
   code: { type: Sequelize.STRING, allowNull: false, unique: true }
   ```
2. **启用 SQLite 外键约束**:
   ```javascript
   const sequelize = new Sequelize({
     dialect: 'sqlite',
     storage: path.join(__dirname, '..', '..', 'data', 'database.sqlite'),
     logging: false,
     dialectOptions: { foreignKeys: true }
   });
   ```
3. **统一状态枚举值**: 建议将 User.status 的默认值改为 'active'，与控制器逻辑保持一致

---

## 三、API 路由检查

### 3.1 路由注册检查

**入口文件**: `/workspace/whybuddy_equipment_mgmt/server/src/routes/index.js`

| 路由前缀 | 路由文件 | 状态 |
|----------|----------|------|
| /api/v1/equipment | equipment.js | 已注册 |
| /api/v1/work-orders | workOrder.js | 已注册 |
| /api/v1/spare-parts | sparePart.js | 已注册 |
| /api/v1/inspection | inspection.js | 已注册 |
| /api/v1/organizations | organization.js | 已注册 |
| /api/v1/users | user.js | 已注册 |
| /api/v1/dashboard | dashboard.js | 已注册 |

### 3.2 各模块路由详情

#### Equipment 路由 (`/api/v1/equipment`)

| 方法 | 路径 | 处理器 | 认证 | 状态 |
|------|------|--------|------|------|
| GET | / | list | 无 | 通过 |
| POST | / | create | 无 | 通过 |
| GET | /:id | getById | 无 | 通过 |
| PUT | /:id | update | 无 | 通过 |
| DELETE | /:id | delete | 无 | 通过 |

#### WorkOrder 路由 (`/api/v1/work-orders`)

| 方法 | 路径 | 处理器 | 认证 | 状态 |
|------|------|--------|------|------|
| GET | / | list | 无 | 通过 |
| POST | / | create | 无 | 通过 |
| GET | /:id | getById | 无 | 通过 |
| PUT | /:id | update | 无 | 通过 |
| PATCH | /:id/status | updateStatus | 无 | 通过 |

#### SparePart 路由 (`/api/v1/spare-parts`)

| 方法 | 路径 | 处理器 | 认证 | 状态 |
|------|------|--------|------|------|
| GET | / | list | 无 | 通过 |
| POST | / | create | 无 | 通过 |
| POST | /:id/inbound | inbound | 无 | 通过 |
| POST | /:id/outbound | outbound | 无 | 通过 |
| GET | /:id | getById | 无 | 通过 |
| PUT | /:id | update | 无 | 通过 |
| DELETE | /:id | delete | 无 | 通过 |

#### Inspection 路由 (`/api/v1/inspection`)

| 方法 | 路径 | 处理器 | 认证 | 状态 |
|------|------|--------|------|------|
| GET | /plans | listPlans | 无 | 通过 |
| POST | /plans | createPlan | 无 | 通过 |
| GET | /plans/:id | getPlanById | 无 | 通过 |
| PUT | /plans/:id | updatePlan | 无 | 通过 |
| GET | /records | listRecords | 无 | 通过 |
| POST | /records | createRecord | 无 | 通过 |

#### Organization 路由 (`/api/v1/organizations`)

| 方法 | 路径 | 处理器 | 认证 | 状态 |
|------|------|--------|------|------|
| GET | /tree | tree | 无 | 通过 |
| GET | / | list | 无 | 通过 |
| POST | / | create | 无 | 通过 |
| PUT | /:id | update | 无 | 通过 |
| DELETE | /:id | delete | 无 | 通过 |

#### User 路由 (`/api/v1/users`)

| 方法 | 路径 | 处理器 | 认证 | 状态 |
|------|------|--------|------|------|
| GET | / | list | 无 | 通过 |
| POST | / | create | 无 | 通过 |
| POST | /:id/reset-password | resetPassword | 无 | 通过 |
| PATCH | /:id/status | toggleStatus | 无 | 通过 |
| GET | /:id | getById | 无 | 通过 |
| PUT | /:id | update | 无 | 通过 |
| DELETE | /:id | delete | 无 | 通过 |

#### Dashboard 路由 (`/api/v1/dashboard`)

| 方法 | 路径 | 处理器 | 认证 | 状态 |
|------|------|--------|------|------|
| GET | /stats | getStats | 无 | 通过 |
| GET | /equipment-status | getEquipmentStatus | 无 | 通过 |
| GET | /recent-work-orders | getRecentWorkOrders | 无 | 通过 |
| GET | /recent-equipments | getRecentEquipments | 无 | 通过 |

### 3.3 发现的问题

| 问题 | 严重级别 | 说明 |
|------|---------|------|
| **所有路由均未启用认证** | 严重 | auth 中间件已定义但未被任何路由使用，API 完全开放 |
| 缺少登录/登出接口 | 高 | 无 `/api/v1/auth/login`、`/api/v1/auth/logout` 等认证相关路由 |
| 缺少 MaintenancePlan 路由 | 中 | 模型已定义但无对应路由和控制器 |
| 缺少 AuditLog 路由 | 中 | 模型已定义但无对应路由和控制器 |
| 缺少 Role 路由 | 中 | 模型已定义但无对应路由和控制器 |
| 缺少文件上传接口 | 低 | 设备图片、附件等无上传处理 |

### 3.4 修复建议

1. **立即为所有路由添加认证中间件**:
   ```javascript
   const auth = require('../middleware/auth');
   router.use('/equipment', auth, require('./equipment'));
   // ... 所有路由
   ```
2. **添加认证路由模块**:
   ```javascript
   // routes/auth.js
   router.post('/login', authController.login);
   router.post('/logout', auth, authController.logout);
   router.get('/profile', auth, authController.profile);
   ```
3. **补充缺失的业务模块路由**: MaintenancePlan、AuditLog、Role
4. **添加文件上传支持**: 使用 `multer` 中间件处理图片和附件上传

---

## 四、中间件检查

### 4.1 已配置中间件

| 中间件 | 文件 | 功能 | 状态 |
|--------|------|------|------|
| cors | app.js | 跨域处理 | 通过 |
| express.json | app.js | JSON 请求体解析 | 通过 |
| express.urlencoded | app.js | URL 编码解析 | 通过 |
| errorHandler | middleware/errorHandler.js | 全局错误处理 | 通过 |
| auth | middleware/auth.js | JWT 认证 | 已定义但未使用 |

### 4.2 认证中间件检查

**文件**: `/workspace/whybuddy_equipment_mgmt/server/src/middleware/auth.js`

| 检查项 | 状态 | 说明 |
|--------|------|------|
| JWT 密钥硬编码 | 失败 | `JWT_SECRET` 为硬编码字符串，存在安全风险 |
| Token 提取逻辑 | 通过 | 正确从 `Authorization: Bearer <token>` 提取 |
| Token 验证 | 通过 | 使用 `jwt.verify` 验证 |
| 错误响应 | 通过 | 返回 401 状态码和清晰错误信息 |
| 用户信息挂载 | 通过 | 将 decoded token 挂载到 `req.user` |

### 4.3 错误处理中间件检查

**文件**: `/workspace/whybuddy_equipment_mgmt/server/src/middleware/errorHandler.js`

| 检查项 | 状态 | 说明 |
|--------|------|------|
| SequelizeValidationError | 通过 | 返回 400 和验证错误信息 |
| SequelizeUniqueConstraintError | 通过 | 返回 400 和唯一约束错误 |
| 默认错误 | 通过 | 返回 500 服务器内部错误 |
| 错误日志 | 通过 | 使用 console.error 输出 |

### 4.4 发现的问题

| 问题 | 严重级别 | 说明 |
|------|---------|------|
| **JWT 密钥硬编码** | 严重 | 密钥写入源码，泄露后所有 token 失效 |
| 无请求日志中间件 | 中 | 无法追踪请求和响应信息 |
| 无速率限制 | 中 | 无防暴力破解和 DDoS 保护 |
| 无请求体大小限制 | 中 | `express.json()` 未设置 limit，可能被大请求体攻击 |
| 无 Helmet 安全头 | 中 | 缺少 X-Frame-Options、XSS-Protection 等安全头 |
| 无输入校验中间件 | 中 | 所有请求参数直接进入数据库，存在注入风险 |
| auth 中间件未挂载 | 严重 | 虽然已定义，但没有任何路由使用 |

### 4.5 修复建议

1. **JWT 密钥环境变量化**:
   ```javascript
   const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
   ```
2. **添加请求日志中间件** (morgan 或自定义):
   ```javascript
   app.use(require('morgan')('combined'));
   ```
3. **添加速率限制**:
   ```javascript
   const rateLimit = require('express-rate-limit');
   app.use('/api/', rateLimit({ windowMs: 15*60*1000, max: 100 }));
   ```
4. **添加 Helmet 安全头**:
   ```javascript
   app.use(require('helmet')());
   ```
5. **限制请求体大小**:
   ```javascript
   app.use(express.json({ limit: '10mb' }));
   ```
6. **添加输入校验** (joi 或 express-validator):
   ```javascript
   const { body, validationResult } = require('express-validator');
   ```

---

## 五、外部系统集成接口检查

### 5.1 SCADA 集成

| 检查项 | 状态 | 说明 |
|--------|------|------|
| SCADA 数据接收接口 | 不存在 | 无实时数据采集接口 |
| SCADA 设备状态同步 | 不存在 | 无设备状态双向同步机制 |
| SCADA 报警推送 | 不存在 | 无报警接收和处理接口 |
| MQTT/OPC-UA 客户端 | 不存在 | 无工业协议客户端 |

### 5.2 MES 集成

| 检查项 | 状态 | 说明 |
|--------|------|------|
| MES 设备信息同步 | 不存在 | 无与 MES 系统的数据交换 |
| MES 工单对接 | 不存在 | 无工单状态回写 MES 接口 |
| MES 生产数据获取 | 不存在 | 无获取生产计划、产量等数据 |
| REST/SOAP 客户端 | 不存在 | 无外部系统 HTTP 调用封装 |

### 5.3 发现的问题

| 问题 | 严重级别 | 说明 |
|------|---------|------|
| **无外部系统集成** | 高 | 作为设备管理系统，缺少与 SCADA、MES 等核心系统的集成能力 |
| 无 Webhook 支持 | 中 | 无法向外部系统推送事件通知 |
| 无消息队列集成 | 中 | 无 RabbitMQ/Kafka 等异步消息处理 |

### 5.4 修复建议

1. **添加 SCADA 数据采集模块**:
   - 创建 `src/services/scadaService.js`
   - 支持 MQTT/OPC-UA 协议订阅设备数据
   - 提供 `/api/v1/scada/data` 接收推送数据的接口
2. **添加 MES 对接模块**:
   - 创建 `src/services/mesService.js`
   - 封装 MES REST API 调用
   - 实现设备信息、工单状态的双向同步
3. **添加 Webhook 支持**:
   - 支持配置外部系统回调 URL
   - 在设备状态变更、工单创建等事件时触发通知

---

## 六、单元测试和覆盖率

### 6.1 测试框架检查

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 测试框架 | 不存在 | 无 Jest/Mocha 等测试框架 |
| 测试文件 | 不存在 | 无任何 `.test.js` 或 `.spec.js` 文件 |
| 测试脚本 | 不存在 | package.json 中无 test script |
| 覆盖率报告 | 不存在 | 无覆盖率配置和报告 |

### 6.2 发现的问题

| 问题 | 严重级别 | 说明 |
|------|---------|------|
| **完全无单元测试** | 严重 | 生产环境代码无任何自动化测试覆盖 |
| 无集成测试 | 高 | 无 API 接口的端到端测试 |
| 无测试数据库配置 | 中 | 测试和生产共用同一 SQLite 文件 |

### 6.3 修复建议

1. **安装测试依赖**:
   ```bash
   npm install --save-dev jest supertest
   ```
2. **创建测试目录结构**:
   ```
   tests/
   ├── unit/
   │   ├── controllers/
   │   ├── models/
   │   └── middleware/
   └── integration/
       └── routes/
   ```
3. **编写核心测试用例**:
   - 认证中间件测试
   - 各控制器 CRUD 操作测试
   - 模型关联和验证测试
   - API 路由端到端测试
4. **配置测试数据库**:
   ```javascript
   // config/database.js
   const storage = process.env.NODE_ENV === 'test'
     ? ':memory:'
     : path.join(__dirname, '..', '..', 'data', 'database.sqlite');
   ```

---

## 七、配置文件检查

### 7.1 环境变量检查

| 配置项 | 来源 | 当前值 | 状态 |
|--------|------|--------|------|
| PORT | process.env | 3001 (默认值) | 通过 |
| NODE_ENV | render.yaml | production | 通过 |
| JWT_SECRET | 硬编码 | ems-server-secret-key-2024 | 失败 |
| DB_PATH | 硬编码 | ./data/database.sqlite | 通过 |

### 7.2 配置文件检查

| 文件 | 存在 | 说明 |
|------|------|------|
| .env | 不存在 | 缺少环境变量配置文件 |
| .env.example | 不存在 | 缺少环境变量模板 |
| .env.production | 不存在 | 缺少生产环境配置 |
| config/ 目录 | 存在 | 仅包含 database.js |

### 7.3 render.yaml 检查

**文件**: `/workspace/whybuddy_equipment_mgmt/server/render.yaml`

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 服务类型 | 通过 | web 服务 |
| 构建命令 | 通过 | npm install |
| 启动命令 | 通过 | npm start |
| 环境变量 | 通过 | PORT=3001, NODE_ENV=production |

### 7.4 发现的问题

| 问题 | 严重级别 | 说明 |
|------|---------|------|
| **无 .env 文件** | 高 | 所有配置硬编码在源码中，无法根据不同环境灵活配置 |
| **JWT_SECRET 硬编码** | 严重 | 安全密钥暴露在源码中 |
| **数据库路径硬编码** | 中 | 无法灵活配置数据库存储位置 |
| **缺少环境配置模板** | 中 | 新开发者无法快速了解需要配置哪些环境变量 |
| **CORS 未配置白名单** | 中 | `app.use(cors())` 允许所有来源，生产环境存在安全风险 |

### 7.5 修复建议

1. **创建 .env 文件**:
   ```
   PORT=3001
   NODE_ENV=development
   JWT_SECRET=your-super-secret-key-change-in-production
   DB_PATH=./data/database.sqlite
   CORS_ORIGIN=http://localhost:3000
   ```
2. **创建 .env.example 模板**:
   ```
   PORT=3001
   NODE_ENV=development
   JWT_SECRET=
   DB_PATH=./data/database.sqlite
   CORS_ORIGIN=
   ```
3. **安装 dotenv**:
   ```bash
   npm install dotenv
   ```
4. **在 app.js 顶部加载环境变量**:
   ```javascript
   require('dotenv').config();
   ```
5. **配置 CORS 白名单**:
   ```javascript
   const corsOptions = {
     origin: process.env.CORS_ORIGIN || '*',
     credentials: true
   };
   app.use(cors(corsOptions));
   ```

---

## 八、综合问题汇总

### 8.1 严重问题 (必须立即修复)

| # | 问题 | 影响 | 修复优先级 |
|---|------|------|-----------|
| 1 | 所有 API 路由均未启用认证 | 系统完全开放，任何人可访问所有数据 | P0 |
| 2 | JWT 密钥硬编码在源码中 | 密钥泄露后所有用户 token 可被伪造 | P0 |
| 3 | 无单元测试和集成测试 | 代码变更无法验证，生产环境风险极高 | P0 |
| 4 | sqlite3 存在 5 个高危安全漏洞 | 可能被利用进行文件覆盖等攻击 | P0 |

### 8.2 高风险问题 (建议尽快修复)

| # | 问题 | 影响 | 修复优先级 |
|---|------|------|-----------|
| 5 | 无登录/认证相关 API | 用户无法登录，前端无法获取 token | P1 |
| 6 | 无 .env 配置文件 | 配置管理混乱，无法区分环境 | P1 |
| 7 | 无请求日志和监控 | 出现问题无法追踪和排查 | P1 |
| 8 | 无输入校验 | 存在 SQL 注入和 XSS 风险 | P1 |
| 9 | 无外部系统集成 (SCADA/MES) | 无法实现设备管理的完整业务闭环 | P1 |

### 8.3 中低风险问题 (建议逐步优化)

| # | 问题 | 影响 | 修复优先级 |
|---|------|------|-----------|
| 10 | 缺少 MaintenancePlan、AuditLog、Role 路由 | 部分模型无法通过 API 操作 | P2 |
| 11 | 业务关键字段缺少唯一约束 | 可能产生重复数据 | P2 |
| 12 | CORS 允许所有来源 | 生产环境存在 CSRF 风险 | P2 |
| 13 | 无速率限制 | 可能被暴力破解或 DDoS 攻击 | P2 |
| 14 | 无 Helmet 安全头 | 缺少基础安全保护 | P2 |
| 15 | 缺少 npm scripts (test, dev, lint) | 开发效率低 | P3 |

---

## 九、测试结论

### 通过项

1. package.json 依赖完整，可正常安装和运行
2. 数据库连接配置正确，SQLite 可正常同步
3. 所有 11 个模型定义完整，关联关系正确
4. 种子数据脚本可正常执行，初始化数据完整
5. 7 个路由模块均已正确注册到 Express
6. 全局错误处理中间件工作正常
7. JWT 认证中间件逻辑正确 (虽未启用)
8. render.yaml 部署配置基本正确

### 失败项

1. **安全认证完全缺失** - 所有 API 开放访问
2. **JWT 密钥硬编码** - 严重安全隐患
3. **无测试覆盖** - 零自动化测试
4. **依赖存在高危漏洞** - sqlite3/tar 等 5 个 high 级别漏洞
5. **无环境变量配置** - 所有配置硬编码
6. **无外部系统集成** - 缺少 SCADA/MES 对接能力
7. **缺少核心 API** - 无登录/认证接口
8. **无请求日志/监控** - 不可观测
9. **无输入校验** - 安全风险

### 总体评估

**当前状态**: 后端服务基础框架已搭建完成，数据库模型和 API 路由结构清晰，种子数据完整。但存在严重的安全和可维护性问题，**不建议直接部署到生产环境**。

**建议修复顺序**:
1. 立即修复安全认证问题 (P0)
2. 添加环境变量配置和密钥管理 (P0)
3. 升级 sqlite3 消除安全漏洞 (P0)
4. 编写核心模块的单元测试 (P0)
5. 添加请求日志、输入校验、速率限制等基础安全能力 (P1)
6. 补充缺失的 API 模块和外部系统集成 (P1-P2)
