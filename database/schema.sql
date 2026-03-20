-- ============================================================
-- CHP Auto Service - Customer Loyalty App Database Schema
-- Version: 1.0.0
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. USERS TABLE - 用户表
-- ============================================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone           VARCHAR(20) UNIQUE NOT NULL,           -- 手机号（主要登录方式）
    email           VARCHAR(255) UNIQUE,                   -- 邮箱（可选）
    password_hash   VARCHAR(255),                          -- 密码哈希
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    avatar_url      TEXT,
    date_of_birth   DATE,
    gender          VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    preferred_lang  VARCHAR(10) DEFAULT 'zh' CHECK (preferred_lang IN ('zh', 'en')),
    membership_tier VARCHAR(20) DEFAULT 'bronze' CHECK (
                        membership_tier IN ('bronze', 'silver', 'gold', 'platinum')
                    ),
    referral_code   VARCHAR(20) UNIQUE,                    -- 推荐码
    referred_by     UUID REFERENCES users(id),             -- 推荐人
    push_token      TEXT,                                  -- 推送通知 token
    is_active       BOOLEAN DEFAULT true,
    email_verified  BOOLEAN DEFAULT false,
    phone_verified  BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    last_login_at   TIMESTAMPTZ
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_users_membership_tier ON users(membership_tier);

-- ============================================================
-- 2. VEHICLES TABLE - 车辆表
-- ============================================================
CREATE TABLE vehicles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nickname        VARCHAR(100),                          -- 车辆昵称 (e.g., "我的宝马")
    make            VARCHAR(100) NOT NULL,                 -- 品牌 (e.g., Toyota)
    model           VARCHAR(100) NOT NULL,                 -- 型号 (e.g., Camry)
    year            INTEGER NOT NULL CHECK (year >= 1900 AND year <= 2030),
    color           VARCHAR(50),
    license_plate   VARCHAR(20),                          -- 车牌号
    vin             VARCHAR(17) UNIQUE,                   -- 车辆识别号
    engine_size     VARCHAR(20),                          -- 发动机排量
    fuel_type       VARCHAR(20) CHECK (
                        fuel_type IN ('gasoline', 'diesel', 'electric', 'hybrid', 'other')
                    ),
    transmission    VARCHAR(20) CHECK (
                        transmission IN ('automatic', 'manual', 'cvt', 'other')
                    ),
    mileage         INTEGER DEFAULT 0,                    -- 当前里程数 (km)
    last_service_mileage INTEGER,                         -- 上次保养里程
    next_service_mileage INTEGER,                         -- 下次保养里程
    is_primary      BOOLEAN DEFAULT false,                -- 是否为主要车辆
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX idx_vehicles_vin ON vehicles(vin);

