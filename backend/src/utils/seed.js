/**
 * CHP Database Seed Script
 * Usage: node src/utils/seed.js
 * Creates: admin user + test user + sample data
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function seed() {
  const client = await pool.connect();
  try {
    console.log('🌱 Seeding database...');

    // 1. Run seed SQL (service categories + services)
    const seedPath = path.join(__dirname, '../../../database/seed.sql');
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    await client.query(seedSql);
    console.log('✅ Service categories and services seeded');

    // 2. Admin user
    const adminHash = await bcrypt.hash('Admin@123', 12);
    await client.query(`
      INSERT INTO users (phone, email, password_hash, first_name, last_name, is_admin, membership_tier, phone_verified)
      VALUES ('+61400000001', 'admin@chpauto.com.au', $1, 'Admin', 'CHP', true, 'platinum', true)
      ON CONFLICT (phone) DO NOTHING`,
      [adminHash]
    );
    console.log('✅ Admin user: +61400000001 / Admin@123');

    // 3. Test customer (Gold tier)
    const testHash = await bcrypt.hash('Test@1234', 12);
    const { rows: [testUser] } = await client.query(`
      INSERT INTO users (phone, email, password_hash, first_name, last_name, membership_tier, phone_verified)
      VALUES ('+61400000002', 'test@example.com', $1, 'Wei', 'Zhang', 'gold', true)
      ON CONFLICT (phone) DO UPDATE SET first_name = 'Wei' RETURNING id`,
      [testHash]
    );
    console.log('✅ Test user: +61400000002 / Test@1234 (Gold tier)');

    if (testUser) {
      // 4. Test vehicle
      await client.query(`
        INSERT INTO vehicles (user_id, make, model, year, color, license_plate, fuel_type, mileage, is_primary)
        VALUES ($1, 'Toyota', 'Camry', 2020, 'Silver', 'ABC123', 'gasoline', 45000, true)
        ON CONFLICT DO NOTHING`,
        [testUser.id]
      );

      // 5. Starter points balance (5200 → Gold tier)
      const { rows: [existing] } = await client.query(
        'SELECT id FROM loyalty_points WHERE user_id = $1 LIMIT 1', [testUser.id]
      );
      if (!existing) {
        await client.query(`
          INSERT INTO loyalty_points (user_id, transaction_type, points, balance_after, description_zh, description_en)
          VALUES ($1, 'earn_service', 5200, 5200, '历史消费积分（测试）', 'Historical points (test)')`,
          [testUser.id]
        );
      }
      console.log('✅ Test vehicle + 5200 points added');
    }

    // 6. Sample active promotion
    await client.query(`
      INSERT INTO promotions
        (title_zh, title_en, promo_type, discount_value, start_date, end_date, is_active)
      VALUES
        ('冬季保养8折优惠', 'Winter Service 20% Off', 'percentage_off', 20,
         NOW(), NOW() + INTERVAL '30 days', true)
      ON CONFLICT DO NOTHING`
    );
    console.log('✅ Sample promotion added');

    console.log('\n🎉 Seed complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin:    +61400000001  /  Admin@123');
    console.log('Customer: +61400000002  /  Test@1234');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
