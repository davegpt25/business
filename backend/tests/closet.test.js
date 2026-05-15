require('dotenv').config({ path: '.env' });
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const db = require('../src/config/db');

let testUserId;
let testToken;
let testItemId;

beforeAll(async () => {
  const result = await db.query(
    `INSERT INTO users (provider, provider_id, email, nickname)
     VALUES ('test', 'closet_test_user', 'closet@test.com', '옷장테스트')
     ON CONFLICT (provider, provider_id) DO UPDATE SET nickname = EXCLUDED.nickname
     RETURNING id`
  );
  testUserId = result.rows[0].id;
  testToken = jwt.sign({ id: testUserId }, process.env.JWT_SECRET);
});

afterAll(async () => {
  await db.query('DELETE FROM clothing_items WHERE user_id = $1', [testUserId]);
  await db.query("DELETE FROM users WHERE provider = 'test' AND provider_id = 'closet_test_user'");
  await db.end();
});

describe('POST /api/v1/closet/items', () => {
  it('아이템 등록 성공', async () => {
    const res = await request(app)
      .post('/api/v1/closet/items')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        category: 'top',
        image_url: 'https://example.com/shirt.jpg',
        primary_color: '#FF5733',
        primary_color_name: 'red',
        style_keywords: ['캐주얼'],
        fit_type: '레귤러',
      });
    expect(res.status).toBe(201);
    expect(res.body.item).toHaveProperty('id');
    expect(res.body.item.category).toBe('top');
    testItemId = res.body.item.id;
  });

  it('인증 없으면 401', async () => {
    const res = await request(app).post('/api/v1/closet/items').send({ category: 'top' });
    expect(res.status).toBe(401);
  });

  it('category 누락 시 400', async () => {
    const res = await request(app)
      .post('/api/v1/closet/items')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ image_url: 'https://example.com/shirt.jpg' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/closet/items', () => {
  it('내 아이템 목록 반환', async () => {
    const res = await request(app)
      .get('/api/v1/closet/items')
      .set('Authorization', `Bearer ${testToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it('category 필터 적용', async () => {
    const res = await request(app)
      .get('/api/v1/closet/items?category=top')
      .set('Authorization', `Bearer ${testToken}`);
    expect(res.status).toBe(200);
    res.body.items.forEach((item) => expect(item.category).toBe('top'));
  });
});

describe('DELETE /api/v1/closet/items/:id', () => {
  it('내 아이템 삭제 성공', async () => {
    const res = await request(app)
      .delete(`/api/v1/closet/items/${testItemId}`)
      .set('Authorization', `Bearer ${testToken}`);
    expect(res.status).toBe(204);
  });

  it('존재하지 않는 아이템 삭제 시 404', async () => {
    const res = await request(app)
      .delete('/api/v1/closet/items/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${testToken}`);
    expect(res.status).toBe(404);
  });
});
