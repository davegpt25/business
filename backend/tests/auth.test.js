require('dotenv').config({ path: '.env' });
const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');

afterAll(async () => {
  await db.query("DELETE FROM users WHERE provider = 'kakao' AND provider_id = 'kakao_test_123'");
  await db.end();
});

describe('POST /api/v1/auth/social-login', () => {
  it('유효한 카카오 토큰으로 로그인 시 JWT 반환', async () => {
    const res = await request(app)
      .post('/api/v1/auth/social-login')
      .send({
        provider: 'kakao',
        provider_id: 'kakao_test_123',
        email: 'test@closetfit.test',
        nickname: '테스트유저',
      });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.nickname).toBe('테스트유저');
  });

  it('같은 provider_id 재로그인 시 기존 사용자 반환', async () => {
    const payload = {
      provider: 'kakao',
      provider_id: 'kakao_test_123',
      email: 'test@closetfit.test',
      nickname: '테스트유저',
    };
    await request(app).post('/api/v1/auth/social-login').send(payload);
    const res = await request(app).post('/api/v1/auth/social-login').send(payload);
    expect(res.status).toBe(200);
    expect(res.body.user.provider_id).toBe('kakao_test_123');
  });

  it('provider 없으면 400 반환', async () => {
    const res = await request(app)
      .post('/api/v1/auth/social-login')
      .send({ provider_id: 'abc' });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/v1/auth/profile', () => {
  let authToken;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/auth/social-login')
      .send({
        provider: 'kakao',
        provider_id: 'kakao_profile_test',
        email: 'profile@closetfit.test',
        nickname: '프로파일테스터',
      });
    authToken = res.body.token;
  });

  afterAll(async () => {
    await db.query("DELETE FROM users WHERE provider = 'kakao' AND provider_id = 'kakao_profile_test'");
  });

  it('유효한 토큰으로 프로필 업데이트 성공', async () => {
    const res = await request(app)
      .patch('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ personal_color: 'spring_warm', preferred_styles: ['casual', 'minimal'] });
    expect(res.status).toBe(200);
    expect(res.body.user.personal_color).toBe('spring_warm');
  });

  it('토큰 없으면 401', async () => {
    const res = await request(app)
      .patch('/api/v1/auth/profile')
      .send({ personal_color: 'spring_warm' });
    expect(res.status).toBe(401);
  });
});
