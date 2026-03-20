# CHP Loyalty App — 团队结构与分工
# Team Structure & Responsibility Matrix

---

## 团队组织架构

```
                    ┌─────────────────────┐
                    │   业主 / Business    │
                    │  Owner (CHP老板)     │
                    └──────────┬──────────┘
                               │ 决策层
                    ┌──────────▼──────────┐
                    │   项目经理 / PM      │
                    │   Project Manager   │
                    └──┬──────┬──────┬───┘
                       │      │      │
           ┌───────────▼┐  ┌──▼────┐ ┌▼──────────┐
           │ 技术负责人  │  │设计师 │ │ QA工程师  │
           │ Tech Lead  │  │Designer│ │QA Engineer│
           └───┬─────┬──┘  └───────┘ └───────────┘
               │     │
    ┌──────────▼┐  ┌──▼─────────┐
    │后端工程师  │  │前端工程师   │
    │Backend    │  │Frontend    │
    │Engineers  │  │Engineers   │
    │(×2)       │  │(×2)        │
    └──────────┘  └────────────┘
                       +
                  ┌────▼────────┐
                  │ DevOps工程师 │
                  │ DevOps Eng  │
                  └─────────────┘
```

**团队规模:** 9人（含PM）
**工作模式:** 敏捷Scrum，2周Sprint

---

## 角色详细说明

### 1. 项目经理 Project Manager (PM)
**人数:** 1人 | **时间投入:** 全职100%

**职责 Responsibilities:**
- 整体项目计划制定与跟踪
- Sprint计划、Review、Retrospective主持
- 与业主日常沟通，管理期望
- 风险识别与应对协调
- 预算监控与变更管理
- 团队障碍清除
- 上线协调与客户沟通

**交付物 Deliverables:**
- 每周项目状态报告
- Sprint燃尽图
- 风险日志
- 变更请求记录

**技能要求:**
- PMP或同等项目管理经验
- 敏捷/Scrum认证 (CSM优先)
- 具备技术背景，能与开发团队有效沟通
- 中英双语沟通

---

### 2. 技术负责人 Tech Lead
**人数:** 1人 | **时间投入:** 全职100% (编码60% + 架构/Review40%)

**职责:**
- 系统架构设计与决策
- 技术方案评审与把关
- 代码Review（所有PR必须经过Tech Lead）
- 技术债管理
- 跨端技术协调（前端/后端/DevOps）
- 安全审查
- 与PM同步技术风险

**技术要求:**
- Node.js + React Native 5年+ 经验
- 系统设计 + 数据库优化经验
- AWS架构经验
- 熟悉CI/CD最佳实践

---

### 3. 后端工程师 Backend Engineers
**人数:** 2人 | **时间投入:** 全职100%

**工程师A — API & 业务逻辑**
- 认证系统（JWT、OTP、refresh token）
- 用户、车辆、预约模块API
- 积分引擎（PointsEngine）
- 促销系统
- 单元测试

**工程师B — 数据 & 集成**
- 数据库设计与迁移
- 通知服务（Firebase、Twilio集成）
- 定时任务（Cron scheduler）
- 管理后台API
- 报告与统计API
- 第三方集成（支付预留接口）

**共同职责:**
- API文档维护（Swagger/OpenAPI）
- 数据库性能优化
- 代码审查互审
- 测试覆盖率维护（≥80%）

**技术要求:**
- Node.js/Express 3年+ 经验
- PostgreSQL 熟练
- REST API设计经验
- 了解Redis缓存

---

### 4. 前端工程师 Frontend Engineers
**人数:** 2人 | **时间投入:** 全职100%

**工程师A — 核心功能界面**
- 认证流程（登录/注册/OTP）
- 首页仪表盘
- 车辆管理界面
- 预约流程（4步）
- Redux状态管理架构

**工程师B — 会员&用户界面**
- 积分中心（积分/兑换/历史）
- 通知中心
- 个人中心
- 维修记录界面
- 促销活动界面

**共同职责:**
- Design System实现
- 双语（中/英）本地化
- iOS & Android兼容测试
- Expo构建配置（EAS Build）
- App Store/Google Play提交

**技术要求:**
- React Native 2年+ 经验
- Expo生态熟悉
- Redux Toolkit经验
- 具备iOS/Android发布经验

---

### 5. UI/UX 设计师 Designer
**人数:** 1人 | **时间投入:** 全职（Phase 1-2）→ 50%（Phase 3+）

**Phase 1-2 全职工作:**
- Design System建立（颜色、字体、间距、组件）
- 所有界面高保真原型（Figma）
- 用户流程图
- 图标设计

