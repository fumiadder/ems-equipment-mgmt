# 制造业设备管理系统 — 设计规格文档

## 设计目标

本系统旨在为大型制造业工厂/集团提供一套高可用、高性能、可扩展的设备全生命周期管理平台。设计核心目标包括：

1. **高可用性**：系统核心服务可用性 ≥ 99.9%，支持故障自动转移
2. **高性能**：2000+ 台设备管理，IoT 数据点 ≥ 1000 并发，检索响应 ≤ 2 秒
3. **可扩展性**：模块化架构，支持新协议、新设备类型、新分析模型的灵活扩展
4. **安全性**：数据权限隔离、操作审计、传输加密、私有化部署
5. **易用性**：响应式 Web 设计、移动端 PWA、大屏适配

## 模块划分

### 系统架构总览

```
┌─────────────────────────────────────────────────────────┐
│                      前端层 (React)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ 管理后台  │ │ 移动端PWA │ │ 大屏看板  │ │ 报表中心  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
├─────────────────────────────────────────────────────────┤
│                    API 网关层 (Nginx)                     │
│         负载均衡 · SSL 终止 · 限流 · 鉴权                 │
├─────────────────────────────────────────────────────────┤
│                  后端服务层 (Node.js)                      │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐│
│  │设备服务│ │工单服务│ │备件服务│ │巡检服务│ │报表服务││
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘│
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐            │
│  │IoT采集 │ │AI推理  │ │权限服务│ │通知服务│            │
│  └────────┘ └────────┘ └────────┘ └────────┘            │
├─────────────────────────────────────────────────────────┤
│                      数据层                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │PostgreSQL│ │TDengine  │ │  Redis   │ │  MinIO   │   │
│  │业务数据  │ │时序数据  │ │缓存/会话 │ │文件存储  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
├─────────────────────────────────────────────────────────┤
│                  IoT 数据采集层                            │
│  ┌────────┐ ┌──────────┐ ┌──────────┐                  │
│  │Modbus  │ │ OPC-UA   │ │  MQTT    │                  │
│  │适配器  │ │ 适配器    │ │ 适配器   │                  │
│  └────────┘ └──────────┘ └──────────┘                  │
└─────────────────────────────────────────────────────────┘
```

### 模块详细设计

#### M-01 设备服务（Equipment Service）

- **职责**：设备台账 CRUD、设备生命周期管理、设备分类与组织管理
- **技术**：Express.js + Sequelize ORM + PostgreSQL
- **API**：RESTful，`/api/v1/equipments/*`
- **关键接口**：
  - `GET /equipments` — 多条件分页检索
  - `POST /equipments` — 创建设备
  - `PUT /equipments/:id/status` — 设备状态变更（触发状态机校验）
  - `GET /equipments/:id/lifecycle` — 查询生命周期记录
  - `POST /equipments/import` — 批量导入
  - `GET /equipments/:id/qrcode` — 生成设备二维码

#### M-02 工单服务（Work Order Service）

- **职责**：故障工单全流程管理、自动派单、超时升级
- **技术**：Express.js + Sequelize ORM + PostgreSQL + Bull Queue
- **API**：RESTful，`/api/v1/work-orders/*`
- **关键逻辑**：
  - 派单引擎：设备类型→维修技能匹配矩阵
  - 升级引擎：定时任务扫描超时工单，自动升级
  - MTTR 计算：工单关闭时自动计算

#### M-03 备件服务（Spare Parts Service）

- **职责**：备件台账、出入库管理、库存预警
- **技术**：Express.js + Sequelize ORM + PostgreSQL
- **API**：RESTful，`/api/v1/spare-parts/*`
- **关键逻辑**：
  - 出库时自动扣减库存
  - 库存低于安全阈值时触发通知服务

#### M-04 巡检服务（Inspection Service）

- **职责**：巡检计划管理、巡检任务执行、异常上报
- **技术**：Express.js + Sequelize ORM + PostgreSQL
- **API**：RESTful，`/api/v1/inspections/*`
- **移动端支持**：PWA，支持离线巡检（IndexedDB 本地缓存）

#### M-05 IoT 数据采集服务（IoT Data Collection Service）

- **职责**：协议适配、数据采集、数据清洗、时序存储
- **技术**：Node.js + MQTT.js + modbus-serial + node-opcua + TDengine Node.js Client
- **架构**：
  - 协议适配器层：Modbus/OPC-UA/MQTT 各自独立适配器
  - 数据处理管道：原始数据→清洗→转换→存储
  - 支持热插拔协议适配器

#### M-06 AI 推理服务（AI Inference Service）

- **职责**：故障预测、异常检测、维护建议
- **技术**：Python FastAPI + scikit-learn + PyTorch
- **部署**：独立进程，通过 REST API 与主系统交互
- **模型管理**：支持模型版本切换和 A/B 测试

#### M-07 权限服务（Auth Service）

