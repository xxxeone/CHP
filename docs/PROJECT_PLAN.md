# CHP Auto Service — 客户忠诚度App 项目开发计划
# CHP Auto Service — Loyalty App Project Development Plan

**项目版本 / Version:** v1.0
**编制日期 / Date:** 2026-03-20
**项目周期 / Duration:** 14 周 / 14 Weeks
**目标上线 / Target Launch:** 2026-07-01
**项目负责人 / Project Lead:** TBD

---

## 目录 Table of Contents

1. [项目概述 Project Overview](#1-项目概述)
2. [14周时间线 Timeline](#2-14周开发时间线)
3. [里程碑 Milestones](#3-关键里程碑)
4. [团队分工 Team Structure](#4-团队分工)
5. [预算 Budget](#5-项目预算)
6. [风险管理 Risk Management](#6-风险管理)
7. [部署策略 Deployment Strategy](#7-部署策略)

---

## 1. 项目概述

### 背景 Background
CHP Auto Service 拥有18年专业汽车维修经验，目前客户留存率偏低，缺乏数字化会员体系。本项目旨在通过移动端忠诚度App提升客户粘性、复购率和品牌认知。

### 核心目标 Objectives
| 目标 | KPI指标 | 目标值 |
|------|---------|--------|
| 客户留存 | 月活用户留存率 | ≥ 65% |
| 预约数字化 | 线上预约占比 | ≥ 50% |
| 积分参与度 | 注册用户积分使用率 | ≥ 40% |
| App评分 | App Store / Google Play | ≥ 4.5★ |
| 营业增长 | 会员客户年消费增长 | +25% |

### 技术栈 Tech Stack
```
Frontend:  React Native (Expo) + Redux Toolkit
Backend:   Node.js + Express + PostgreSQL
云服务:     AWS (EC2 / RDS / S3 / CloudFront)
推送通知:   Firebase Cloud Messaging
短信:       Twilio
CI/CD:      GitHub Actions
监控:       Sentry + CloudWatch
```

---

## 2. 14周开发时间线

```
Week  1  2  3  4  5  6  7  8  9  10 11 12 13 14
      ├──┤  ├──┤  ├──┤  ├──┤  ├──┤  ├──┤  ├──┤
Phase │ Phase 1 │ Phase 2 │ Phase 3 │Phase4 │P5│
      │Foundation│Core Dev │Advanced │ QA   │Go│
```

### Phase 1 — 基础建设 Foundation (Week 1–2)

#### Week 1：项目启动 Project Kickoff
| 任务 | 负责人 | 工时 | 产出 |
|------|--------|------|------|
| 项目启动会议 | PM | 4h | 会议纪要、章程签署 |
| 开发环境搭建 | DevOps | 16h | CI/CD流水线、Git仓库 |
| AWS基础架构配置 | DevOps | 20h | VPC、EC2、RDS、S3 |
| 数据库Schema最终确认 | Backend Lead | 8h | 已审核Schema文档 |
| UI/UX设计规范输出 | Designer | 24h | Design System、组件库 |
| API契约文档 | Backend Lead | 8h | OpenAPI 3.0规范 |

**里程碑 M0:** ✅ 开发环境就绪，团队对齐

#### Week 2：数据库与基础API
| 任务 | 负责人 | 工时 | 产出 |
|------|--------|------|------|
| 数据库迁移脚本 | Backend | 12h | 已验证的migration文件 |
| 种子数据 (服务分类/等级) | Backend | 8h | seed.sql |
| 认证模块 (JWT + OTP) | Backend | 24h | /auth 端点完整 |
| 短信集成 (Twilio) | Backend | 8h | OTP发送/验证 |
| App骨架搭建 | Frontend | 16h | 导航结构、Redux store |
| 登录/注册界面 | Frontend | 16h | 已连接真实API |

**里程碑 M1:** ✅ 用户可注册登录，基础通信正常

---

### Phase 2 — 核心功能 Core Features (Week 3–6)

#### Week 3：车辆管理 + 用户中心
| 任务 | 负责人 | 工时 | 产出 |
|------|--------|------|------|
| 车辆CRUD API | Backend | 20h | /vehicles 所有端点 |
| 车辆管理界面 | Frontend | 28h | 列表+详情+添加 |
| 用户个人资料 | Frontend | 16h | 编辑+头像上传 |
| S3头像存储 | Backend | 8h | 图片上传/压缩 |
| 仪表盘数据API | Backend | 12h | /users/me/dashboard |
| 首页界面 | Frontend | 20h | HomeScreen完整实现 |

**每日站会检查点:** 车辆页面原型演示

#### Week 4：预约系统 Part 1
| 任务 | 负责人 | 工时 | 产出 |
|------|--------|------|------|
| 预约CRUD API | Backend | 20h | /appointments 端点 |
| 可用时间段逻辑 | Backend | 12h | 时间冲突检测 |
| 4步预约流程界面 | Frontend | 32h | BookAppointmentScreen |
| 预约列表界面 | Frontend | 16h | 状态筛选、分页 |
| 24h取消政策逻辑 | Backend | 6h | 业务规则验证 |

#### Week 5：预约系统 Part 2 + 通知
| 任务 | 负责人 | 工时 | 产出 |
|------|--------|------|------|
| Firebase推送集成 | Backend | 16h | 推送通知发送 |
| 预约确认通知 | Backend | 8h | 邮件+推送双通道 |
| 通知中心界面 | Frontend | 20h | 列表+已读/未读 |
| 通知偏好设置 | Frontend | 12h | 细粒度开关 |
| 定时提醒 (Cron) | Backend | 12h | 预约前24h提醒 |
| Admin预约管理 | Backend | 16h | 确认/完成端点 |

#### Week 6：积分系统 Part 1
| 任务 | 负责人 | 工时 | 产出 |
|------|--------|------|------|
| PointsEngine核心 | Backend | 24h | 积分计算引擎 |
| 积分历史API | Backend | 12h | /points/history |
| 每日签到逻辑 | Backend | 8h | 连续签到奖励 |
| 积分摘要界面 | Frontend | 20h | PointsScreen |
| 等级进度展示 | Frontend | 16h | 动态进度条 |
| 积分历史界面 | Frontend | 16h | 分类筛选 |

**里程碑 M2:** ✅ 核心功能可演示，内部UAT开始

---

### Phase 3 — 进阶功能 Advanced Features (Week 7–10)

#### Week 7：积分系统 Part 2 + 促销
| 任务 | 负责人 | 工时 | 产出 |
|------|--------|------|------|
| 积分兑换奖励 | Backend | 16h | 优惠券生成逻辑 |
| 奖励中心界面 | Frontend | 24h | RewardsScreen |
| 促销模块API | Backend | 20h | /promotions 端点 |
| 促销活动界面 | Frontend | 20h | PromotionsScreen |
| 优惠码验证 | Backend | 8h | 使用次数/有效期 |
| 生日自动奖励 | Backend | 8h | Cron任务 |

#### Week 8：维修记录 + 评价系统
| 任务 | 负责人 | 工时 | 产出 |
|------|--------|------|------|
| 维修记录API | Backend | 20h | /services/records |
| 维修后自动积分 | Backend | 12h | 与PointsEngine集成 |
| 维修历史界面 | Frontend | 24h | ServiceHistoryScreen |
| 维修记录详情 | Frontend | 16h | 费用明细+评价入口 |
| 评价提交界面 | Frontend | 20h | 5星评分+文字 |
| 评价积分奖励 | Backend | 8h | +50分 |

#### Week 9：管理后台 Admin Panel
| 任务 | 负责人 | 工时 | 产出 |
|------|--------|------|------|
| 后台仪表盘API | Backend | 16h | 统计数据汇总 |
| 今日预约管理 | Backend | 12h | 日历视图数据 |
| 用户搜索/管理 | Backend | 16h | 等级筛选、状态管理 |
| 积分手动调整 | Backend | 8h | 管理员操作日志 |
| 营收报告API | Backend | 16h | 按日/周/月分组 |
| 促销创建/管理 | Backend | 12h | 完整CRUD |

#### Week 10：性能优化 + 数据统计
| 任务 | 负责人 | 工时 | 产出 |
|------|--------|------|------|
| API响应缓存 (Redis) | Backend | 16h | 热点数据缓存 |
| 数据库索引优化 | Backend | 8h | 慢查询分析报告 |
| 消费统计界面 | Frontend | 20h | 图表展示(年/月) |
| App性能优化 | Frontend | 16h | 懒加载、图片压缩 |
| 离线模式支持 | Frontend | 12h | 基础数据本地缓存 |
| 积分过期提醒 | Backend | 8h | 30天预警通知 |

**里程碑 M3:** ✅ 功能完整，Beta版本发布给测试用户

---

### Phase 4 — 质量保障 QA & Testing (Week 11–13)

#### Week 11：单元测试 + 集成测试
| 任务 | 负责人 | 目标覆盖率 |
|------|--------|-----------|
| API单元测试 (Jest) | Backend | ≥ 80% |
| 积分引擎测试 | Backend | 100% |
| 认证流程测试 | Backend | 100% |
| 前端组件测试 | Frontend | ≥ 70% |
| API集成测试 | QA | 所有端点 |
| 数据库事务测试 | Backend | 边界案例 |

#### Week 12：用户验收测试 UAT
| 测试场景 | 测试人员 | 标准 |
|----------|---------|------|
| 完整注册→预约→积分流程 | 10位真实客户 | 无阻断性问题 |
| 多语言切换 (中/英) | 各5位 | 翻译准确 |
| 推送通知接收 | iOS + Android各5台 | 到达率≥95% |
| 弱网络环境测试 | QA | 3G网络可用 |
| 不同设备兼容性 | QA | iOS 14+, Android 9+ |
| 积分计算准确性 | PM + 业务 | 零误差 |

**UAT问题修复窗口:** Week 12 后3天

#### Week 13：上线准备 Launch Prep
| 任务 | 负责人 | 状态 |
|------|--------|------|
| App Store提交 (iOS) | Frontend Lead | 审核周期7-14天 |
| Google Play提交 | Frontend Lead | 审核周期1-3天 |
| 生产环境最终配置 | DevOps | SSL、域名、CDN |
| 数据库备份策略验证 | DevOps | 每日备份测试恢复 |
| 监控告警配置 | DevOps | Sentry + CloudWatch |
| 用户操作手册 | PM | 中英双语 |
| 员工培训 | PM | 2小时培训课 |
| 压力测试 | DevOps | 模拟500并发用户 |

**里程碑 M4:** ✅ 通过所有测试，应用商店审核通过

---

### Phase 5 — 上线与稳定 Launch & Stabilize (Week 14)

#### Week 14：软启动 Soft Launch
| 阶段 | 时间 | 用户范围 | 监控重点 |
|------|------|---------|---------|
| Day 1-2: 内部发布 | 周一至周二 | 员工 + VIP客户20人 | 错误率、API延迟 |
| Day 3-4: 灰度10% | 周三至周四 | 随机10%客户 | 崩溃率、注册转化 |
| Day 5: 全量发布 | 周五 | 全部客户 | 服务器负载、积分准确性 |
| Day 6-7: 监控 | 周末 | — | On-call值班，快速响应 |

**里程碑 M5:** 🚀 **正式上线 Production Launch**

---

## 3. 关键里程碑

```
M0 ──── M1 ──────────── M2 ──────────── M3 ──── M4 ── M5🚀
W1      W2              W6              W10     W13   W14

M0: 环境就绪       2026-03-27
M1: 认证系统完成   2026-04-03
M2: 核心功能演示   2026-05-01
M3: Beta发布       2026-05-29
M4: 商店审核通过   2026-06-26
M5: 正式上线       2026-07-01
```

### 里程碑验收标准

| 里程碑 | 必须满足的条件 | 验收人 |
|--------|--------------|--------|
| M0 | CI/CD通过，数据库连接正常，所有账号配置完毕 | DevOps Lead |
| M1 | 注册→登录→OTP完整流程通过，JWT有效 | PM + Backend Lead |
| M2 | 车辆、预约、积分三大核心功能演示通过内审 | PM + 业务负责人 |
| M3 | Beta测试用户满意度≥80%，无P0/P1Bug | QA Lead + PM |
| M4 | App Store/Google Play审核通过，生产压测通过 | PM + DevOps |
| M5 | 24h无P0崩溃，推送到达率≥95%，积分计算准确 | 全团队 |

---

## 4. 团队分工

详见 → [TEAM_STRUCTURE.md](./TEAM_STRUCTURE.md)

---

## 5. 项目预算

详见 → [BUDGET.md](./BUDGET.md)

---

## 6. 风险管理

详见 → [RISK_REGISTER.md](./RISK_REGISTER.md)

---

## 7. 部署策略

详见 → [DEPLOYMENT_STRATEGY.md](./DEPLOYMENT_STRATEGY.md)

---

## 附录：沟通机制

| 会议 | 频率 | 时长 | 参与人 | 目的 |
|------|------|------|--------|------|
| 每日站会 | 每天09:00 | 15分钟 | 全团队 | 同步进度、阻碍识别 |
| Sprint Review | 每2周 | 1小时 | 全团队+业务 | 演示功能、收集反馈 |
| Sprint Planning | 每2周 | 2小时 | 全团队 | 规划下一Sprint任务 |
| 风险评审 | 每周五 | 30分钟 | PM + Leads | 更新风险状态 |
| 业务同步 | 每2周 | 1小时 | PM + 业主 | 业务决策、变更确认 |
| 技术评审 | 按需 | 1小时 | 技术Lead | 架构决策、代码质量 |

## 附录：Bug优先级定义

| 优先级 | 定义 | 响应时间 | 修复时间 |
|--------|------|---------|---------|
| P0 — 阻断 | 系统不可用、数据丢失、安全漏洞 | 15分钟 | 4小时 |
| P1 — 严重 | 核心功能无法使用 | 1小时 | 24小时 |
| P2 — 一般 | 功能异常但有替代方案 | 4小时 | 3天 |
| P3 — 优化 | 体验问题、小错误 | 24小时 | 下一Sprint |
