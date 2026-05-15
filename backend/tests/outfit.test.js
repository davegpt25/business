require('dotenv').config({ path: '.env' });
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const db = require('../src/config/db');

let testUserId, testToken;

beforeAll(async () => {
  const userRes = await db.query(
    `INSERT INTO users (provider, provider_id, email, nickname)
     VALUES ('test', 'outfit_test_user', 'outfit@test.com', '추천테스트')
     ON CONFLICT (provider, provider_id) DO UPDATE SET nickname = EXCLUDED.nickname
     RETURNING id`
  );
  testUserId = userRes.rows[0].id;
  testToken = jwt.sign({ id: testUserId }, process.env.JWT_SECRET);

  // 테스트 아이템 등록
  await db.query(
    `INSERT INTO clothing_items (user_id, category, image_url, primary_color, primary_color_name)
     VALUES
       ($1, 'top', 'https://example.com/top1.jpg', '#FFFFFF', 'white'),
       ($1, 'top', 'https://example.com/top2.jpg', '#000000', 'black'),
       ($1, 'bottom', 'https://example.com/bottom1.jpg', '#1A237E', 'navy'),
       ($1, 'bottom', 'https://example.com/bottom2.jpg', '#795548', 'brown')`,
    [testUserId]
  );
});

afterAll(async () => {
  await db.query('DELETE FROM clothing_items WHERE user_id = $1', [testUserId]);
  await db.query("DELETE FROM users WHERE provider = 'test' AND provider_id = 'outfit_test_user'");
  await db.end();
});

describe('GET /api/v1/outfit/recommendations', () => {
  it('base_item_id 없이 요청 시 400', async () => {
    const res = await request(app)
      .get('/api/v1/outfit/recommendations')
      .set('Authorization', `Bearer ${testToken}`);
    expect(res.status).toBe(400);
  });

  it('base_item_id로 추천 목록 반환', async () => {
    const items = await db.query(
      "SELECT id FROM clothing_items WHERE user_id = $1 AND category = 'top' LIMIT 1",
      [testUserId]
    );
    const baseItemId = items.rows[0].id;

    const res = await request(app)
      .get(`/api/v1/outfit/recommendations?base_item_id=${baseItemId}`)
      .set('Authorization', `Bearer ${testToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.recommendations)).toBe(true);
    expect(res.body.recommendations.length).toBeGreaterThanOrEqual(1);
    expect(res.body.recommendations[0]).toHaveProperty('compatibility_score');
    expect(res.body.recommendations[0].compatibility_score).toBeGreaterThan(0);
  });

  it('인증 없으면 401', async () => {
    const res = await request(app).get('/api/v1/outfit/recommendations?base_item_id=abc');
    expect(res.status).toBe(401);
  });
});

describe('Authorization: cross-user outfit isolation', () => {
  let baseItemId;
  let otherToken;

  beforeAll(async () => {
    const items = await db.query(
      "SELECT id FROM clothing_items WHERE user_id = $1 AND category = 'top' LIMIT 1",
      [testUserId]
    );
    baseItemId = items.rows[0].id;

    const otherUser = await db.query(
      `INSERT INTO users (provider, provider_id, email, nickname)
       VALUES ('test', 'other_outfit_user', 'other_outfit@test.com', '타유저')
       ON CONFLICT (provider, provider_id) DO UPDATE SET nickname = EXCLUDED.nickname
       RETURNING id`
    );
    otherToken = jwt.sign({ id: otherUser.rows[0].id }, process.env.JWT_SECRET);
  });

  afterAll(async () => {
    await db.query("DELETE FROM users WHERE provider = 'test' AND provider_id = 'other_outfit_user'");
  });

  it('다른 사용자의 base_item으로 요청 시 404', async () => {
    const res = await request(app)
      .get(`/api/v1/outfit/recommendations?base_item_id=${baseItemId}`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(res.status).toBe(404);
  });
});