-- ============================================================
-- 3. SERVICE CATEGORIES TABLE - 服务分类表
-- ============================================================
CREATE TABLE service_categories (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_zh     VARCHAR(100) NOT NULL,                    -- 中文名称
    name_en     VARCHAR(100) NOT NULL,                    -- 英文名称
    icon        VARCHAR(50),                              -- 图标名称
    color       VARCHAR(7),                               -- 颜色 (#RRGGBB)
    sort_order  INTEGER DEFAULT 0,
    is_active   BOOLEAN DEFAULT true
);

INSERT INTO service_categories (name_zh, name_en, icon, color, sort_order) VALUES
    ('常规保养', 'Regular Maintenance', 'oil-can', '#4CAF50', 1),
    ('刹车系统', 'Brake System', 'disc-brake', '#F44336', 2),
    ('轮胎服务', 'Tire Service', 'tire', '#FF9800', 3),
    ('发动机', 'Engine', 'engine', '#9C27B0', 4),
    ('空调系统', 'AC System', 'snowflake', '#2196F3', 5),
    ('电气系统', 'Electrical', 'bolt', '#FFC107', 6),
    ('悬挂系统', 'Suspension', 'car-suspension', '#795548', 7),
    ('车身美容', 'Detailing', 'sparkles', '#E91E63', 8),
    ('其他', 'Other', 'wrench', '#607D8B', 9);

-- ============================================================
-- 4. SERVICES TABLE - 服务项目表
-- ============================================================
CREATE TABLE services (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id     UUID REFERENCES service_categories(id),
    name_zh         VARCHAR(200) NOT NULL,
    name_en         VARCHAR(200) NOT NULL,
    description_zh  TEXT,
    description_en  TEXT,
    base_price      DECIMAL(10,2) NOT NULL,               -- 基础价格 (AUD)
    duration_mins   INTEGER,                              -- 预计时长（分钟）
    points_earned   INTEGER DEFAULT 0,                    -- 完成后获得积分
    is_active       BOOLEAN DEFAULT true,
    sort_order      INTEGER DEFAULT 0
);

-- ============================================================
-- 5. SERVICE RECORDS TABLE - 维修记录表
-- ============================================================
CREATE TABLE service_records (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id),
    vehicle_id      UUID NOT NULL REFERENCES vehicles(id),
    invoice_number  VARCHAR(50) UNIQUE NOT NULL,           -- 发票号
    service_date    DATE NOT NULL,
    total_amount    DECIMAL(10,2) NOT NULL,                -- 总金额 (AUD)
    discount_amount DECIMAL(10,2) DEFAULT 0,              -- 折扣金额
    final_amount    DECIMAL(10,2) NOT NULL,               -- 实付金额
    payment_method  VARCHAR(30) CHECK (
                        payment_method IN ('cash', 'card', 'eftpos', 'afterpay', 'points')
                    ),
    points_earned   INTEGER DEFAULT 0,                    -- 本次获得积分
    points_used     INTEGER DEFAULT 0,                    -- 本次使用积分
    vehicle_mileage INTEGER,                              -- 维修时里程
    technician_name VARCHAR(100),                         -- 技师姓名
    status          VARCHAR(20) DEFAULT 'completed' CHECK (
                        status IN ('in_progress', 'completed', 'cancelled')
                    ),
    notes           TEXT,                                 -- 备注
    next_service_reminder TEXT,                           -- 下次保养提醒
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_service_records_user_id ON service_records(user_id);
CREATE INDEX idx_service_records_vehicle_id ON service_records(vehicle_id);
CREATE INDEX idx_service_records_service_date ON service_records(service_date DESC);

-- ============================================================
-- 6. SERVICE RECORD ITEMS TABLE - 维修项目明细表
-- ============================================================
CREATE TABLE service_record_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_id       UUID NOT NULL REFERENCES service_records(id) ON DELETE CASCADE,
    service_id      UUID REFERENCES services(id),
    name_zh         VARCHAR(200) NOT NULL,                -- 服务/零件名称（中文）
    name_en         VARCHAR(200),                         -- 服务/零件名称（英文）
    item_type       VARCHAR(20) CHECK (
                        item_type IN ('service', 'part', 'labor', 'other')
                    ),
    quantity        DECIMAL(10,3) DEFAULT 1,
    unit_price      DECIMAL(10,2) NOT NULL,
    total_price     DECIMAL(10,2) NOT NULL,
    warranty_months INTEGER DEFAULT 0,                    -- 保修月数
    notes           TEXT
);

-- ============================================================
-- 7. APPOINTMENTS TABLE - 预约表
-- ============================================================
CREATE TABLE appointments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id),
    vehicle_id      UUID NOT NULL REFERENCES vehicles(id),
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    estimated_duration INTEGER DEFAULT 60,                -- 预计时长（分钟）
    status          VARCHAR(20) DEFAULT 'pending' CHECK (
                        status IN ('pending', 'confirmed', 'in_progress',
                                   'completed', 'cancelled', 'no_show')
                    ),
    service_type    TEXT[],                               -- 服务类型数组
    description     TEXT,                                 -- 问题描述
    customer_notes  TEXT,                                 -- 客户备注
    staff_notes     TEXT,                                 -- 员工备注
    reminder_sent   BOOLEAN DEFAULT false,                -- 是否已发送提醒
    confirmed_at    TIMESTAMPTZ,
    cancelled_at    TIMESTAMPTZ,
    cancellation_reason TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_appointments_user_id ON appointments(user_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);

