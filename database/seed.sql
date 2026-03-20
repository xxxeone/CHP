-- ============================================================
-- CHP Auto Service - Seed Data
-- ============================================================

-- Sample Services
INSERT INTO services (category_id, name_zh, name_en, base_price, duration_mins, points_earned)
SELECT
    sc.id,
    s.name_zh, s.name_en, s.base_price, s.duration_mins, s.points_earned
FROM (VALUES
    ('常规保养', '机油机滤更换', 'Oil & Filter Change', 89.00, 45, 89),
    ('常规保养', '全车检查', 'Full Vehicle Inspection', 0.00, 60, 50),
    ('常规保养', '空气滤清器更换', 'Air Filter Replacement', 49.00, 20, 49),
    ('刹车系统', '刹车片更换（前）', 'Front Brake Pads Replacement', 249.00, 90, 249),
    ('刹车系统', '刹车片更换（后）', 'Rear Brake Pads Replacement', 249.00, 90, 249),
    ('刹车系统', '刹车油更换', 'Brake Fluid Flush', 89.00, 45, 89),
    ('轮胎服务', '四轮定位', 'Wheel Alignment', 99.00, 60, 99),
    ('轮胎服务', '轮胎换位', 'Tyre Rotation', 39.00, 30, 39),
    ('轮胎服务', '轮胎充气（氮气）', 'Nitrogen Tyre Inflation', 29.00, 20, 29),
    ('空调系统', '空调清洗加氟', 'AC Service & Regas', 189.00, 90, 189),
    ('发动机', '正时皮带更换', 'Timing Belt Replacement', 599.00, 240, 599),
    ('电气系统', '电池检测更换', 'Battery Test & Replacement', 149.00, 30, 149)
) AS s(category_zh, name_zh, name_en, base_price, duration_mins, points_earned)
JOIN service_categories sc ON sc.name_zh = s.category_zh;