- **职责**：用户认证、角色权限、数据权限、审计日志
- **技术**：Express.js + JWT + Sequelize ORM
- **RBAC 模型**：用户→角色→权限（功能权限+数据权限）
- **数据权限**：基于组织树的行级数据隔离

#### M-08 报表服务（Report Service）

- **职责**：报表生成、PDF/Excel 导出、定时推送
- **技术**：Express.js + Puppeteer（PDF）+ ExcelJS（Excel）
- **支持自定义报表模板**

#### M-09 通知服务（Notification Service）

- **职责**：站内消息、邮件、短信、WebSocket 推送
- **技术**：Node.js + Socket.IO + Nodemailer
- **触发源**：工单派单/升级、库存预警、巡检异常、设备告警

### 数据库设计

#### PostgreSQL 核心表

- `equipments` — 设备台账主表
- `equipment_lifecycle_events` — 设备生命周期事件
- `work_orders` — 故障工单
- `work_order_logs` — 工单操作日志
- `maintenance_plans` — 维护计划
- `maintenance_tasks` — 维护任务
- `spare_parts` — 备件台账
- `spare_part_transactions` — 备件出入库记录
- `inspection_plans` — 巡检计划
- `inspection_tasks` — 巡检任务
- `inspection_records` — 巡检记录
- `users` — 用户表
- `roles` — 角色表
- `permissions` — 权限表
- `audit_logs` — 审计日志
- `organizations` — 组织架构（工厂/车间/产线）

#### TDengine 时序表

- `device_telemetry` — 设备遥测数据（设备ID、时间戳、指标名、值）

### 技术选型

| 层级 | 技术选型 | 理由 |
|------|----------|------|
| 前端框架 | React 18 + TypeScript | 生态成熟、组件丰富、TypeScript 类型安全 |
| UI 组件库 | Ant Design 5 | 企业级组件丰富、表格/表单能力强 |
| 图表库 | ECharts + AntV | 大屏可视化能力强 |
| 状态管理 | Zustand | 轻量、简洁 |
| 后端框架 | Node.js + Express.js | 用户指定、IoT 生态好 |
| ORM | Sequelize | PostgreSQL 支持成熟 |
| 关系数据库 | PostgreSQL 16 | 开源、高性能、JSON 支持 |
| 时序数据库 | TDengine | 国产、高性能时序写入、降采样 |
| 缓存 | Redis 7 | 会话缓存、排行榜、消息队列 |
| 文件存储 | MinIO | 自托管对象存储、S3 兼容 |
| 消息队列 | Bull (Redis-based) | 工单派单、通知推送 |
| 实时推送 | Socket.IO | 大屏数据推送、工单状态变更通知 |
| AI 框架 | Python + FastAPI + scikit-learn | AI 推理服务独立部署 |
| 容器化 | Docker + Docker Compose | 开发和私有化部署 |

## 失败处理策略

### 服务降级

- IoT 数据采集服务不可用时，系统自动切换到手动数据录入模式，前端显示"数据采集服务离线"提示
- AI 推理服务不可用时，系统隐藏 AI 相关功能入口，不影响核心管理功能
- 大屏 WebSocket 断连时，自动降级为 HTTP 轮询（30 秒间隔），并提示用户

### 数据一致性

- 工单状态变更采用数据库事务保证一致性
- IoT 数据采集采用"至少一次"语义，下游去重
- 备件出库采用乐观锁防止超卖

### 错误恢复

- 所有 API 返回标准错误格式：`{ code, message, details }`
- 前端全局错误拦截，展示友好错误提示
- 关键操作支持重试机制（如 IoT 数据采集重连）

### 数据备份

- PostgreSQL 每日全量备份 + WAL 归档（增量）
- TDengine 按数据保留策略自动降采样和清理
- MinIO 文件存储支持跨区域复制（可选云端备份）

## 质量控制

### 代码质量

- ESLint + Prettier 统一代码风格
- TypeScript 严格模式，禁止 any
- 单元测试覆盖率 ≥ 60%（核心模块 ≥ 80%）
- 集成测试覆盖关键业务流程

### 性能测试

- 设备台账检索：10000 条数据多条件查询 ≤ 2 秒
- IoT 数据采集：1000 并发数据点，端到端延迟 ≤ 5 秒
- 大屏数据推送：刷新频率 ≤ 10 秒
- API 响应时间 P99 ≤ 500ms

### 安全措施

- JWT Token 认证，Token 有效期 2 小时，支持刷新
- RBAC 权限控制，数据权限行级隔离
- API 限流（基于 IP + 用户 ID）
- SQL 注入防护（ORM 参数化查询）
- XSS 防护（React 默认转义 + CSP 头）
- 审计日志记录所有敏感操作
- 传输加密（HTTPS）
- 密码 bcrypt 加密存储

### 监控与告警

- 应用性能监控（APM）：请求链路追踪、慢查询告警
- 系统监控：CPU、内存、磁盘、网络
- 业务告警：工单超时、库存预警、设备异常
- 日志聚合：ELK（Elasticsearch + Logstash + Kibana）
