require('dotenv').config();
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET env var is required');
}
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const authRoutes = require('./routes/auth');
const closetRoutes = require('./routes/closet');
const outfitRoutes = require('./routes/outfit');
const uploadRoutes = require('./routes/upload');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
// TODO: Restrict to known origins in production via ALLOWED_ORIGIN env var
app.use(cors());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ClosetFit API</title>
  <style>
    body { font-family: -apple-system, sans-serif; max-width: 700px; margin: 60px auto; padding: 0 20px; color: #222; }
    h1 { font-size: 2rem; margin-bottom: 4px; }
    .badge { display: inline-block; background: #22c55e; color: #fff; border-radius: 999px; padding: 2px 12px; font-size: 0.8rem; margin-bottom: 32px; }
    h2 { font-size: 1rem; color: #666; margin: 28px 0 8px; text-transform: uppercase; letter-spacing: 0.05em; }
    table { width: 100%; border-collapse: collapse; }
    td, th { padding: 10px 12px; text-align: left; border-bottom: 1px solid #f0f0f0; font-size: 0.92rem; }
    th { color: #888; font-weight: 500; }
    .method { font-weight: 700; font-size: 0.78rem; padding: 2px 8px; border-radius: 4px; }
    .get { background: #dbeafe; color: #1d4ed8; }
    .post { background: #dcfce7; color: #166534; }
    .patch { background: #fef9c3; color: #854d0e; }
    .delete { background: #fee2e2; color: #991b1b; }
    code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 0.88rem; }
  </style>
</head>
<body>
  <h1>👗 ClosetFit API</h1>
  <span class="badge">● 실행 중</span>
  <h2>인증</h2>
  <table>
    <tr><th>메서드</th><th>경로</th><th>설명</th></tr>
    <tr><td><span class="method post">POST</span></td><td><code>/api/v1/auth/social-login</code></td><td>소셜 로그인 (카카오/구글/애플)</td></tr>
    <tr><td><span class="method patch">PATCH</span></td><td><code>/api/v1/auth/profile</code></td><td>프로필 업데이트 (퍼스널컬러·스타일)</td></tr>
  </table>
  <h2>옷장</h2>
  <table>
    <tr><th>메서드</th><th>경로</th><th>설명</th></tr>
    <tr><td><span class="method post">POST</span></td><td><code>/api/v1/closet/items</code></td><td>옷 등록</td></tr>
    <tr><td><span class="method get">GET</span></td><td><code>/api/v1/closet/items</code></td><td>옷장 목록 조회</td></tr>
    <tr><td><span class="method get">GET</span></td><td><code>/api/v1/closet/items/:id</code></td><td>아이템 상세</td></tr>
    <tr><td><span class="method patch">PATCH</span></td><td><code>/api/v1/closet/items/:id</code></td><td>아이템 수정</td></tr>
    <tr><td><span class="method delete">DELETE</span></td><td><code>/api/v1/closet/items/:id</code></td><td>아이템 삭제</td></tr>
  </table>
  <h2>코디 추천</h2>
  <table>
    <tr><th>메서드</th><th>경로</th><th>설명</th></tr>
    <tr><td><span class="method get">GET</span></td><td><code>/api/v1/outfit/recommendations?base_item_id=...</code></td><td>색상 기반 코디 추천</td></tr>
  </table>
  <h2>헬스체크</h2>
  <table>
    <tr><td><span class="method get">GET</span></td><td><code>/health</code></td><td>서버 상태 확인</td></tr>
  </table>
</body>
</html>
  `);
});

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/closet', closetRoutes);
app.use('/api/v1/outfit', outfitRoutes);
app.use('/api/v1/upload', uploadRoutes);

app.use(errorHandler);

module.exports = app;
