# CHP Loyalty App — 部署与DevOps策略
# Deployment & DevOps Strategy

**版本:** v1.0 | **更新日期:** 2026-03-20

---

## 1. 环境架构 Environment Architecture

```
┌─────────────────────────────────────────────────────┐
│                   GitHub Repository                  │
│   branch: main → Prod | staging → Staging | dev → Dev│
└──────────────────────┬──────────────────────────────┘
                       │ GitHub Actions CI/CD
         ┌─────────────┼──────────────┐
         ▼             ▼              ▼
   ┌──────────┐  ┌──────────┐  ┌──────────┐
   │   DEV    │  │ STAGING  │  │   PROD   │
   │环境 (开发)│  │(预生产)  │  │(生产)    │
   │          │  │          │  │          │
   │EC2 t3.sm │  │EC2 t3.md │  │EC2 t3.md │
   │RDS t3.sm │  │RDS t3.md │  │RDS t3.md │
   │          │  │          │  │Multi-AZ  │
   │本地测试   │  │UAT使用   │  │真实用户  │
   └──────────┘  └──────────┘  └──────────┘
```

### 环境对比

| 属性 | DEV | STAGING | PRODUCTION |
|------|-----|---------|------------|
| 目的 | 日常开发测试 | UAT/预发布验证 | 真实用户 |
| 数据 | 模拟数据 | 匿名化真实数据 | 真实数据 |
| 自动部署 | 推送dev分支即部署 | PR合并staging触发 | 手动审批 |
| 监控级别 | 基础 | 完整 | 完整+告警 |
| 可用性目标 | 80% | 95% | 99.5% |
| 数据库备份 | 不备份 | 每日 | 每日+事务日志 |

---

## 2. AWS架构设计 AWS Architecture

```
                    ┌───────────────────────────────┐
                    │           Route 53             │
                    │    api.chpauto.com.au          │
                    └───────────────┬───────────────┘
                                    │ HTTPS
                    ┌───────────────▼───────────────┐
                    │    Application Load Balancer   │
                    │    (SSL Termination)           │
                    └──────┬────────────────┬───────┘
                           │                │
              ┌────────────▼──┐         ┌───▼───────────┐
              │  EC2 App #1   │         │  EC2 App #2   │
              │ (t3.medium)   │         │ (t3.medium)   │
              │ Node.js API   │         │ Node.js API   │
              │ AZ: ap-se-2a  │         │ AZ: ap-se-2b  │
              └────────┬──────┘         └──────┬────────┘
                       │                        │
              ┌────────▼────────────────────────▼────────┐
              │            ElastiCache Redis              │
              │         (API缓存, Session存储)            │
              └────────────────────┬──────────────────────┘
                                   │
              ┌────────────────────▼──────────────────────┐
              │         RDS PostgreSQL (Multi-AZ)          │
              │  Primary: ap-se-2a | Standby: ap-se-2b    │
              │  自动故障转移 <60s                          │
              └───────────────────────────────────────────┘

              ┌─────────────────────────────────────────────┐
              │                   S3 + CloudFront           │
              │      用户头像 + App静态资源 + 备份文件       │
              └─────────────────────────────────────────────┘
```

### 安全架构

```
Internet → ALB (Port 443 HTTPS only)
         → EC2 (Private Subnet, Port 3000)
         → RDS (Private Subnet, Port 5432, only from EC2 SG)
         → Redis (Private Subnet, Port 6379, only from EC2 SG)

Security Groups:
  alb-sg:     inbound 443 from 0.0.0.0/0
  app-sg:     inbound 3000 from alb-sg only
  rds-sg:     inbound 5432 from app-sg only
  redis-sg:   inbound 6379 from app-sg only
```

---

## 3. CI/CD 流水线 Pipeline

```yaml
# 完整CI/CD流程
代码推送 → 触发GitHub Actions
         ↓
    [CI Pipeline]
    ├── 代码质量检查 (ESLint)       ~2分钟
    ├── 单元测试 (Jest)             ~5分钟
    ├── 集成测试                   ~10分钟
    ├── 安全扫描 (npm audit)        ~1分钟
    └── 构建Docker镜像             ~3分钟
         ↓ 全部通过
    [CD Pipeline - DEV]
    └── 自动部署到DEV环境          ~2分钟
         ↓ (仅staging分支)
    [CD Pipeline - STAGING]
    ├── 部署到STAGING             ~2分钟
    └── 冒烟测试                  ~5分钟
         ↓ (需人工审批)
    [CD Pipeline - PROD]
    ├── 审批通知 → Slack
    ├── PM/Tech Lead 确认          人工
    ├── Blue-Green切换部署        ~5分钟
    ├── 健康检查                  ~2分钟
    └── Sentry新版本标记          ~1分钟

总计CI时间: ~21分钟
总计CD时间: ~10分钟（不含审批）
```