-- ============================================================
-- 8. LOYALTY POINTS TABLE - 积分记录表
-- ============================================================
CREATE TABLE loyalty_points (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id),
    transaction_type VARCHAR(30) NOT NULL CHECK (
                        transaction_type IN (
                            'earn_service',        -- 消费获取
                            'earn_referral',       -- 推荐获取
                            'earn_birthday',       -- 生日奖励
                            'earn_review',         -- 评价获取
                            'earn_checkin',        -- 签到获取
                            'earn_promotion',      -- 促销活动
                            'earn_milestone',      -- 里程碑奖励
                            'redeem_discount',     -- 兑换折扣
                            'redeem_service',      -- 兑换服务
                            'redeem_product',      -- 兑换产品
                            'expire',              -- 积分过期
                            'adjust_manual',       -- 手动调整
                            'transfer_in',         -- 转入
                            'transfer_out'         -- 转出
                        )
                    ),
    points          INTEGER NOT NULL,                     -- 积分变动（正=获得，负=使用）
    balance_after   INTEGER NOT NULL,                     -- 变动后余额
    reference_id    UUID,                                 -- 关联记录ID
    reference_type  VARCHAR(50),                          -- 关联记录类型
    description_zh  TEXT,                                 -- 描述（中文）
    description_en  TEXT,                                 -- 描述（英文）
    expires_at      TIMESTAMPTZ,                          -- 积分过期时间
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_loyalty_points_user_id ON loyalty_points(user_id);
CREATE INDEX idx_loyalty_points_created_at ON loyalty_points(created_at DESC);
CREATE INDEX idx_loyalty_points_expires_at ON loyalty_points(expires_at);

-- ============================================================
-- 9. PROMOTIONS TABLE - 促销活动表
-- ============================================================
CREATE TABLE promotions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title_zh        VARCHAR(200) NOT NULL,
    title_en        VARCHAR(200) NOT NULL,
    description_zh  TEXT,
    description_en  TEXT,
    promo_type      VARCHAR(30) CHECK (
                        promo_type IN (
                            'percentage_off',      -- 折扣百分比
                            'fixed_off',           -- 固定金额折扣
                            'double_points',       -- 双倍积分
                            'free_service',        -- 免费服务
                            'bonus_points'         -- 额外积分
                        )
                    ),
    discount_value  DECIMAL(10,2),                        -- 折扣值
    bonus_points    INTEGER,                              -- 奖励积分
    min_spend       DECIMAL(10,2) DEFAULT 0,              -- 最低消费
    applicable_services UUID[],                           -- 适用服务
    applicable_tiers VARCHAR(20)[],                       -- 适用会员等级
    promo_code      VARCHAR(50) UNIQUE,                   -- 促销码
    usage_limit     INTEGER,                              -- 使用次数上限
    usage_count     INTEGER DEFAULT 0,                    -- 已使用次数
    per_user_limit  INTEGER DEFAULT 1,                    -- 每用户使用限制
    image_url       TEXT,
    start_date      TIMESTAMPTZ NOT NULL,
    end_date        TIMESTAMPTZ NOT NULL,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. NOTIFICATIONS TABLE - 通知表
-- ============================================================
CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title_zh        VARCHAR(200) NOT NULL,
    title_en        VARCHAR(200) NOT NULL,
    body_zh         TEXT NOT NULL,
    body_en         TEXT NOT NULL,
    type            VARCHAR(50) CHECK (
                        type IN (
                            'appointment_reminder', 'appointment_confirmed',
                            'service_completed', 'points_earned',
                            'promotion', 'tier_upgrade', 'birthday',
                            'service_reminder', 'system'
                        )
                    ),
    reference_id    UUID,
    is_read         BOOLEAN DEFAULT false,
    sent_at         TIMESTAMPTZ,
    read_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(user_id, is_read);

-- ============================================================
-- 11. REVIEWS TABLE - 评价表
-- ============================================================
CREATE TABLE reviews (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id),
    record_id       UUID REFERENCES service_records(id),
    overall_rating  INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
    service_rating  INTEGER CHECK (service_rating BETWEEN 1 AND 5),
    price_rating    INTEGER CHECK (price_rating BETWEEN 1 AND 5),
    speed_rating    INTEGER CHECK (speed_rating BETWEEN 1 AND 5),
    comment         TEXT,
    is_anonymous    BOOLEAN DEFAULT false,
    is_published    BOOLEAN DEFAULT false,
    points_awarded  INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 12. MEMBERSHIP TIERS CONFIG TABLE - 会员等级配置
