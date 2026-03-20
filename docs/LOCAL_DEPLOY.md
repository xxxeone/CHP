# CHP Loyalty App — 本地 MVP 部署指南
# Local MVP Deployment Guide

**前提条件 Prerequisites:**
- Node.js ≥ 18
- PostgreSQL ≥ 14
- npm ≥ 9

---

## 核心文件清单 Critical Files for MVP

### 必须存在 MUST EXIST

```
backend/
  src/app.js                          ✅ Express入口
  src/config/db.js                    ✅ PostgreSQL连接
  src/middleware/auth.js              ✅ JWT验证
  src/middleware/validate.js          ✅ 请求验证
  src/controllers/authController.js   ✅ 登录/注册/OTP
  src/controllers/usersController.js  ✅ 个人资料/仪表盘
  src/controllers/vehiclesController.js ✅ 车辆管理
  src/controllers/appointmentsController.js ✅ 预约流程
  src/controllers/pointsController.js ✅ 积分系统
  src/controllers/notificationsController.js ✅ 通知
  src/controllers/promotionsController.js ✅ 促销
  src/controllers/servicesController.js ✅ 维修记录
  src/controllers/reviewsController.js ✅ 评价
  src/controllers/adminController.js  ✅ 管理后台
  src/routes/ (9 files)               ✅ 路由注册
  src/utils/pointsEngine.js           ✅ 积分引擎
  src/utils/notificationService.js    ✅ 通知服务
  src/utils/migrate.js                ✅ 数据库迁移脚本
  src/utils/seed.js                   ✅ 测试数据脚本
  .env                                ✅ 环境变量
  package.json                        ✅ 依赖配置

database/
  schema.sql                          ✅ 数据库结构 (13张表)
  seed.sql                            ✅ 初始数据
```

### 开发暂不需要 NOT NEEDED FOR LOCAL MVP
```
src/utils/scheduler.js    — Cron任务 (生产用)
firebase-admin            — 推送通知 (留空env即可跳过)
twilio                    — 短信 (OTP打印到控制台)
AWS S3                    — 头像上传 (留空env即可跳过)
```

---

## 部署步骤 Deployment Steps

### Step 1: 创建 PostgreSQL 数据库

```bash
# 进入 psql
psql -U postgres

# 创建数据库
CREATE DATABASE chp_loyalty;
\q
```

### Step 2: 克隆并配置环境变量

```bash
cd CHP/backend

# 检查 .env 文件（已预配置本地默认值）
cat .env

# 如果 PostgreSQL 密码不同，修改 DB_PASSWORD
# 默认配置: host=localhost, db=chp_loyalty, user=postgres, password=postgres
```

### Step 3: 安装依赖

```bash
cd CHP/backend
npm install
```

### Step 4: 初始化数据库

```bash
# 运行 Schema 迁移（建表）
npm run migrate

# 运行种子数据（服务分类 + 测试账号）
npm run seed
```

**Seed 后可用账号:**

| 角色 | 手机号 | 密码 |
|------|--------|------|
| 管理员 | +61400000001 | Admin@123 |
| 测试客户 (Gold) | +61400000002 | Test@1234 |

### Step 5: 启动 API 服务

```bash
# 开发模式（自动重载）
npm run dev

# 生产模式
npm start
```

API 运行在: `http://localhost:3000`

### Step 6: 验证服务正常

```bash
# 健康检查
curl http://localhost:3000/health
# 期望: {"status":"ok","timestamp":"..."}

# 登录测试
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"+61400000002","password":"Test@1234"}'
# 期望: {"user":{...},"token":"eyJ...","refreshToken":"eyJ..."}

# 获取积分摘要（替换 YOUR_TOKEN）
curl http://localhost:3000/api/points/summary \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Step 7: (可选) 启动前端 App

```bash
cd CHP/frontend
npm install

# 创建前端环境变量
echo "EXPO_PUBLIC_API_URL=http://localhost:3000/api" > .env

# 启动 Expo
npm start
# 用 Expo Go App 扫描二维码，或按 i (iOS模拟器) / a (Android模拟器)
```

---

## 常见问题 Troubleshooting

### ❌ `ECONNREFUSED` — 数据库连接失败
```bash
# 检查 PostgreSQL 是否运行
pg_ctl status
# 或
brew services list | grep postgresql  # macOS
sudo systemctl status postgresql      # Linux

# 检查 .env 中的 DB_PASSWORD 是否正确
```

### ❌ `relation "users" does not exist`
```bash
# 需要先运行迁移
npm run migrate
```

### ❌ `Cannot find module '../controllers/vehiclesController'`
```bash
# 确保所有控制器文件存在
ls backend/src/controllers/
# 应有: authController.js, vehiclesController.js, appointmentsController.js,
#        pointsController.js, usersController.js, notificationsController.js,
#        promotionsController.js, servicesController.js, reviewsController.js,
#        adminController.js
```

### ❌ `JWT_SECRET is not defined`
```bash
# 确保 .env 文件存在且已 require('dotenv').config()
cat backend/.env | grep JWT_SECRET
```

### ⚠️ OTP 短信未发送 (正常行为)
开发环境中 Twilio 未配置，OTP 会打印到控制台：
```
[OTP] +61400000002: 123456
```
直接使用控制台显示的数字即可。

---

## MVP 可测试的完整功能

| 功能 | 端点 | 状态 |
|------|------|------|
| 注册 | POST /api/auth/register | ✅ |
| 密码登录 | POST /api/auth/login | ✅ |
| OTP登录 | POST /api/auth/send-otp + /verify-otp | ✅ |
| 用户仪表盘 | GET /api/users/me/dashboard | ✅ |
| 添加车辆 | POST /api/vehicles | ✅ |
| 查看车辆 | GET /api/vehicles | ✅ |
| 可用时间段 | GET /api/appointments/available-slots?date=2026-04-01 | ✅ |
| 创建预约 | POST /api/appointments | ✅ |
| 积分摘要 | GET /api/points/summary | ✅ |
| 每日签到 | POST /api/points/checkin | ✅ |
| 积分历史 | GET /api/points/history | ✅ |
| 奖励列表 | GET /api/points/rewards | ✅ |
| 积分兑换 | POST /api/points/redeem | ✅ |
| 通知列表 | GET /api/notifications | ✅ |
| 促销活动 | GET /api/promotions | ✅ |
| 提交评价 | POST /api/reviews | ✅ |
| 管理仪表盘 | GET /api/admin/dashboard | ✅ (需管理员Token) |