### GitHub Actions 工作流配置

```yaml
# .github/workflows/deploy.yml 关键配置

stages:
  ci:
    runs-on: ubuntu-latest
    steps:
      - lint:    npm run lint
      - test:    npm test -- --coverage
      - audit:   npm audit --audit-level=high
      - build:   docker build -t chp-api .
      - push:    push to ECR

  deploy-staging:
    needs: ci
    if: branch == 'staging'
    environment: staging
    steps:
      - deploy to EC2 via SSH
      - run db migrations
      - smoke test

  deploy-prod:
    needs: ci
    if: branch == 'main'
    environment: production  # 需要审批
    steps:
      - blue-green deployment
      - health check
      - tag Sentry release
```

---

## 4. 蓝绿部署策略 Blue-Green Deployment

```
当前生产流量 → [Green EC2集群] (当前版本 v1.x)

部署新版本:
  1. 启动 [Blue EC2集群] (新版本 v1.y)  ← 不接收流量
  2. 执行数据库迁移 (向前兼容)
  3. Blue集群健康检查通过 ✓
  4. ALB流量切换: 10% → Blue (金丝雀测试)
     监控5分钟: 错误率 < 0.1%, P95延迟 < 500ms
  5. 确认正常 → ALB 100% → Blue
  6. Green集群保留30分钟备用
  7. 30分钟无问题 → 终止Green集群

回滚方案:
  ALB流量切回Green (< 30秒)
  原因记录 + 事后分析
```

---

## 5. 数据库部署策略

### 迁移原则
- 所有Schema变更通过迁移脚本（`database/migrations/`）
- 迁移必须向前兼容（新列加DEFAULT值，旧列延迟删除）
- 迁移在部署前独立执行，支持回滚
- 生产迁移必须在低流量时段（凌晨02:00 AEST）

### 迁移命名规范
```
migrations/
  V001__create_users_table.sql
  V002__create_vehicles_table.sql
  V003__add_push_token_to_users.sql
```

### 备份策略

| 备份类型 | 频率 | 保留时间 | 存储位置 |
|---------|------|---------|---------|
| 全量备份 | 每日 01:00 AEST | 30天 | S3 (另一AZ) |
| 事务日志 | 持续 | 7天 | RDS内置 |
| 快照 | 每次部署前 | 7天 | RDS快照 |
| 异地备份 | 每周日 | 90天 | S3 Cross-Region |

### 恢复演练
- 每月第一个周日执行RDS恢复演练
- 目标：恢复时间 < 30分钟
- 测试：恢复到Staging环境验证数据完整性

---

## 6. 监控与告警 Monitoring & Alerting

### 监控指标体系

```
应用层 (Sentry + CloudWatch)
  ├── 错误率 (Error Rate)
  │   ├── P0: > 1% → 立即告警 → PagerDuty
  │   └── P1: > 0.1% → Slack告警
  ├── API响应时间
  │   ├── P95 > 500ms → Slack告警
  │   └── P99 > 2000ms → 立即告警
  └── 崩溃率 (Crash Rate) → Sentry

基础设施层 (CloudWatch)
  ├── EC2 CPU > 70% → 触发Auto Scaling
  ├── EC2 内存 > 85% → Slack告警
  ├── RDS CPU > 80% → 立即告警
  ├── RDS 存储 < 20% → 立即告警
  └── ALB 5XX > 1% → 立即告警

业务层 (自定义指标)
  ├── 新用户注册数/小时
  ├── 预约创建成功率
  ├── 积分计算错误数 → 零容忍告警
  └── 推送通知到达率 < 90% → Slack告警
```

### 告警路由

| 严重级别 | 告警渠道 | 响应时间 | On-Call |
|---------|---------|---------|---------|
| P0 (生产宕机) | PagerDuty电话 + SMS | 15分钟内响应 | DevOps → Tech Lead |
| P1 (核心功能故障) | Slack #alerts + 短信 | 1小时内响应 | Tech Lead |
| P2 (性能降级) | Slack #alerts | 4小时内响应 | 值班工程师 |
| P3 (异常指标) | Slack #monitoring | 次日工作时间 | 无需On-call |

