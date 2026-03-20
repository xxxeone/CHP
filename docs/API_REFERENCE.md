# CHP Auto Service Loyalty App — API Reference

Base URL: `https://api.chpauto.com.au/api`

## Authentication

All private endpoints require: `Authorization: Bearer <token>`

---

## Auth `/auth`

| Method | Endpoint           | Description             | Auth |
|--------|--------------------|-------------------------|------|
| POST   | `/register`        | 注册新用户               | No   |
| POST   | `/login`           | 手机号+密码登录           | No   |
| POST   | `/send-otp`        | 发送短信验证码            | No   |
| POST   | `/verify-otp`      | 验证OTP                 | No   |
| POST   | `/refresh`         | 刷新access token        | No   |
| POST   | `/logout`          | 退出登录                 | Yes  |
| PUT    | `/change-password` | 修改密码                 | Yes  |

---

## Users `/users`

| Method | Endpoint         | Description              |
|--------|------------------|--------------------------|
| GET    | `/me`            | 获取当前用户信息            |
| PUT    | `/me`            | 更新个人信息               |
| POST   | `/me/avatar`     | 上传头像                   |
| GET    | `/me/dashboard`  | 首页仪表盘数据              |
| GET    | `/me/stats`      | 消费统计（?year=2024）      |

---

## Vehicles `/vehicles`

| Method | Endpoint                    | Description         |
|--------|-----------------------------|---------------------|
| GET    | `/`                         | 所有车辆             |
| POST   | `/`                         | 添加车辆             |
| GET    | `/:id`                      | 车辆详情             |
| PUT    | `/:id`                      | 更新车辆             |
| DELETE | `/:id`                      | 删除车辆             |
| PUT    | `/:id/primary`              | 设为主要车辆          |
| GET    | `/:id/service-history`      | 维修历史             |
| PUT    | `/:id/mileage`              | 更新里程数            |

---

## Appointments `/appointments`

| Method | Endpoint               | Description                    |
|--------|------------------------|--------------------------------|
| GET    | `/`                    | 预约列表 (?status=pending)      |
| GET    | `/upcoming`            | 即将到来的预约                   |
| GET    | `/available-slots`     | 可用时间段 (?date=2024-03-20)   |
| POST   | `/`                    | 创建预约                        |
| PUT    | `/:id`                 | 修改预约                        |
| DELETE | `/:id/cancel`          | 取消预约                        |

---

## Points `/points`

| Method | Endpoint     | Description                     |
|--------|--------------|---------------------------------|
| GET    | `/summary`   | 积分摘要（余额、等级、进度）          |
| GET    | `/history`   | 积分历史 (?type=earn_service)    |
| GET    | `/expiring`  | 即将过期积分（30天内）              |
| GET    | `/rewards`   | 可兑换奖励列表                     |
| POST   | `/redeem`    | 兑换积分                          |
| POST   | `/checkin`   | 每日签到                          |
| GET    | `/tiers`     | 所有会员等级信息                   |

---

## Notifications `/notifications`

| Method | Endpoint           | Description        |
|--------|--------------------|--------------------|
| GET    | `/`                | 通知列表            |
| GET    | `/unread-count`    | 未读数量            |
| PUT    | `/:id/read`        | 标记已读            |
| PUT    | `/read-all`        | 全部已读            |
| DELETE | `/:id`             | 删除通知            |
| PUT    | `/push-token`      | 更新推送Token       |
| GET    | `/preferences`     | 通知偏好设置         |
| PUT    | `/preferences`     | 更新通知偏好         |

---

## Promotions `/promotions`

| Method | Endpoint          | Description         |
|--------|-------------------|---------------------|
| GET    | `/`               | 当前有效促销          |
| GET    | `/:id`            | 促销详情             |
| POST   | `/validate-code`  | 验证促销码           |

---

## Points Calculation

| Tier     | Points per $1 | Discount |
|----------|--------------|----------|
| Bronze   | 1.0          | 0%       |
| Silver   | 1.5          | 5%       |
| Gold     | 2.0          | 10%      |
| Platinum | 3.0          | 15%      |

### Bonus Points
- 注册礼遇: +200 pts
- 推荐新用户: +500 pts
- 提交评价: +50 pts
- 每日签到: +10 pts (连续签到额外 +5/天，最多+30)
- 生日: Bronze +100 / Silver +200 / Gold +500 / Platinum +1000

### Points Expiry
积分有效期 **2年**，每年1月自动过期前一年的积分。