**Phase 3+ 兼职工作:**
- 开发阶段UI问题修复
- UAT视觉验收
- App Store截图/宣传图设计
- 迭代优化设计

**交付物:**
- Figma设计稿（含Handoff标注）
- 组件库文档
- 用户流程图
- App Store图形资产

**技能要求:**
- Figma专业用户
- 移动端UX设计经验
- 中英双语设计能力
- 了解React Native组件特性

---

### 6. QA工程师 QA Engineer
**人数:** 1人 | **时间投入:** Phase 1-2: 20% → Phase 3-5: 100%

**职责:**
- 测试计划与用例编写
- API接口测试（Postman）
- 功能回归测试
- 用户验收测试（UAT）组织
- 兼容性测试（设备矩阵）
- 性能测试（JMeter）
- Bug记录与跟踪

**Phase 1-2 兼职工作:**
- 测试用例准备
- 测试环境配置
- API测试集编写

**Phase 3+ 全职工作:**
- 每日回归测试
- 新功能测试
- UAT主持

**技能要求:**
- 移动App测试经验
- Postman API测试
- 了解自动化测试（Detox/Jest）

---

### 7. DevOps工程师 DevOps Engineer
**人数:** 1人 | **时间投入:** Phase 1: 100% → Phase 2-4: 50% → Phase 5: 100%

**职责:**
- AWS基础架构搭建与维护
- CI/CD流水线（GitHub Actions）
- Docker容器化
- 环境管理（Dev/Staging/Prod）
- 监控与告警（CloudWatch/Sentry）
- 数据库备份策略
- SSL证书与域名管理
- 上线部署执行
- On-call支持（上线后2周）

**技能要求:**
- AWS认证优先（Solutions Architect）
- Docker/Kubernetes经验
- GitHub Actions CI/CD
- 数据库运维经验

---

## RACI 责任矩阵

> R = Responsible（执行）| A = Accountable（负责）| C = Consulted（咨询）| I = Informed（知情）

| 任务 / 交付物 | PM | Tech Lead | Backend A | Backend B | Frontend A | Frontend B | Designer | QA | DevOps |
|-------------|----|-----------|-----------|-----------|-----------|-----------|---------|----|--------|
| **架构设计** | A | R | C | C | C | C | I | I | C |
| **数据库设计** | I | A/C | R | R | I | I | I | I | C |
| **API开发** | I | A | R | R | I | I | I | C | I |
| **前端开发** | I | A | I | I | R | R | C | C | I |
| **UI/UX设计** | C | C | I | I | C | C | R | C | I |
| **测试用例** | C | C | C | C | C | C | I | R | I |
| **CI/CD配置** | I | C | I | I | I | I | I | I | R/A |
| **AWS基础架构** | I | C | I | I | I | I | I | I | R/A |
| **项目计划** | R/A | C | I | I | I | I | I | I | I |
| **Sprint计划** | R/A | R | R | R | R | R | R | R | R |
| **代码Review** | I | R/A | R | R | R | R | I | I | I |
| **UAT** | A | C | C | C | C | C | C | R | C |
| **App Store提交** | A | C | I | I | R | R | R | C | I |
| **生产部署** | A | C | I | I | I | I | I | I | R |
| **上线后监控** | A | C | C | C | I | I | I | I | R |

---

## 工作协议 Working Agreements

### 代码规范
- 所有PR需至少1名Engineer + Tech Lead审核
- 主分支保护，禁止直接推送
- Commit信息遵循 Conventional Commits 规范
- 测试覆盖率低于标准不允许合并

### Sprint规则
- Sprint时长: 2周
- Story Point估算: 斐波那契数列 (1,2,3,5,8,13)
- 单个Story ≤8点，超过需拆分
- Bug修复优先于新功能

### 沟通工具
| 用途 | 工具 |
|------|------|
| 日常沟通 | Slack / WeChat Work |
| 视频会议 | Zoom / Google Meet |
| 项目管理 | Jira / Linear |
| 设计协作 | Figma |
| 代码仓库 | GitHub |
| 文档 | Notion / Confluence |
| Bug跟踪 | Sentry |

### 工作时间
- 核心协作时间: 09:00–17:00 (AEST)
- 每日站会: 09:00–09:15
- On-call轮值（上线后）: 按周轮换

---

## 外部合作方

| 合作方 | 服务 | 联系层级 |
|--------|------|---------|
| AWS | 云基础设施 | DevOps |
| Twilio | SMS短信服务 | Backend B |
| Firebase/Google | 推送通知 | Backend B |
| Apple/Google | App Store审核 | PM + Frontend |
| Figma | 设计工具 | Designer |