### Dashboard
- CloudWatch Dashboard: 基础设施实时状态
- Sentry: 错误追踪与性能监控
- 自定义业务Dashboard: 积分/预约/注册实时数据

---

## 7. App发布策略 Mobile App Release

### 版本命名
```
格式: v{Major}.{Minor}.{Patch}
v1.0.0 - 初始发布
v1.0.1 - Bug修复
v1.1.0 - 新增功能
v2.0.0 - 重大变更
```

### EAS Build 配置
```json
// eas.json
{
  "build": {
    "development": { "distribution": "internal" },
    "staging":     { "distribution": "internal", "channel": "staging" },
    "production":  { "distribution": "store",    "channel": "production" }
  }
}
```

### App Store发布流程
```
开发完成
  ↓ EAS Build (production)
  ↓ 内部TestFlight测试 (7天)
  ↓ 外部TestFlight UAT (7天)
  ↓ App Store Connect提交
  ↓ Apple审核 (预计7-14天)
  ↓ 分阶段发布:
     Day1: 1%用户
     Day3: 10%用户
     Day7: 100%用户
```

### OTA热更新策略
- 使用Expo Updates进行JS层更新（无需App Store审核）
- 适用场景：文案修改、逻辑Bug修复、小型UI调整
- Native层变更仍需通过App Store审核
- 更新发布前必须在Staging验证

---

## 8. 上线检查清单 Go-Live Checklist

### 技术检查 Technical

- [ ] 所有测试通过（单元/集成/UAT）
- [ ] 生产环境SSL证书有效（>90天）
- [ ] 数据库备份已验证可恢复
- [ ] 环境变量全部配置（对照.env.example）
- [ ] 密钥管理（AWS Secrets Manager）
- [ ] 日志聚合配置完毕
- [ ] 监控告警测试通过
- [ ] 压力测试通过（500并发）
- [ ] 数据库迁移在Staging验证通过
- [ ] App Store/Google Play审核通过
- [ ] Firebase项目切换到生产
- [ ] Twilio切换到正式号码
- [ ] Sentry配置生产项目

### 业务检查 Business

- [ ] 隐私政策页面已上线
- [ ] 用户服务条款已上线
- [ ] 员工培训完成
- [ ] 客户沟通材料就绪（店内海报/微信推文）
- [ ] 积分初始数据（会员等级/服务分类）已录入
- [ ] 管理员账号已创建并测试
- [ ] 客服流程已建立（处理积分问题/预约问题）
- [ ] 上线公告已准备

### 回滚预案 Rollback Plan

- [ ] 前版本Docker镜像可用
- [ ] 数据库回滚脚本已准备
- [ ] App Store灰度发布已配置（便于暂停）
- [ ] 紧急联系人列表已更新
- [ ] 回滚决策权已明确（谁有权触发回滚）

---

## 9. 上线后运维 Post-Launch Operations

### 上线后第1周（密集监控）
- 24/7 On-call覆盖（Tech Lead + DevOps轮值）
- 每日早晨系统健康报告
- 每日错误日志审查
- 积分日对账（每天17:00）
- 每日新增用户/预约数统计

### 上线后第1月
- 每周Sprint迭代（P2/P3 Bug修复）
- 每周业务数据报告给业主
- 用户反馈收集与分析
- App评分监控（目标≥4.5★）
- 性能持续优化

### 长期运维
- 每月安全更新（依赖包升级）
- 每季度安全审查
- 每年灾难恢复演练
- 数据库定期清理（过期积分归档）
- 功能迭代（每季度一个版本）

---

## 10. 灾难恢复计划 Disaster Recovery

| 场景 | RTO目标 | RPO目标 | 恢复步骤 |
|------|---------|---------|---------|
| EC2实例故障 | <5分钟 | 0 | ALB自动切换到另一实例 |
| RDS故障 | <60秒 | <1分钟 | Multi-AZ自动故障转移 |
| 整个AZ故障 | <30分钟 | <24小时 | 从S3备份恢复到另一AZ |
| 数据损坏 | <2小时 | <24小时 | 从RDS快照恢复 |
| 完整Region故障 | <4小时 | <24小时 | 切换到备用Region (ap-ne-1) |

> RTO: 恢复时间目标 | RPO: 恢复点目标（最大数据丢失量）