-- ============================================================
CREATE TABLE membership_tiers (
    tier            VARCHAR(20) PRIMARY KEY,
    name_zh         VARCHAR(50) NOT NULL,
    name_en         VARCHAR(50) NOT NULL,
    min_points      INTEGER NOT NULL,                     -- 升级所需最低积分
    max_points      INTEGER,                              -- 该等级最高积分
    points_per_dollar DECIMAL(5,2) DEFAULT 1.0,          -- 每澳元获得积分
    discount_percent DECIMAL(5,2) DEFAULT 0,             -- 额外折扣
    birthday_bonus  INTEGER DEFAULT 0,                   -- 生日额外积分
    annual_service_discount INTEGER DEFAULT 0,           -- 年度服务折扣次数
    icon            VARCHAR(50),
    color           VARCHAR(7),
    benefits_zh     TEXT[],
    benefits_en     TEXT[]
);

INSERT INTO membership_tiers VALUES
(
    'bronze', '铜牌会员', 'Bronze Member',
    0, 999,
    1.0, 0, 100, 0,
    'medal-bronze', '#CD7F32',
    ARRAY['每消费$1获得1积分', '生日双倍积分', '专属会员活动'],
    ARRAY['1 point per $1 spent', 'Birthday double points', 'Exclusive member events']
),
(
    'silver', '银牌会员', 'Silver Member',
    1000, 4999,
    1.5, 5, 200, 1,
    'medal-silver', '#C0C0C0',
    ARRAY['每消费$1获得1.5积分', '9.5折优惠', '生日额外200积分', '每年1次免费检查'],
    ARRAY['1.5 points per $1 spent', '5% discount', '200 birthday bonus points', '1 free inspection/year']
),
(
    'gold', '金牌会员', 'Gold Member',
    5000, 19999,
    2.0, 10, 500, 2,
    'medal-gold', '#FFD700',
    ARRAY['每消费$1获得2积分', '9折优惠', '生日额外500积分', '每年2次免费检查', '优先预约'],
    ARRAY['2 points per $1 spent', '10% discount', '500 birthday bonus points', '2 free inspections/year', 'Priority booking']
),
(
    'platinum', '铂金会员', 'Platinum Member',
    20000, NULL,
    3.0, 15, 1000, 4,
    'medal-platinum', '#E5E4E2',
    ARRAY['每消费$1获得3积分', '8.5折优惠', '生日额外1000积分', '每年4次免费检查', '专属客服', '免费取送车'],
    ARRAY['3 points per $1 spent', '15% discount', '1000 birthday bonus points', '4 free inspections/year', 'Dedicated support', 'Free pickup & drop-off']
);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_service_records_updated_at
    BEFORE UPDATE ON service_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto update membership tier based on total points
CREATE OR REPLACE FUNCTION update_membership_tier()
RETURNS TRIGGER AS $$
DECLARE
    total_pts INTEGER;
    new_tier VARCHAR(20);
BEGIN
    SELECT COALESCE(SUM(points), 0) INTO total_pts
    FROM loyalty_points
    WHERE user_id = NEW.user_id AND points > 0;

    IF total_pts >= 20000 THEN
        new_tier := 'platinum';
    ELSIF total_pts >= 5000 THEN
        new_tier := 'gold';
    ELSIF total_pts >= 1000 THEN
        new_tier := 'silver';
    ELSE
        new_tier := 'bronze';
    END IF;

    UPDATE users SET membership_tier = new_tier WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_membership_tier
    AFTER INSERT ON loyalty_points
    FOR EACH ROW EXECUTE FUNCTION update_membership_tier();

-- Generate unique referral code on user creation
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
DECLARE
    code VARCHAR(8);
BEGIN
    LOOP
        code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
        EXIT WHEN NOT EXISTS (SELECT 1 FROM users WHERE referral_code = code);
    END LOOP;
    NEW.referral_code := code;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_referral_code
    BEFORE INSERT ON users
    FOR EACH ROW
    WHEN (NEW.referral_code IS NULL)
    EXECUTE FUNCTION generate_referral_code();
